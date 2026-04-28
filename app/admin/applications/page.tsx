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
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendNotificationEmail, EMAIL_TEMPLATES } from '@/lib/notifications';

export default function ApplicationsManagementPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'merit'>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({
    key: 'meritScore',
    direction: null
  });

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin', 'admission_officer'].includes(profile.role))) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    let q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    if (profile?.role !== 'super_admin' && profile?.instituteId) {
      q = query(collection(db, 'applications'), where('instituteId', '==', profile.instituteId), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      const app = applications.find(a => a.id === appId);
      
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Send email notification
      if (app && app.studentEmail) {
        const studentName = app.studentName || 'Student';
        const programName = app.programName || 'Selected Program';
        const template = EMAIL_TEMPLATES.STATUS_UPDATE(studentName, programName, newStatus);
        
        await sendNotificationEmail(app.studentEmail, template.subject, template.html);
      }
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
      app.studentName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
      app.studentEmail?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key] || 0;
    const bValue = b[sortConfig.key] || 0;
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'desc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'desc') direction = 'asc';
      else if (sortConfig.direction === 'asc') direction = null;
    }
    
    setSortConfig({ key, direction });
  };

  const meritList = [...applications]
    .filter(app => app.status !== 'not_eligible')
    .sort((a, b) => (b.meritScore || 0) - (a.meritScore || 0));

  const handleExportCSV = () => {
    const dataToExport = view === 'list' ? filteredApps : meritList;
    
    if (dataToExport.length === 0) {
      return;
    }

    const headers = [
      'Application ID',
      'Student Name',
      'Student Email',
      'Program Name',
      'Merit Score',
      'Status',
      'Type',
      'Payment Status',
      'Created At'
    ];

    const csvRows = [
      headers.join(','),
      ...dataToExport.map(app => [
        app.id,
        `"${(app.studentName || '').replace(/"/g, '""')}"`,
        app.studentEmail || '',
        `"${(app.programName || '').replace(/"/g, '""')}"`,
        app.meritScore || 'N/A',
        app.status,
        app.isOffline ? 'Offline' : 'Online',
        app.paymentStatus,
        app.createdAt?.toDate ? app.createdAt.toDate().toISOString() : ''
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const dataToExport = view === 'list' ? filteredApps : meritList;
    if (dataToExport.length === 0) return;

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('Application Export Data', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const headers = [['ID', 'Student Name', 'Email', 'Program', 'Merit', 'Status', 'Type', 'Payment']];
    const data = dataToExport.map(app => [
      app.id.substring(0, 8),
      app.studentName || '',
      app.studentEmail || '',
      app.programName || '',
      app.meritScore || 'N/A',
      app.status,
      app.isOffline ? 'Offline' : 'Online',
      app.paymentStatus
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`applications_export_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');
  const isAdmissionOfficer = profile?.role === 'admission_officer' || isAdmin;

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Application Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Review and process student applications</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <AnimatePresence>
                {showExportMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowExportMenu(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-20 origin-top-right md:origin-top"
                    >
                      <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Export to CSV
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-rose-500" />
                        Export to PDF
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <Link
              href="/admin/offline-admission"
              className="flex-grow sm:flex-grow-0 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-indigo-900/20"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">Offline App</span>
            </Link>
            <div className="flex w-full sm:w-auto bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setView('list')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  view === 'list' ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setView('merit')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  view === 'merit' ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                Merit
              </button>
            </div>
          </div>
        </div>

        {view === 'list' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-grow flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 text-sm font-medium dark:text-white"
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
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium pb-1.5 ring-offset-white">
                Showing <span className="mx-1 text-slate-900 dark:text-white font-bold">{filteredApps.length}</span> of <span className="mx-1 text-slate-900 dark:text-white font-bold">{applications.length}</span> applications
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider">
                      <th className="px-4 sm:px-6 py-4 font-medium">Applicant</th>
                      <th className="px-4 py-4 font-medium hidden md:table-cell">Program</th>
                      <th 
                        className="px-6 py-4 font-medium hidden sm:table-cell cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        onClick={() => handleSort('meritScore')}
                      >
                        <div className="flex items-center gap-1">
                          Merit Score
                          {sortConfig.key === 'meritScore' ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : 
                            sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : 
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 sm:px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium hidden lg:table-cell">Type</th>
                      <th className="px-4 sm:px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <TableSkeleton rows={5} />
                    ) : (
                      filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-base">
                                {app.studentName?.[0] || 'U'}
                              </div>
                              <div className="max-w-[120px] sm:max-w-none">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{app.studentName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.studentEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell cursor-default">
                            <p className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{app.programName}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{app.sessionName}</p>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                              {app.meritScore?.toFixed(2) || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="max-w-[120px] sm:max-w-none">
                              {isAdmissionOfficer ? (
                                <StatusSelect app={app} handleStatusUpdate={handleStatusUpdate} />
                              ) : (
                                <StatusBadge status={app.status} />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit ${
                                app.isOffline ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                              }`}>
                                {app.isOffline ? 'Offline' : 'Online'}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit ${
                                app.paymentStatus === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {app.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              {isAdmissionOfficer && (
                                <div className="hidden sm:flex gap-1">
                                  <button 
                                    onClick={() => handleStatusUpdate(app.id, 'eligible')}
                                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    title="Mark Eligible"
                                  >
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                  <button 
                                    onClick={() => handleStatusUpdate(app.id, 'not_eligible')}
                                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                </div>
                              )}
                              <Link 
                                href={`/applications/${app.id}`}
                                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                              </Link>
                              {isAdmin && (
                                <button 
                                  onClick={() => setDeleteId(app.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Delete Application"
                                >
                                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredApps.length === 0 && (
                <div className="p-20 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No applications found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Ranked Merit List
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sorted by calculated merit score based on program formulas.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 sm:px-6 py-4 font-medium">Rank</th>
                    <th className="px-4 sm:px-6 py-4 font-medium">Applicant</th>
                    <th className="px-6 py-4 font-medium hidden md:table-cell">Program</th>
                    <th className="px-4 sm:px-6 py-4 font-medium">Merit Score</th>
                    <th className="px-4 sm:px-6 py-4 font-medium hidden sm:table-cell">Status</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <MeritSkeleton rows={5} />
                  ) : (
                    meritList.map((app, index) => (
                      <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                            index < 3 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{app.studentName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{app.studentEmail}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 hidden md:table-cell truncate max-w-[200px]">{app.programName}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                            {app.meritScore?.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          {isAdmissionOfficer ? (
                            <StatusSelect app={app} handleStatusUpdate={handleStatusUpdate} />
                          ) : (
                            <StatusBadge status={app.status} />
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {isAdmissionOfficer && (
                              <button 
                                onClick={() => handleStatusUpdate(app.id, 'offer_extended')}
                                className="px-2 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors whitespace-nowrap"
                              >
                                <span className="hidden sm:inline">Extend Offer</span>
                                <Plus className="w-3.5 h-3.5 sm:hidden" />
                              </button>
                            )}
                            <Link 
                              href={`/applications/${app.id}`}
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Link>
                            {isAdmin && (
                              <button 
                                onClick={() => setDeleteId(app.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Application"
                              >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Application?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                This action cannot be undone. All data associated with this application will be permanently removed.
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

const StatusSelect = ({ app, handleStatusUpdate }: { app: any, handleStatusUpdate: (id: string, status: string) => void }) => {
  return (
    <select
      value={app.status}
      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
      className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:ring-0 outline-none cursor-pointer transition-all ${
        app.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20' :
        app.status === 'eligible' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20' :
        app.status === 'not_eligible' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20' :
        app.status === 'waitlist' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20' :
        app.status === 'offer_extended' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20' :
        app.status === 'enrolled' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' :
        'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
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
    pending: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
    eligible: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
    not_eligible: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
    waitlist: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400",
    offer_extended: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
    enrolled: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${styles[status] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </td>
        <td className="px-4 py-4 hidden md:table-cell">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded" />
          </div>
        </td>
        <td className="px-6 py-4 hidden sm:table-cell">
          <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
        </td>
        <td className="px-4 sm:px-6 py-4">
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </td>
        <td className="px-6 py-4 hidden lg:table-cell">
          <div className="space-y-1">
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-700 rounded" />
          </div>
        </td>
        <td className="px-4 sm:px-6 py-4">
          <div className="flex justify-end gap-2">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

const MeritSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 sm:px-6 py-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
        </td>
        <td className="px-4 py-4">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700 rounded" />
          </div>
        </td>
        <td className="px-6 py-4 hidden md:table-cell">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        </td>
        <td className="px-4 sm:px-6 py-4">
          <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
        </td>
        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </td>
        <td className="px-4 py-4">
          <div className="flex justify-end gap-2">
            <div className="w-20 h-8 bg-slate-900/10 dark:bg-indigo-600/10 rounded-lg" />
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </td>
      </tr>
    ))}
  </>
);
