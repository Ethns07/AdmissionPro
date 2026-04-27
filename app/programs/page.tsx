'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { collection, onSnapshot, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType, formatTimestamp } from '@/lib/firestore-utils';
import { BookOpen, ArrowRight, GraduationCap, DollarSign, Calendar, Clock, FileText, Search, X, EyeOff, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

import Image from 'next/image';

export default function ProgramsPage() {
  const { profile } = useFirebase();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string>('all');

  useEffect(() => {
    // Fetch institutes
    const unsubscribeInstitutes = onSnapshot(collection(db, 'institutes'), (snapshot) => {
      setInstitutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const isAdmin = profile && ['admin', 'super_admin', 'admission_officer'].includes(profile.role);
    
    let q;
    if (profile?.role === 'super_admin') {
      q = query(collection(db, 'programs'));
    } else if (isAdmin && profile?.instituteId) {
      // Show their own programs (active or inactive)
      q = query(collection(db, 'programs'), where('instituteId', '==', profile.instituteId));
    } else {
      // Guest or staff without institute assigned yet: only active programs
      q = query(collection(db, 'programs'), where('isActive', '==', true));
    }

    const unsubscribePrograms = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrograms(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'programs');
      setLoading(false);
    });

    return () => {
      unsubscribeInstitutes();
      unsubscribePrograms();
    };
  }, [profile]);

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = 
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (program.category && program.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesInstitute = selectedInstitute === 'all' || program.instituteId === selectedInstitute;
    
    return matchesSearch && matchesInstitute;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100 dark:border-indigo-500/20"
          >
            <GraduationCap className="w-4 h-4" />
            Academic Excellence
          </motion.div>
          <h1 className="text-5xl font-display font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Academic Programs</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
            Explore our diverse range of programs designed to shape your future. 
            Find the right fit for your career goals.
          </p>

          {/* Search & Filter */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-14 pr-14 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 shadow-lg shadow-slate-200/10 transition-all font-medium"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="md:w-64">
                <select
                  value={selectedInstitute}
                  onChange={(e) => setSelectedInstitute(e.target.value)}
                  className="w-full h-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 shadow-lg shadow-slate-200/10 transition-all font-medium appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                >
                  <option value="all">All Institutes</option>
                  {institutes.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedInstitute !== 'all' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit text-sm font-bold">
                <Info className="w-4 h-4" />
                Showing programs from: {institutes.find(i => i.id === selectedInstitute)?.name}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[450px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {filteredPrograms.map((program, i) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 transition-all duration-500 group"
              >
                <Link href={`/programs/${program.id}`} className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden block">
                  <Image 
                    src={program.imageUrl || `https://picsum.photos/seed/${program.id}/800/600`} 
                    alt={program.name}
                    width={800}
                    height={600}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <span className={`backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg ${
                      program.category === 'Engineering' ? 'bg-indigo-600/90 text-white' :
                      program.category === 'Management' ? 'bg-emerald-600/90 text-white' :
                      program.category === 'Arts' ? 'bg-purple-600/90 text-white' :
                      program.category === 'Science' ? 'bg-amber-600/90 text-white' :
                      program.category === 'Law' ? 'bg-rose-600/90 text-white' :
                      'bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white'
                    }`}>
                      {program.category || 'General'}
                    </span>
                    {program.isActive === false && (
                      <span className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                        <EyeOff className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                </Link>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{institutes.find(inst => inst.id === program.instituteId)?.name || 'Global Institute'}</span>
                  </div>
                  <Link href={`/programs/${program.id}`} className="block group/title">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors leading-tight">{program.name}</h3>
                  </Link>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{program.description}</p>
                  
                  <div className="space-y-3 mb-2">
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm mr-3">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      </div>
                      <span className="font-medium">{program.duration || '4 Years Full-time'}</span>
                    </div>
                    {program.deadline && (
                      <div className="flex items-center text-xs text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-100/50 dark:border-amber-500/20">
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm mr-3">
                          <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        </div>
                        <span className="font-bold">Deadline: {formatTimestamp(program.deadline)}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm mr-3">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium">Fee: ${program.feeStructure?.applicationFee || 50}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center gap-3">
                  <Link
                    href={`/apply/${program.id}`}
                    className="flex-grow inline-flex items-center justify-center px-5 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all duration-300 group/btn shadow-md hover:shadow-lg dark:shadow-indigo-900/20 text-sm"
                  >
                    Apply Now
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                  </Link>
                  <Link
                    href={`/programs/${program.id}`}
                    title="View Program Details"
                    className="flex-shrink-0 w-11 h-11 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300"
                  >
                    <Info className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchQuery ? (
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              ) : (
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {searchQuery ? 'No Results Found' : 'No Programs Found'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? `We couldn't find any programs matching "${searchQuery}". Try a different search term.` 
                : 'Check back later for new academic sessions.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
              >
                Clear Search
              </button>
            )}
            {!searchQuery && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Admin: If this is a new setup, please log in and use the &quot;Seed Initial Data&quot; button in the Dashboard.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
