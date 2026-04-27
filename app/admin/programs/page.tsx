'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  XCircle,
  Loader2,
  ExternalLink,
  Layers,
  Calendar,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProgramsManagementPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin'].includes(profile.role))) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    // Listen to programs
    let q = query(collection(db, 'programs'), orderBy('name', 'asc'));
    if (profile?.role !== 'super_admin' && profile?.instituteId) {
      q = query(collection(db, 'programs'), where('instituteId', '==', profile.instituteId), orderBy('name', 'asc'));
    }
    
    const unsubscribePrograms = onSnapshot(q, (snapshot) => {
      setPrograms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'programs');
    });

    // Listen to categories
    let catQ = query(collection(db, 'categories'), orderBy('name', 'asc'));
    if (profile?.role !== 'super_admin' && profile?.instituteId) {
      catQ = query(collection(db, 'categories'), where('instituteId', '==', profile.instituteId), orderBy('name', 'asc'));
    }
    
    const unsubscribeCategories = onSnapshot(catQ, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => {
      unsubscribePrograms();
      unsubscribeCategories();
    };
  }, [profile]);

  const handleToggleStatus = async (programId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'programs', programId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `programs/${programId}`);
    }
  };

  const handleDelete = async (programId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'programs', programId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programs/${programId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPrograms = programs.filter(prog => {
    const matchesSearch = 
      prog.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prog.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || prog.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Program Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Create, edit and manage academic programs</p>
          </div>
          
          <Link
            href="/admin/programs/new"
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg dark:shadow-indigo-900/20 w-fit"
          >
            <Plus className="w-5 h-5" />
            Add New Program
          </Link>
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex-grow flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 text-sm font-medium dark:text-white min-w-[180px]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 pb-2">
              Found <span className="text-slate-900 dark:text-white font-bold">{filteredPrograms.length}</span> programs
            </div>
          </div>

          {/* Programs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Program Details</th>
                    <th className="px-6 py-4 font-medium hidden md:table-cell">Category</th>
                    <th className="px-6 py-4 font-medium hidden lg:table-cell">Duration</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm relative overflow-hidden flex-shrink-0">
                            {prog.imageUrl ? (
                              <Image 
                                src={prog.imageUrl} 
                                alt={prog.name} 
                                fill 
                                className="object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <BookOpen className="w-6 h-6" />
                            )}
                          </div>
                          <div className="max-w-[200px] sm:max-w-none">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{prog.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{prog.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {prog.category || 'Uncategorized'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                             <Clock className="w-3.5 h-3.5 text-slate-400" />
                             {prog.duration}
                          </div>
                          {prog.deadline && (
                            <div className="flex items-center gap-2 text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase">
                               <Calendar className="w-3 h-3" />
                               Deadline: {prog.deadline.toDate ? prog.deadline.toDate().toLocaleDateString() : new Date(prog.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleStatus(prog.id, prog.isActive)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                            prog.isActive 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {prog.isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {prog.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link 
                            href={`/programs/${prog.id}`} 
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Preview Public Page"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </Link>
                          <Link 
                            href={`/admin/programs/${prog.id}/edit`}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Edit Program"
                          >
                            <Edit3 className="w-5 h-5" />
                          </Link>
                          {['admin', 'super_admin'].includes(profile?.role || '') && (
                            <button 
                              onClick={() => setDeleteId(prog.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete Program"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPrograms.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Programs Found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {searchTerm || categoryFilter !== 'all' 
                    ? "We couldn't find any programs matching your search or filters. Try adjusting them." 
                    : "You haven't added any programs yet. Click the button above to get started."}
                </p>
                {(searchTerm || categoryFilter !== 'all') && (
                  <button 
                    onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
                    className="mt-6 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Program?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8 italic">
                &quot;{programs.find(p => p.id === deleteId)?.name}&quot;
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                This action cannot be undone. All data associated with this program will be permanently removed. 
                Students will no longer be able to apply to this program.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteId)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
