'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { collection, onSnapshot, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType, formatTimestamp } from '@/lib/firestore-utils';
import { BookOpen, ArrowRight, GraduationCap, DollarSign, Calendar, Clock, FileText, Search, X, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import Image from 'next/image';

export default function ProgramsPage() {
  const { profile } = useFirebase();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const isAdmin = profile && ['admin', 'super_admin', 'admission_officer'].includes(profile.role);
    
    const q = isAdmin 
      ? query(collection(db, 'programs'))
      : query(collection(db, 'programs'), where('isActive', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrograms(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'programs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredPrograms = programs.filter(program => 
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (program.category && program.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Academic Programs</h1>
          <p className="text-slate-600 max-w-2xl mx-auto mb-8">
            Explore our diverse range of programs designed to shape your future. 
            Find the right fit for your career goals.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search programs by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-12 py-4 bg-white border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program, i) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-all group"
              >
                <Link href={`/programs/${program.id}`} className="h-48 bg-slate-100 relative overflow-hidden block">
                  <Image 
                    src={program.imageUrl || `https://picsum.photos/seed/${program.id}/800/600`} 
                    alt={program.name}
                    width={800}
                    height={600}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <span className={`backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                      program.category === 'Engineering' ? 'bg-indigo-600/90 text-white' :
                      program.category === 'Management' ? 'bg-emerald-600/90 text-white' :
                      program.category === 'Arts' ? 'bg-purple-600/90 text-white' :
                      program.category === 'Science' ? 'bg-amber-600/90 text-white' :
                      program.category === 'Law' ? 'bg-rose-600/90 text-white' :
                      'bg-white/90 text-slate-900'
                    }`}>
                      {program.category || 'General'}
                    </span>
                    {program.isActive === false && (
                      <span className="bg-slate-900/90 text-white backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                </Link>
                
                <div className="p-6 flex-grow">
                  <Link href={`/programs/${program.id}`} className="block group/title">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover/title:text-indigo-600 transition-colors">{program.name}</h3>
                  </Link>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2">{program.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      <span>{program.duration || '4 Years Full-time'}</span>
                    </div>
                    {program.deadline && (
                      <div className="flex items-center text-sm text-amber-600 font-medium">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Deadline: {formatTimestamp(program.deadline)}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-slate-600">
                      <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                      <span>Application Fee: ${program.feeStructure?.applicationFee || 50}</span>
                    </div>
                    {program.brochureUrl && (
                      <a 
                        href={program.brochureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-indigo-600 font-medium hover:underline"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Detailed Fee Structure
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 flex flex-col gap-3">
                  <Link
                    href={`/programs/${program.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/apply/${program.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors group shadow-md shadow-slate-100"
                  >
                    Apply Now
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchQuery ? (
                <Search className="w-10 h-10 text-slate-300" />
              ) : (
                <BookOpen className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {searchQuery ? 'No Results Found' : 'No Programs Found'}
            </h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? `We couldn't find any programs matching "${searchQuery}". Try a different search term.` 
                : 'Check back later for new academic sessions.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Clear Search
              </button>
            )}
            {!searchQuery && (
              <p className="text-xs text-slate-400">
                Admin: If this is a new setup, please log in and use the &quot;Seed Initial Data&quot; button in the Dashboard.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
