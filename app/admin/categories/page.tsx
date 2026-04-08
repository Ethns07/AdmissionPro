'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { 
  Plus, 
  Tag, 
  Trash2, 
  Loader2,
  LayoutGrid,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CategoriesManagementPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'super_admin')) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => unsubscribe();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newName.trim(),
        description: newDesc.trim(),
        createdAt: serverTimestamp()
      });
      setNewName('');
      setNewDesc('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'categories', id));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold text-slate-900">Program Categories</h1>
          <p className="text-slate-500">Manage categories for academic programs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Form */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-slate-400" /> Add Category
              </h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                    placeholder="Short description..."
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-100"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Category'}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-slate-400" /> Existing Categories
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {categories.length} Total
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <motion.div 
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{cat.name}</h3>
                        {cat.description && <p className="text-sm text-slate-500">{cat.description}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteId(cat.id)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
                {categories.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-slate-400 italic">No categories added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
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
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Category?</h3>
              <p className="text-slate-500 text-center mb-8">
                This action cannot be undone. Programs using this category might be affected.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteId)}
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
