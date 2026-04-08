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
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  FileText,
  User,
  Loader2,
  Trophy,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

export default function ApplicationsManagementPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'merit'>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin', 'admission_officer'].includes(profile.role))) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const handleDelete = async (appId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'applications', appId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `applications/${appId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      app.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const meritList = [...applications]
    .filter(app => app.status !== 'not_eligible')
    .sort((a, b) => (b.meritScore || 0) - (a.meritScore || 0));

  const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');
  const isAdmissionOfficer = profile?.role === 'admission_officer' || isAdmin;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Application Management</h1>
            <p className="text-slate-500">Review and process student applications</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/admin/offline-admission"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Offline Application
            </Link>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Applications
              </button>
              <button
                onClick={() => setView('merit')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  view === 'merit' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Merit List
              </button>
            </div>
          </div>
        </div>

        {view === 'list' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white text-sm font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="eligible">Eligible</option>
                  <option value="not_eligible">Not Eligible</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="offer_extended">Offer Extended</option>
                  <option value="enrolled">Enrolled</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Applicant</th>
                      <th className="px-6 py-4 font-medium">Program</th>
                      <th className="px-6 py-4 font-medium">Merit Score</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                              {app.studentName?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{app.studentName}</p>
                              <p className="text-xs text-slate-500">{app.studentEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700">{app.programName}</p>
                          <p className="text-xs text-slate-400">{app.sessionName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-bold text-slate-900">
                            {app.meritScore?.toFixed(2) || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isAdmissionOfficer ? (
                            <StatusSelect app={app} handleStatusUpdate={handleStatusUpdate} />
                          ) : (
                            <StatusBadge status={app.status} />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit ${
                              app.isOffline ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {app.isOffline ? 'Offline' : 'Online'}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit ${
                              app.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {app.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAdmissionOfficer && (
                              <>
                                <button 
                                  onClick={() => handleStatusUpdate(app.id, 'eligible')}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Mark Eligible"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(app.id, 'not_eligible')}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <Link 
                              href={`/applications/${app.id}`}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                              title="View Details"
                            >
                              <FileText className="w-5 h-5" />
                            </Link>
                            {isAdmin && (
                              <button 
                                onClick={() => setDeleteId(app.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Delete Application"
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
              {filteredApps.length === 0 && (
                <div className="p-20 text-center">
                  <p className="text-slate-500">No applications found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Ranked Merit List
              </h2>
              <p className="text-sm text-slate-500">Sorted by calculated merit score based on program formulas.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Rank</th>
                    <th className="px-6 py-4 font-medium">Applicant</th>
                    <th className="px-6 py-4 font-medium">Program</th>
                    <th className="px-6 py-4 font-medium">Merit Score</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meritList.map((app, index) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{app.studentName}</p>
                        <p className="text-xs text-slate-500">{app.studentEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{app.programName}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-slate-900">
                          {app.meritScore?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isAdmissionOfficer ? (
                          <StatusSelect app={app} handleStatusUpdate={handleStatusUpdate} />
                        ) : (
                          <StatusBadge status={app.status} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isAdmissionOfficer && (
                            <button 
                              onClick={() => handleStatusUpdate(app.id, 'offer_extended')}
                              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              Extend Offer
                            </button>
                          )}
                          <Link 
                            href={`/applications/${app.id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <button 
                              onClick={() => setDeleteId(app.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Application?</h3>
              <p className="text-slate-500 text-center mb-8">
                This action cannot be undone. All data associated with this application will be permanently removed.
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
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50"
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

const StatusSelect = ({ app, handleStatusUpdate }: { app: any, handleStatusUpdate: (id: string, status: string) => void }) => {
  return (
    <select
      value={app.status}
      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
      className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border border-transparent focus:border-slate-300 focus:ring-0 outline-none cursor-pointer transition-all ${
        app.status === 'pending' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
        app.status === 'eligible' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' :
        app.status === 'not_eligible' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' :
        app.status === 'waitlist' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
        app.status === 'offer_extended' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' :
        app.status === 'enrolled' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
        'bg-slate-50 text-slate-600 hover:bg-slate-100'
      }`}
    >
      <option value="pending">Pending</option>
      <option value="eligible">Eligible</option>
      <option value="not_eligible">Not Eligible</option>
      <option value="waitlist">Waitlist</option>
      <option value="offer_extended">Offer Extended</option>
      <option value="enrolled">Enrolled</option>
    </select>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: "bg-amber-100 text-amber-700",
    eligible: "bg-indigo-100 text-indigo-700",
    not_eligible: "bg-rose-100 text-rose-700",
    waitlist: "bg-purple-100 text-purple-700",
    offer_extended: "bg-indigo-100 text-indigo-700",
    enrolled: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
