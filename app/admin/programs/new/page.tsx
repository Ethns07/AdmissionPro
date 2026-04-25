'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
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
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewProgramPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newProgramId, setNewProgramId] = useState('');
  const [step, setStep] = useState(1);
  
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

  const [eligibilityRules, setEligibilityRules] = useState([
    { field: 'marks_12th', operator: '>=', value: 60 }
  ]);

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin'].includes(profile.role))) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
        const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        setCategories(cats);
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, category: cats[0].name }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
    const term = (imageSearchTerm || formData.name || 'education')
      .replace(/[^a-z0-9\s-]/gi, '') // Remove non-alphanumeric except spaces/dashes
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
    const results = [1, 2, 3, 4, 5, 6].map(i => 
      `https://picsum.photos/seed/${term}-${i}/800/600`
    );
    setSearchResults(results);
    if (!selectedImage) setSelectedImage(results[0]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const imageUrl = imageMode === 'url' ? customImageUrl : selectedImage;
      
      const programData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        imageUrl: imageUrl || `https://picsum.photos/seed/${formData.name.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '-').toLowerCase()}/800/600`,
        brochureUrl: formData.brochureUrl,
        feeStructure: {
          applicationFee: parseFloat(formData.applicationFee) || 0,
          admissionFee: parseFloat(formData.admissionFee) || 0
        },
        eligibilityRules: eligibilityRules.map(r => ({ ...r, value: parseFloat(r.value as any) })),
        meritFormula: formData.meritFormula,
        duration: formData.duration,
        deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
        isActive: formData.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'programs'), programData);
      setNewProgramId(docRef.id);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'programs');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  const steps = [
    { id: 1, name: 'Basic Info', icon: BookOpen },
    { id: 2, name: 'Program Image', icon: ImageIcon },
    { id: 3, name: 'Fees & Structure', icon: DollarSign },
    { id: 4, name: 'Eligibility', icon: FileText },
    { id: 5, name: 'Review', icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <Link href="/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Create New Program</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure a new academic offering for the institution.</p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  step >= s.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                  step >= s.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
                }`}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center"
              >
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <CheckCircle2 className="w-12 h-12" />
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-full shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                </div>
                
                <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">Program Created Successfully!</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg">
                  &quot;{formData.name}&quot; has been added to the academic catalog and is now live for student applications.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link 
                    href={`/programs/${newProgramId}`}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Live Program
                  </Link>
                  <button 
                    onClick={() => {
                      setSuccess(false);
                      setStep(1);
                      setFormData({
                        name: '',
                        description: '',
                        category: categories[0]?.name || '',
                        applicationFee: '',
                        admissionFee: '',
                        brochureUrl: '',
                        meritFormula: '(0.7 * marks_12th) + (0.3 * entrance_score)',
                        duration: '4 Years',
                        deadline: '',
                        isActive: true
                      });
                      setSelectedImage('');
                      setCustomImageUrl('');
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Create Another
                  </button>
                </div>
                
                <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800">
                  <Link href="/admin" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-sm">
                    Return to Admin Dashboard
                  </Link>
                </div>
              </motion.div>
            ) : step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 lg:p-12"
              >
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 dark:text-white">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Program Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="e.g. Bachelor of Computer Applications"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="Detailed program description..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                    <div className="flex gap-2">
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="flex-grow px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      <Link 
                        href="/admin/categories"
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Duration</label>
                    <input
                      type="text"
                      name="duration"
                      required
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="e.g. 4 Years"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Deadline (Optional)</label>
                    <input
                      type="datetime-local"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="text-sm font-bold text-slate-900 dark:text-white block">Visibility</label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Visible to students on programs page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isActive ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
                <div className="mt-12 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!formData.name || !formData.description}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                  >
                    Next: Program Image
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 lg:p-12"
              >
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 dark:text-white">
                  <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Program Image
                </h2>
                
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setImageMode('search')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                      imageMode === 'search' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Search Library
                  </button>
                  <button
                    onClick={() => setImageMode('url')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                      imageMode === 'url' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Custom URL
                  </button>
                </div>

                {imageMode === 'search' ? (
                  <div className="space-y-6">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search for images..."
                        value={imageSearchTerm}
                        onChange={(e) => setImageSearchTerm(e.target.value)}
                        className="flex-grow px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleImageSearch()}
                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                      >
                        Search
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {searchResults.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(url)}
                          className={`relative aspect-video rounded-2xl overflow-hidden border-4 transition-all ${
                            selectedImage === url ? 'border-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900/20' : 'border-transparent'
                          }`}
                        >
                          <Image src={url} alt="Result" fill className="object-cover" referrerPolicy="no-referrer" />
                          {selectedImage === url && (
                            <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    />
                    {customImageUrl && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={customImageUrl} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            // Hide broken images
                            (e.target as HTMLImageElement).style.opacity = '0';
                          }}
                          onLoad={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '1';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-12 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={imageMode === 'url' ? !customImageUrl : !selectedImage}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                  >
                    Next: Fees & Structure
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 lg:p-12"
              >
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 dark:text-white">
                  <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Fee Structure
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Application Fee ($)</label>
                    <input
                      type="number"
                      name="applicationFee"
                      value={formData.applicationFee}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Admission Fee ($)</label>
                    <input
                      type="number"
                      name="admissionFee"
                      value={formData.admissionFee}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="5000"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Program Brochure URL (Optional)</label>
                    <input
                      type="url"
                      name="brochureUrl"
                      value={formData.brochureUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="https://example.com/brochure.pdf"
                    />
                  </div>
                </div>
                <div className="mt-12 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    Next: Eligibility
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 lg:p-12"
              >
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 dark:text-white">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Eligibility & Merit
                </h2>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-900 dark:text-white">Eligibility Rules</label>
                      <button onClick={addRule} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Rule
                      </button>
                    </div>
                    {eligibilityRules.map((rule, index) => (
                      <div key={index} className="flex gap-3 items-end p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex-grow">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Field</label>
                          <select
                            value={rule.field}
                            onChange={(e) => handleRuleChange(index, 'field', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 dark:text-white"
                          >
                            <option value="marks_12th">12th Percentage</option>
                            <option value="math_score">Math Score</option>
                            <option value="entrance_score">Entrance Score</option>
                          </select>
                        </div>
                        <div className="w-20">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Op</label>
                          <select
                            value={rule.operator}
                            onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 dark:text-white"
                          >
                            <option value=">=">{'>='}</option>
                            <option value="==">{'=='}</option>
                          </select>
                        </div>
                        <div className="w-20">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Value</label>
                          <input
                            type="number"
                            value={rule.value}
                            onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                        <button onClick={() => removeRule(index)} className="p-2 text-rose-500 dark:text-rose-400">
                          <Plus className="w-5 h-5 rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Merit Formula</label>
                    <input
                      type="text"
                      name="meritFormula"
                      value={formData.meritFormula}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all font-mono text-sm bg-white dark:bg-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Variables: marks_12th, math_score, entrance_score</p>
                  </div>
                </div>
                <div className="mt-12 flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    Next: Review
                  </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 lg:p-12"
              >
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 dark:text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Review Program
                </h2>
                
                <div className="space-y-6">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 mb-8">
                    <Image 
                      src={imageMode === 'url' ? customImageUrl : selectedImage} 
                      alt="Program" 
                      fill 
                      className="object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-6">
                      <span className="text-indigo-400 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">{formData.category}</span>
                      <h3 className="text-2xl font-bold text-white">{formData.name}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Details</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">Duration:</span> {formData.duration}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">Deadline:</span> {formData.deadline || 'None'}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">Status:</span> {formData.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fees</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">Application:</span> ${formData.applicationFee || 0}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">Admission:</span> ${formData.admissionFee || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Eligibility</h4>
                    <div className="flex flex-wrap gap-2">
                      {eligibilityRules.map((r, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold">
                          {r.field.replace('_', ' ')} {r.operator} {r.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-between">
                  <button
                    onClick={() => setStep(4)}
                    disabled={submitting}
                    className="px-8 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-12 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Program'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

