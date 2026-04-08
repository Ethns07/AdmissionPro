'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType, formatTimestamp } from '@/lib/firestore-utils';
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Application Not Found</h1>
        <button onClick={() => router.push('/dashboard')} className="mt-4 text-slate-900 font-bold hover:underline">
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-slate-500">You do not have permission to view this application.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-slate-400">ID: {application.id}</span>
              <StatusBadge status={application.status} />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900">{application.programName}</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-slate-500">{application.sessionName}</p>
              {application.sessionDeadline && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
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
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Offer Letter
              </button>
            )}
            {application.paymentStatus === 'pending' && isOwner && (
              <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100">
                <CreditCard className="w-5 h-5" />
                Pay Admission Fee
              </button>
            )}
            {isStaff && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
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
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-6">Application Status</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                <div className="space-y-8 relative">
                  <TimelineItem 
                    title="Application Submitted" 
                    date={application.createdAt?.toDate().toLocaleDateString()} 
                    status="completed" 
                    desc="Your application has been successfully received."
                  />
                  <TimelineItem 
                    title="Document Verification" 
                    status={['eligible', 'offer_extended', 'enrolled'].includes(application.status) ? 'completed' : 'pending'} 
                    desc="Our team is verifying your uploaded documents."
                  />
                  <TimelineItem 
                    title="Eligibility Review" 
                    status={['eligible', 'offer_extended', 'enrolled'].includes(application.status) ? 'completed' : application.status === 'not_eligible' ? 'failed' : 'pending'} 
                    desc="Rule-based system is evaluating your academic criteria."
                  />
                  <TimelineItem 
                    title="Final Offer" 
                    status={['offer_extended', 'enrolled'].includes(application.status) ? 'completed' : 'pending'} 
                    desc="Provisional admission offer will be issued after review."
                  />
                </div>
              </div>
            </div>

            {/* Form Data */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-6">Submitted Details</h2>
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
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-400" /> Payment Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Application Fee</span>
                  <span className="font-bold text-slate-900">$100.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Status</span>
                  <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                    application.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {application.paymentStatus}
                  </span>
                </div>
                {application.paymentDetails && (
                  <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Receipt #</span>
                      <span className="text-slate-600">{application.paymentDetails.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Method</span>
                      <span className="text-slate-600 capitalize">{application.paymentDetails.method}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" /> Documents
              </h2>
              <div className="space-y-3">
                {application.documents?.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 capitalize">{doc.type}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
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
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Application?</h3>
              <p className="text-slate-500 text-center mb-8">
                This action cannot be undone. All data associated with this application will be permanently removed.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
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

const TimelineItem = ({ title, date, status, desc }: any) => {
  const icons: any = {
    completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    pending: <Clock className="w-5 h-5 text-slate-300" />,
    failed: <XCircle className="w-5 h-5 text-red-500" />,
  };

  return (
    <div className="flex gap-6">
      <div className="relative z-10 bg-white p-1">
        {icons[status]}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold text-sm ${status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>{title}</h3>
          {date && <span className="text-[10px] text-slate-400 font-medium">{date}</span>}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-slate-50 rounded-lg">
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <div>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: "bg-orange-100 text-orange-700",
    eligible: "bg-blue-100 text-blue-700",
    not_eligible: "bg-red-100 text-red-700",
    waitlist: "bg-purple-100 text-purple-700",
    offer_extended: "bg-indigo-100 text-indigo-700",
    enrolled: "bg-green-100 text-green-700",
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

