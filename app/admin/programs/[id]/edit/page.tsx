'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { useRouter, useParams } from 'next/navigation';
import { 
  doc,
  getDoc,
  updateDoc,
  serverTimestamp, 
  getDocs, 
  collection,
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { 
  Plus, 
  BookOpen, 
  DollarSign, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditProgramPage() {
  const { id } = useParams();
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [imageSearchTerm, setImageSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [imageMode, setImageMode] = useState<'search' | 'url'>('search');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    applicationFee: '',
    admissionFee: '',
    brochureUrl: '',
    meritFormula: '(0.7 * marks_12th) + (0.3 * entrance_score)',
    duration: '4 Years',
    deadline: '',
    isActive: true
  });

  const [eligibilityRules, setEligibilityRules] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'super_admin')) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
        const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        setCategories(cats);

        // Fetch program
        const programSnap = await getDoc(doc(db, 'programs', id as string));
        if (programSnap.exists()) {
          const data = programSnap.data();
          setFormData({
            name: data.name || '',
            description: data.description || '',
            category: data.category || '',
            applicationFee: data.feeStructure?.applicationFee?.toString() || '',
            admissionFee: data.feeStructure?.admissionFee?.toString() || '',
            brochureUrl: data.brochureUrl || '',
            meritFormula: data.meritFormula || '',
            duration: data.duration || '',
            deadline: data.deadline ? new Date(data.deadline.seconds * 1000).toISOString().slice(0, 16) : '',
            isActive: data.isActive ?? true
          });
          setEligibilityRules(data.eligibilityRules || []);
          setSelectedImage(data.imageUrl || '');
          if (data.imageUrl && !data.imageUrl.includes('picsum.photos')) {
            setImageMode('url');
            setCustomImageUrl(data.imageUrl);
          }
        } else {
          alert('Program not found');
          router.push('/programs');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `programs/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...eligibilityRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setEligibilityRules(newRules);
  };

  const addRule = () => {
    setEligibilityRules([...eligibilityRules, { field: 'math_score', operator: '>=', value: 50 }]);
  };

  const removeRule = (index: number) => {
    setEligibilityRules(eligibilityRules.filter((_, i) => i !== index));
  };

  const handleImageSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = imageSearchTerm || formData.name || 'education';
    const results = [1, 2, 3, 4, 5, 6].map(i => 
      `https://picsum.photos/seed/${term.replace(/\s+/g, '-').toLowerCase()}-${i}/800/600`
    );
    setSearchResults(results);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const imageUrl = imageMode === 'url' ? customImageUrl : selectedImage;
      
      const programData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        imageUrl: imageUrl,
        brochureUrl: formData.brochureUrl,
        feeStructure: {
          applicationFee: parseFloat(formData.applicationFee),
          admissionFee: parseFloat(formData.admissionFee)
        },
        eligibilityRules: eligibilityRules.map(r => ({ ...r, value: parseFloat(r.value as any) })),
        meritFormula: formData.meritFormula,
        duration: formData.duration,
        deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'programs', id as string), programData);
      alert('Program updated successfully!');
      router.push(`/programs/${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `programs/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href={`/programs/${id}`} className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Program
            </Link>
            <h1 className="text-3xl font-display font-bold text-slate-900">Edit Program</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Program Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="e.g. Bachelor of Computer Applications"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="Detailed program description..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <div className="flex gap-2">
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="flex-grow px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Duration</label>
                <input
                  type="text"
                  name="duration"
                  required
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="e.g. 4 Years"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Application Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400">Specific deadline for this program.</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-900 block">Program Visibility</label>
                  <p className="text-xs text-slate-500">Active programs are visible to students on the programs page.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
                    formData.isActive ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Program Image
                </label>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setImageMode('search')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    imageMode === 'search' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  Search Images
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    imageMode === 'url' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  Custom URL
                </button>
              </div>

                  {imageMode === 'search' ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search for images..."
                          value={imageSearchTerm}
                          onChange={(e) => setImageSearchTerm(e.target.value)}
                          className="flex-grow px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageSearch()}
                          className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all text-sm"
                        >
                          Search
                        </button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {searchResults.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedImage(url)}
                              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImage === url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-slate-300'
                              }`}
                            >
                              <Image 
                                src={url} 
                                alt={`Search result ${idx}`} 
                                fill 
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="url"
                        placeholder="Enter image URL (https://...)"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                      />
                    </div>
                  )}

                  {(selectedImage || customImageUrl) && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-3">Selected Preview</p>
                      <div className="relative aspect-video max-w-xs rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
                        <Image 
                          src={imageMode === 'url' ? customImageUrl : selectedImage} 
                          alt="Final Selection Preview" 
                          fill 
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Detailed Fee Structure URL (Optional)
                </label>
                <input
                  type="url"
                  name="brochureUrl"
                  value={formData.brochureUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="https://example.com/fees.pdf"
                />
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-slate-400" /> Fee Structure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Application Fee ($)</label>
                <input
                  type="number"
                  name="applicationFee"
                  required
                  value={formData.applicationFee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Admission Fee ($)</label>
                <input
                  type="number"
                  name="admissionFee"
                  required
                  value={formData.admissionFee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="5000"
                />
              </div>
            </div>
          </div>

          {/* Eligibility & Merit */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" /> Eligibility & Merit
            </h2>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Eligibility Rules</label>
                  <button
                    type="button"
                    onClick={addRule}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Rule
                  </button>
                </div>
                {eligibilityRules.map((rule, index) => (
                  <div key={index} className="flex flex-wrap gap-3 items-end p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex-grow min-w-[150px] space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Field</label>
                      <select
                        value={rule.field}
                        onChange={(e) => handleRuleChange(index, 'field', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      >
                        <option value="marks_12th">12th Percentage</option>
                        <option value="math_score">Math Score</option>
                        <option value="entrance_score">Entrance Score</option>
                      </select>
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Op</label>
                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      >
                        <option value=">=">{'>='}</option>
                        <option value=">">{'>'}</option>
                        <option value="==">{'=='}</option>
                      </select>
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Value</label>
                      <input
                        type="number"
                        value={rule.value}
                        onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Merit Formula</label>
                <input
                  type="text"
                  name="meritFormula"
                  required
                  value={formData.meritFormula}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-sm"
                />
                <p className="text-xs text-slate-400">Available variables: marks_12th, math_score, entrance_score</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-grow py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Save className="w-5 h-5" />
                  Update Program
                </>
              )}
            </button>
            <Link
              href={`/programs/${id}`}
              className="px-8 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
