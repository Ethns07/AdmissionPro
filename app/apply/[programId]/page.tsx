'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType, formatTimestamp } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { sendNotificationEmail, EMAIL_TEMPLATES } from '@/lib/notifications';

export default function ApplyPage() {
  const { programId } = useParams();
  const { user, profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    marks_12th: '',
    math_score: '',
    entrance_score: '',
    category: 'general'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/apply/${programId}`);
    }
  }, [user, authLoading, router, programId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const progDoc = await getDoc(doc(db, 'programs', programId as string));
        if (progDoc.exists()) {
          setProgram({ id: progDoc.id, ...progDoc.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'programs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [programId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !program) return;

    setSubmitting(true);
    try {
      // Calculate eligibility (Rule-Based System)
      let status = 'pending';
      const marks = parseFloat(formData.marks_12th);
      const math = parseFloat(formData.math_score);
      const entrance = parseFloat(formData.entrance_score) || 0;

      // Simple rule evaluation logic
      const rules = program.eligibilityRules || [];
      let isEligible = true;
      
      for (const rule of rules) {
        const val = parseFloat(formData[rule.field as keyof typeof formData] as string);
        if (rule.operator === '>=' && val < rule.value) isEligible = false;
        if (rule.operator === '>' && val <= rule.value) isEligible = false;
      }

      if (!isEligible) {
        status = 'not_eligible';
      } else {
        // Merit calculation
        // Formula: (0.7 * marks_12th) + (0.3 * entrance_score)
        const meritScore = (0.7 * marks) + (0.3 * entrance);
        
        const applicationData = {
          studentUid: user.uid,
          studentName: formData.fullName,
          studentEmail: formData.email,
          programId: program.id,
          programName: program.name,
          instituteId: program.instituteId || 'GLOBAL',
          sessionDeadline: program.deadline,
          status: 'pending', // Initially pending for officer review
          formData: {
            ...formData,
            marks_12th: marks,
            math_score: math,
            entrance_score: entrance
          },
          documents: [
            { type: 'photo', status: 'uploaded', url: 'https://picsum.photos/200' },
            { type: 'signature', status: 'uploaded', url: 'https://picsum.photos/200/100' }
          ],
          paymentStatus: 'pending',
          meritScore: meritScore,
          isOffline: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'applications'), applicationData);

        // Send confirmation email
        if (formData.email) {
          const template = EMAIL_TEMPLATES.APPLICATION_RECEIVED(formData.fullName || 'Student', program.name);
          // Fire and forget email sending to not block UI success
          sendNotificationEmail(formData.email, template.subject, template.html);
        }

        setStep(3); // Success step
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applications');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  if (!program || (program.isActive === false && !['admin', 'super_admin', 'admission_officer'].includes(profile?.role || ''))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {!program ? 'Program Not Found' : 'Applications Closed'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md">
          {!program 
            ? 'The program you are trying to apply for does not exist.'
            : 'Applications for this program are currently closed. Please check back later or explore other programs.'}
        </p>
        <button onClick={() => router.push('/programs')} className="mt-6 px-6 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all">
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Apply for {program.name}</h1>
          <div className="flex flex-col items-center gap-1">
            {program.deadline && (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-500/20">
                Application Deadline: {formatTimestamp(program.deadline)}
              </p>
            )}
          </div>
        </div>

        {/* Program Fees Section */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Application Fee</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">${program.feeStructure?.applicationFee || 0}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Admission Fee</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">${program.feeStructure?.admissionFee || 0}</p>
              </div>
            </div>
            {program.brochureUrl && (
              <a 
                href={program.brochureUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Fee Structure
              </a>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= s ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
              }`}>
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 border-t-2 ${step > s ? 'border-slate-900 dark:border-indigo-600' : 'border-slate-200 dark:border-slate-800'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 overflow-hidden">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 lg:p-12">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-white">
                <User className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Personal Information
              </h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                    <option value="sports">Sports Quota</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 p-6 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-400" />
                        Auto-Fetch Academic Records
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Connect to National Student Record System (NSRS) to verify marks</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Student ID (e.g. NSRS-123)"
                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm outline-none focus:bg-white/20 transition-all"
                        id="nsrs-id"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const id = (document.getElementById('nsrs-id') as HTMLInputElement).value;
                          if (!id) return alert("Please enter a Student ID");
                          
                          // Simulate API Call
                          setSubmitting(true);
                          setTimeout(() => {
                            const mockData: any = {
                              'NSRS-123': { fullName: 'John Doe', marks_12th: '88.5', math_score: '92' },
                              'NSRS-456': { fullName: 'Jane Smith', marks_12th: '94.2', math_score: '98' }
                            };
                            
                            const result = mockData[id];
                            if (result) {
                              setFormData(prev => ({ ...prev, ...result }));
                              alert("Records verified and fetched successfully!");
                            } else {
                              alert("No records found for this ID in the NSRS database.");
                            }
                            setSubmitting(false);
                          }, 1500);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch & Verify'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Residential Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="123 Main St, City, Country"
                  />
                </div>
                <div className="md:col-span-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all"
                  >
                    Continue to Academic Details
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 lg:p-12">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-white">
                <GraduationCap className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Academic Details
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">12th Grade Percentage (%)</label>
                  <input
                    type="number"
                    name="marks_12th"
                    required
                    step="0.01"
                    value={formData.marks_12th}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="e.g. 85.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mathematics Score</label>
                  <input
                    type="number"
                    name="math_score"
                    required
                    value={formData.math_score}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="e.g. 90"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Entrance Score (Optional)</label>
                  <input
                    type="number"
                    name="entrance_score"
                    value={formData.entrance_score}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="e.g. 150"
                  />
                </div>
                
                <div className="md:col-span-2 pt-6 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">Document Upload Required</p>
                      <p>Please ensure you have scanned copies of your 10th & 12th marksheets, and a valid ID proof ready for verification.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">Application Submitted!</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Your application for <strong>{program.name}</strong> has been received. 
                Our admission team will review your details and update you shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => router.push('/programs')}
                  className="px-8 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Browse More Programs
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
