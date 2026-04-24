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
  doc,
  updateDoc,
  getDocs,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Plus, 
  Tag, 
  Trash2, 
  Loader2,
  LayoutGrid,
  AlertCircle,
  Edit2,
  X
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
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin'].includes(profile.role))) {
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

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory || !editCategory.name.trim()) return;

    setIsUpdating(true);
    try {
      const oldName = categories.find(c => c.id === editCategory.id)?.name;
      const newName = editCategory.name.trim();

      // Update the category itself
      await updateDoc(doc(db, 'categories', editCategory.id), {
        name: newName,
        description: editCategory.description.trim(),
        updatedAt: serverTimestamp()
      });

      // If name changed, update all programs referencing this category name
      if (oldName && oldName !== newName) {
        const programsRef = collection(db, 'programs');
        const q = query(programsRef, where('category', '==', oldName));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.update(d.ref, { category: newName });
          });
          await batch.commit();
        }
      }

      setEditCategory(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${editCategory.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const categoryToDelete = categories.find(c => c.id === id);
      
      // Delete the category
      await deleteDoc(doc(db, 'categories', id));

      // Update programs that were in this category
      if (categoryToDelete) {
        const programsRef = collection(db, 'programs');
        const q = query(programsRef, where('category', '==', categoryToDelete.name));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.update(d.ref, { category: 'Uncategorized' });
          });
          await batch.commit();
        }
      }

      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Program Categories</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage categories for academic programs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Form */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 sticky top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                <Plus className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Add Category
              </h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500/20 outline-none transition-all text-sm bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500/20 outline-none transition-all text-sm bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="Short description..."
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-100 dark:shadow-blue-900/20"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Category'}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Existing Categories
                </h2>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {categories.length} Total
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {categories.map((cat) => (
                  <motion.div 
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                        {cat.description && <p className="text-sm text-slate-500 dark:text-slate-400">{cat.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditCategory({ ...cat })}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {categories.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-slate-400 dark:text-slate-500 italic">No categories added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editCategory && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Category</h3>
                <button onClick={() => setEditCategory(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category Name</label>
                  <input
                    type="text"
                    required
                    value={editCategory.name}
                    onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all text-sm bg-white dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={editCategory.description}
                    onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500/20 outline-none transition-all text-sm bg-white dark:bg-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditCategory(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Category?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                This action cannot be undone. Programs using this category might be affected.
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
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
