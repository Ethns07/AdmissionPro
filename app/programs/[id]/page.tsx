'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { doc, getDoc, collection, query, where, getDocs, limit, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType, formatTimestamp } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Info,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Edit,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProgramDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useFirebase();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!program) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'programs', program.id));
      router.push('/programs');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programs/${program.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        // Fetch program details
        const programDoc = await getDoc(doc(db, 'programs', id as string));
        if (programDoc.exists()) {
          setProgram({ id: programDoc.id, ...programDoc.data() });
        } else {
          // Program not found
          setProgram(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `programs/${id}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProgramData();
    }
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!program || (program.isActive === false && !['admin', 'super_admin', 'admission_officer'].includes(profile?.role || ''))) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {!program ? 'Program Not Found' : 'Program Unavailable'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              {!program 
                ? 'The program you are looking for does not exist or has been removed.'
                : 'This program is currently not accepting new applications.'}
            </p>
            <Link 
              href="/programs"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Programs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const deadline = program.deadline;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden">
        <Image 
          src={program.imageUrl || `https://picsum.photos/seed/${program.id}/1920/1080`}
          alt={program.name}
          fill
          className="object-cover"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <Link href="/programs" className="text-white/70 hover:text-white transition-colors flex items-center text-sm font-medium">
                  Programs
                </Link>
                <ChevronRight className="w-4 h-4 text-white/40" />
                <span className="text-white/90 text-sm font-medium">{program.category || 'General'}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight">
                {program.name}
              </h1>
              
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm font-medium">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-300" />
                  {program.duration || '4 Years Full-time'}
                </div>
                {deadline && (
                  <div className="flex items-center px-4 py-2 bg-amber-500/20 backdrop-blur-md rounded-full border border-amber-500/30 text-amber-200 text-sm font-medium">
                    <Clock className="w-4 h-4 mr-2" />
                    Deadline: {formatTimestamp(deadline)}
                  </div>
                )}
                {profile?.role === 'super_admin' && (
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/programs/${program.id}/edit`}
                      className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 backdrop-blur-md rounded-full border border-slate-700 text-white text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Program
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center px-4 py-2 bg-rose-600/20 hover:bg-rose-600/40 backdrop-blur-md rounded-full border border-rose-500/30 text-rose-200 text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                <Trash2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
                Permanently delete program?
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                You are about to delete <span className="font-bold text-slate-900 dark:text-white">&quot;{program?.name}&quot;</span>. 
                This action cannot be undone. All future applications to this program will be blocked, and this page will no longer be accessible.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  No, Keep it
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-4 px-6 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Description */}
            <section>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                About the Program
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  {program.description}
                </p>
              </div>
            </section>

            {/* Eligibility Rules */}
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                Eligibility Criteria
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {program.eligibilityRules && program.eligibilityRules.length > 0 ? (
                  program.eligibilityRules.map((rule: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                          {rule.field.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Minimum required: <span className="font-semibold text-slate-900 dark:text-white">{rule.value}{rule.field.includes('marks') || rule.field.includes('score') ? '%' : ''}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic col-span-2">No specific eligibility rules defined for this program.</p>
                )}
              </div>
              {program.meritFormula && (
                <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Merit Calculation</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                      Admission is based on a merit score calculated as: <code className="bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded font-mono text-indigo-800 dark:text-indigo-300">{program.meritFormula}</code>
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Curriculum/Structure Placeholder */}
            <section>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Program Structure
              </h2>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Our curriculum is designed to provide a balanced mix of theoretical knowledge and practical skills. 
                  Students will engage in core subjects, electives, and hands-on projects throughout the {program.duration || '4-year'} duration.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Core Foundations</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Essential principles and fundamental concepts in {program.category || 'the field'}.</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Specializations</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Advanced topics and elective tracks to tailor your learning experience.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Program Overview Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-slate-900 dark:text-white" />
                Program Overview
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Duration</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{program.duration || '4 Years Full-time'}</p>
                  </div>
                </div>
                
                {deadline && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Application Deadline</p>
                      <p className="text-slate-900 dark:text-white font-semibold">{formatTimestamp(deadline)}</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">Applications close at 11:59 PM</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{program.category || 'General'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Structure Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 sticky top-24">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-900 dark:text-white" />
                Fee Structure
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Application Fee</span>
                  <span className="font-bold text-slate-900 dark:text-white">${program.feeStructure?.applicationFee || 100}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Admission Fee</span>
                  <span className="font-bold text-slate-900 dark:text-white">${program.feeStructure?.admissionFee || 5000}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Tuition (per sem)</span>
                  <span className="font-bold text-slate-900 dark:text-white">${program.feeStructure?.tuitionFee || 'TBD'}</span>
                </div>
              </div>

              {program.brochureUrl && (
                <a 
                  href={program.brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mb-4"
                >
                  <FileText className="w-4 h-4" />
                  Download Brochure
                </a>
              )}

              <Link
                href={`/apply/${program.id}`}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg dark:shadow-indigo-900/20 group"
              >
                Apply for this Program
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Contact Card */}
            <div className="bg-slate-900 dark:bg-indigo-950 p-8 rounded-3xl shadow-xl text-white">
              <h4 className="font-bold mb-2 text-indigo-100">Need Help?</h4>
              <p className="text-sm text-indigo-300 mb-6">Our admission counselors are here to guide you through the process.</p>
              <button className="w-full p-3 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
                Contact Admissions
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
