'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType, formatTimestamp } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  CreditCard,
  Loader2,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const { user, profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'applications', id as string), (docSnap) => {
      if (docSnap.exists()) {
        setApplication({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `applications/${id}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Application Not Found</h1>
        <button onClick={() => router.push('/dashboard')} className="mt-4 text-slate-900 dark:text-white font-bold hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isOwner = user?.uid === application.studentUid;
  const isStaff = ['admin', 'super_admin', 'admission_officer'].includes(profile?.role || '');

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'applications', id as string));
      router.push('/admin/applications');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `applications/${id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateOfferLetter = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('OFFER OF ADMISSION', 105, 40, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    doc.text(`Application ID: ${application.id}`, 20, 67);
    
    // Body
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Dear ${application.studentName},`, 20, 85);
    
    doc.setFontSize(12);
    doc.text(`We are pleased to offer you provisional admission to the following program for the ${application.sessionName}:`, 20, 100, { maxWidth: 170 });
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Program: ${application.programName}`, 20, 115);
    doc.setFont('helvetica', 'normal');
    
    doc.text('This offer is subject to the following conditions:', 20, 130);
    
    const conditions = application.offerConditions || [
      '1. Submission of original academic transcripts for verification.',
      '2. Payment of the admission fee by the specified deadline.',
      '3. Maintaining the minimum eligibility criteria as per university norms.'
    ];
    
    let yPos = 140;
    if (Array.isArray(conditions)) {
      conditions.forEach((condition: string) => {
        const splitText = doc.splitTextToSize(condition, 160);
        doc.text(splitText, 25, yPos);
        yPos += (splitText.length * 7);
      });
    } else {
      const splitText = doc.splitTextToSize(conditions, 160);
      doc.text(splitText, 25, yPos);
      yPos += (splitText.length * 7);
    }
    
    doc.text('Congratulations on your achievement! We look forward to welcoming you to our academic community.', 20, yPos + 10, { maxWidth: 170 });
    
    // Footer
    doc.setFontSize(10);
    doc.text('Registrar, Admissions Office', 20, 270);
    doc.text('University Management System', 20, 275);
    
    doc.save(`Offer_Letter_${application.studentName.replace(/\s+/g, '_')}.pdf`);
  };

  if (!isOwner && !isStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400">You do not have permission to view this application.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-slate-400 dark:text-slate-500">ID: {application.id}</span>
              <StatusBadge status={application.status} />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">{application.programName}</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-slate-500 dark:text-slate-400">{application.sessionName}</p>
              {application.sessionDeadline && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Deadline: {formatTimestamp(application.sessionDeadline)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {application.status === 'offer_extended' && (
              <button 
                onClick={generateOfferLetter}
                className="px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg dark:shadow-indigo-900/20"
              >
                <Download className="w-5 h-5" />
                Download Offer Letter
              </button>
            )}
            {application.paymentStatus === 'pending' && isOwner && (
              <button className="px-6 py-3 bg-green-600 dark:bg-emerald-600 text-white rounded-xl font-bold hover:bg-green-700 dark:hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100 dark:shadow-emerald-900/20">
                <CreditCard className="w-5 h-5" />
                Pay Admission Fee
              </button>
            )}
            {isStaff && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-rose-500/20"
                title="Delete Application"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Application Progress */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-6 dark:text-white">Application Status</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-0 relative">
                  <TimelineItem 
                    title="Application Submitted" 
                    date={application.createdAt?.toDate ? application.createdAt.toDate().toLocaleDateString() : new Date(application.createdAt).toLocaleDateString()} 
                    status="completed" 
                    desc="Your application has been successfully received."
                    isActive={false}
                  />
                  <TimelineItem 
                    title="Document Verification" 
                    status={['eligible', 'offer_extended', 'enrolled'].includes(application.status) ? 'completed' : 'pending'} 
                    desc="Our team is verifying your uploaded documents."
                    isActive={application.status === 'pending'}
                  />
                  <TimelineItem 
                    title="Eligibility Review" 
                    status={['eligible', 'offer_extended', 'enrolled'].includes(application.status) ? 'completed' : application.status === 'not_eligible' ? 'failed' : 'pending'} 
                    desc="Rule-based system is evaluating your academic criteria."
                    isActive={['not_eligible', 'waitlist'].includes(application.status)}
                  />
                  <TimelineItem 
                    title="Final Offer" 
                    status={['offer_extended', 'enrolled'].includes(application.status) ? 'completed' : 'pending'} 
                    desc="Provisional admission offer will be issued after review."
                    isActive={application.status === 'eligible'}
                  />
                </div>
              </div>
            </div>

            {/* Form Data */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-6 dark:text-white">Submitted Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DetailItem icon={User} label="Full Name" value={application.studentName} />
                <DetailItem icon={Mail} label="Email" value={application.studentEmail} />
                <DetailItem icon={Phone} label="Phone" value={application.formData?.phone || 'N/A'} />
                <DetailItem icon={MapPin} label="Address" value={application.formData?.address || 'N/A'} />
                <DetailItem icon={FileText} label="12th Marks" value={`${application.formData?.marks_12th}%`} />
                <DetailItem icon={FileText} label="Math Score" value={application.formData?.math_score} />
                <DetailItem icon={Trophy} label="Merit Score" value={application.meritScore?.toFixed(2)} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                <CreditCard className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Payment Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Application Fee</span>
                  <span className="font-bold text-slate-900 dark:text-white">$100.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Payment Status</span>
                  <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                    application.paymentStatus === 'paid' ? 'bg-green-100 dark:bg-emerald-500/20 text-green-700 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                  }`}>
                    {application.paymentStatus}
                  </span>
                </div>
                {application.paymentDetails && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 dark:text-slate-500">Receipt #</span>
                      <span className="text-slate-600 dark:text-slate-300">{application.paymentDetails.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 dark:text-slate-500">Method</span>
                      <span className="text-slate-600 dark:text-slate-300 capitalize">{application.paymentDetails.method}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Documents
              </h2>
              <div className="space-y-3">
                {application.documents?.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                        <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{doc.type}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-rose-500/10 text-red-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Application?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                This action cannot be undone. All data associated with this application will be permanently removed.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TimelineItem = ({ title, date, status, desc, isActive }: any) => {
  const icons: any = {
    completed: <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-emerald-500" />,
    pending: <Clock className="w-5 h-5 text-slate-300 dark:text-slate-700" />,
    failed: <XCircle className="w-5 h-5 text-red-500 dark:text-rose-500" />,
  };

  return (
    <div className={`flex gap-6 relative transition-all duration-500 ${isActive ? 'scale-[1.02]' : ''}`}>
      <div className="relative z-10">
        <div className={`p-1 rounded-full bg-white dark:bg-slate-900 transition-all duration-500 ${
          isActive ? 'ring-4 ring-indigo-500/20 dark:ring-indigo-500/10 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : ''
        }`}>
          {isActive && status === 'pending' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              {icons[status]}
            </motion.div>
          ) : icons[status]}
        </div>
      </div>
      <div className={`flex-grow pb-8 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold text-sm transition-colors duration-300 ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 
            status === 'pending' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'
          }`}>
            {title}
            {isActive && (
              <span className="ml-2 py-0.5 px-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                Current
              </span>
            )}
          </h3>
          {date && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{date}</span>}
        </div>
        <p className={`text-xs transition-colors duration-300 ${
          isActive ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'
        } leading-relaxed`}>
          {desc}
        </p>
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
    </div>
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white">{value || 'N/A'}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400",
    eligible: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
    not_eligible: "bg-red-100 dark:bg-rose-500/20 text-red-700 dark:text-rose-400",
    waitlist: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400",
    offer_extended: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
    enrolled: "bg-green-100 dark:bg-emerald-500/20 text-green-700 dark:text-emerald-400",
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${styles[status] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

