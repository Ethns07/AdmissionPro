'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType, formatTimestamp } from '@/lib/firestore-utils';
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
  Edit
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProgramDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useFirebase();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return null;

  if (!program || (program.isActive === false && !['admin', 'super_admin', 'admission_officer'].includes(profile?.role || ''))) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info className="w-10 h-10 text-slate-300" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {!program ? 'Program Not Found' : 'Program Unavailable'}
            </h1>
            <p className="text-slate-500 mb-8">
              {!program 
                ? 'The program you are looking for does not exist or has been removed.'
                : 'This program is currently not accepting new applications.'}
            </p>
            <Link 
              href="/programs"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
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
    <div className="min-h-screen bg-slate-50">
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
                  <Link
                    href={`/admin/programs/${program.id}/edit`}
                    className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 backdrop-blur-md rounded-full border border-slate-700 text-white text-sm font-medium transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Program
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Description */}
            <section>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-indigo-600" />
                About the Program
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-600 leading-relaxed">
                  {program.description}
                </p>
              </div>
            </section>

            {/* Eligibility Rules */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                Eligibility Criteria
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {program.eligibilityRules && program.eligibilityRules.length > 0 ? (
                  program.eligibilityRules.map((rule: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 capitalize">
                          {rule.field.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-slate-600">
                          Minimum required: <span className="font-semibold text-slate-900">{rule.value}{rule.field.includes('marks') || rule.field.includes('score') ? '%' : ''}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic col-span-2">No specific eligibility rules defined for this program.</p>
                )}
              </div>
              {program.meritFormula && (
                <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Merit Calculation</p>
                    <p className="text-xs text-indigo-700 mt-1">
                      Admission is based on a merit score calculated as: <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono text-indigo-800">{program.meritFormula}</code>
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Curriculum/Structure Placeholder */}
            <section>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Program Structure
              </h2>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Our curriculum is designed to provide a balanced mix of theoretical knowledge and practical skills. 
                  Students will engage in core subjects, electives, and hands-on projects throughout the {program.duration || '4-year'} duration.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-2">Core Foundations</h4>
                    <p className="text-sm text-slate-500">Essential principles and fundamental concepts in {program.category || 'the field'}.</p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-2">Specializations</h4>
                    <p className="text-sm text-slate-500">Advanced topics and elective tracks to tailor your learning experience.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Program Overview Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-slate-900" />
                Program Overview
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                    <p className="text-slate-900 font-semibold">{program.duration || '4 Years Full-time'}</p>
                  </div>
                </div>
                
                {deadline && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Application Deadline</p>
                      <p className="text-slate-900 font-semibold">{formatTimestamp(deadline)}</p>
                      <p className="text-[10px] text-amber-600 font-medium mt-1">Applications close at 11:59 PM</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</p>
                    <p className="text-slate-900 font-semibold">{program.category || 'General'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Structure Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-900" />
                Fee Structure
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-500 text-sm">Application Fee</span>
                  <span className="font-bold text-slate-900">${program.feeStructure?.applicationFee || 100}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-500 text-sm">Admission Fee</span>
                  <span className="font-bold text-slate-900">${program.feeStructure?.admissionFee || 5000}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 text-sm">Tuition (per sem)</span>
                  <span className="font-bold text-slate-900">${program.feeStructure?.tuitionFee || 'TBD'}</span>
                </div>
              </div>

              {program.brochureUrl && (
                <a 
                  href={program.brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors mb-4"
                >
                  <FileText className="w-4 h-4" />
                  Download Brochure
                </a>
              )}

              <Link
                href={`/apply/${program.id}`}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 group"
              >
                Apply for this Program
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Contact Card */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
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
}
