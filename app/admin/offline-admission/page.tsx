'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  DollarSign, 
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { sendNotificationEmail, EMAIL_TEMPLATES } from '@/lib/notifications';

export default function OfflineAdmissionPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    address: '',
    programId: '',
    marks_12th: '',
    math_score: '',
    entrance_score: '',
    paymentMethod: 'cash',
    paymentAmount: '',
    receiptNumber: ''
  });

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin', 'admission_officer'].includes(profile.role))) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let qRef = query(collection(db, 'programs'), where('isActive', '==', true));
        if (profile?.role !== 'super_admin' && profile?.instituteId) {
          qRef = query(collection(db, 'programs'), where('isActive', '==', true), where('instituteId', '==', profile.instituteId));
        }
        
        const progSnap = await getDocs(qRef);
        const progs = progSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPrograms(progs);
        if (progs.length > 0) setFormData(prev => ({ ...prev, programId: progs[0].id }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'programs');
      } finally {
        setLoading(false);
      }
    };
    if (profile) fetchData();
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedProgram = programs.find(p => p.id === formData.programId);

      // 1. Create Application
      const applicationData = {
        studentUid: `offline_${Date.now()}`, // Placeholder for offline students
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        programId: formData.programId,
        programName: selectedProgram?.name || '',
        instituteId: profile?.instituteId || 'GLOBAL',
        status: 'pending',
        isOffline: true,
        paymentStatus: 'paid',
        paymentDetails: {
          method: formData.paymentMethod,
          amount: parseFloat(formData.paymentAmount),
          receiptNumber: formData.receiptNumber,
          date: new Date().toISOString()
        },
        formData: {
          fullName: formData.studentName,
          email: formData.studentEmail,
          phone: formData.studentPhone,
          address: formData.address,
          marks_12th: parseFloat(formData.marks_12th),
          math_score: parseFloat(formData.math_score),
          entrance_score: parseFloat(formData.entrance_score) || 0
        },
        documents: [],
        meritScore: (0.7 * parseFloat(formData.marks_12th)) + (0.3 * (parseFloat(formData.entrance_score) || 0)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const appRef = await addDoc(collection(db, 'applications'), applicationData);

      // 2. Create Payment Record
      await addDoc(collection(db, 'payments'), {
        applicationId: appRef.id,
        amount: parseFloat(formData.paymentAmount),
        method: formData.paymentMethod,
        receiptNumber: formData.receiptNumber,
        studentEmail: formData.studentEmail,
        studentName: formData.studentName,
        programName: selectedProgram?.name || '',
        date: serverTimestamp(),
        status: 'completed'
      });

      // 3. Send emails
      if (formData.studentEmail) {
        // Send Application Confirmation
        const appTemplate = EMAIL_TEMPLATES.APPLICATION_RECEIVED(formData.studentName, selectedProgram?.name || '');
        sendNotificationEmail(formData.studentEmail, appTemplate.subject, appTemplate.html);

        // Send Payment Confirmation (since it's marked as paid immediately)
        const payTemplate = EMAIL_TEMPLATES.PAYMENT_CONFIRMED(formData.studentName, selectedProgram?.name || '', parseFloat(formData.paymentAmount));
        sendNotificationEmail(formData.studentEmail, payTemplate.subject, payTemplate.html);
      }

      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applications/payments');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-800"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">Application Created!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            The offline application for <strong>{formData.studentName}</strong> has been successfully recorded and marked as paid.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  studentName: '',
                  studentEmail: '',
                  studentPhone: '',
                  address: '',
                  programId: programs[0]?.id || '',
                  marks_12th: '',
                  math_score: '',
                  entrance_score: '',
                  paymentMethod: 'cash',
                  paymentAmount: '',
                  receiptNumber: ''
                });
              }}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
            >
              Create Another
            </button>
            <Link
              href="/admin/applications"
              className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all block"
            >
              Back to Applications
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin/applications" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Applications
            </Link>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">New Offline Application</h1>
            <p className="text-slate-500 dark:text-slate-400">Manually record an application received at the admission desk</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Student Details */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <User className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Student Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  name="studentName"
                  required
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  name="studentEmail"
                  required
                  value={formData.studentEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  name="studentPhone"
                  required
                  value={formData.studentPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Residential Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  placeholder="123 Main St, City, Country"
                />
              </div>
            </div>
          </section>

          {/* Program & Academic */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <GraduationCap className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Program & Academics
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Program</label>
                <select
                  name="programId"
                  required
                  value={formData.programId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">12th Grade %</label>
                  <input
                    type="number"
                    name="marks_12th"
                    required
                    step="0.01"
                    value={formData.marks_12th}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="85.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Entrance Score</label>
                  <input
                    type="number"
                    name="entrance_score"
                    value={formData.entrance_score}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Payment Details */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <CreditCard className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Payment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Method</label>
                <select
                  name="paymentMethod"
                  required
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="dd">Demand Draft (DD)</option>
                  <option value="online">Online Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount Paid ($)</label>
                <input
                  type="number"
                  name="paymentAmount"
                  required
                  value={formData.paymentAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  placeholder="e.g. 100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Receipt / Ref Number</label>
                <input
                  type="text"
                  name="receiptNumber"
                  required
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  placeholder="REC-12345"
                />
              </div>
            </div>
          </section>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 dark:shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Offline Application'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
