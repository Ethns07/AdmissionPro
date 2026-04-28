'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirebase } from '@/components/FirebaseProvider';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDocs,
  where,
  orderBy,
  addDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Users,
  Shield, 
  Mail, 
  UserCircle, 
  Loader2, 
  Search,
  CheckCircle2,
  BookOpen,
  Plus,
  X,
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  Ban,
  Unlock,
  Edit3,
  Building2,
  ShieldAlert,
  Crown,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StaffManagementPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showInstituteModal, setShowInstituteModal] = useState(false);
  const [batching, setBatching] = useState(false);
  const [newInstitute, setNewInstitute] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    adminId: ''
  });
  const [editInstitute, setEditInstitute] = useState({
    id: '',
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    adminId: ''
  });
  const [showEditInstituteModal, setShowEditInstituteModal] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'program' | 'institute';
    userId?: string;
    instituteId?: string;
    targetId?: string; 
    userName?: string;
    instituteName?: string;
    targetName?: string;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    email: '',
    displayName: '',
    role: 'admission_officer',
    password: ''
  });
  const [editStaff, setEditStaff] = useState({
    id: '',
    email: '',
    displayName: '',
    role: '',
    password: ''
  });
  const [assigning, setAssigning] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin'].includes(profile.role))) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (!profile) return;

    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    if (profile.role !== 'super_admin' && profile.instituteId) {
      q = query(collection(db, 'users'), where('instituteId', '==', profile.instituteId), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    let progQ = query(collection(db, 'programs'), where('isActive', '==', true));
    if (profile.role !== 'super_admin' && profile.instituteId) {
      progQ = query(collection(db, 'programs'), where('isActive', '==', true), where('instituteId', '==', profile.instituteId));
    }
    
    const unsubscribeProgs = onSnapshot(progQ, (snapshot) => {
      setPrograms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const instQ = query(collection(db, 'institutes'));
    const unsubscribeInsts = onSnapshot(instQ, (snapshot) => {
      setInstitutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeProgs();
      unsubscribeInsts();
    };
  }, [profile]);

  const handleToggleApproval = async (user: any) => {
    if (user.role === 'super_admin' && profile?.role !== 'super_admin') return;
    
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isApproved: !user.isApproved,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
        // Clear assignments if role changes from admission_officer
        ...(newRole !== 'admission_officer' ? { assignedPrograms: [] } : {})
      });
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignProgram = async (userId: string, programId: string) => {
    const user = users.find(u => u.id === userId);
    const currentAssignments = user?.assignedPrograms || [];
    
    if (currentAssignments.includes(programId)) return;

    setAssigning(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        assignedPrograms: [...currentAssignments, programId],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveProgram = async (userId: string, programId: string) => {
    const user = users.find(u => u.id === userId);
    const currentAssignments = user?.assignedPrograms || [];
    
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        assignedPrograms: currentAssignments.filter((id: string) => id !== programId),
        updatedAt: serverTimestamp()
      });
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdating(false);
    }
  };

  const initiateRoleUpdate = (user: any, newRole: string) => {
    if (user.role === newRole) return;
    
    // Always confirm if revoking a privileged role or changing to student
    const isRevoking = ['admin', 'super_admin', 'admission_officer'].includes(user.role) && 
                      (newRole === 'student' || newRole === 'parent');
    const isChangingOfficer = user.role === 'admission_officer' && newRole !== 'admission_officer';

    if (isRevoking || isChangingOfficer || newRole === 'super_admin') {
      setConfirmAction({
        type: 'role',
        userId: user.id,
        targetId: newRole,
        userName: user.displayName || user.email,
        targetName: newRole.replace('_', ' ')
      });
    } else {
      handleRoleUpdate(user.id, newRole);
    }
  };

  const initiateProgramRemoval = (user: any, programId: string, programName: string) => {
    setConfirmAction({
      type: 'program',
      userId: user.id,
      targetId: programId,
      userName: user.displayName || user.email,
      targetName: programName
    });
  };

  const handleAddInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstitute.name || !newInstitute.adminId) return;

    setBatching(true);
    try {
      // 1. Create the institute
      const instRef = await addDoc(collection(db, 'institutes'), {
        name: newInstitute.name,
        description: newInstitute.description,
        email: newInstitute.email.toLowerCase().trim(),
        phone: newInstitute.phone,
        address: newInstitute.address,
        adminId: newInstitute.adminId,
        isBanned: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Update the assigned admin user
      await updateDoc(doc(db, 'users', newInstitute.adminId), {
        instituteId: instRef.id,
        role: 'admin',
        isApproved: true,
        updatedAt: serverTimestamp()
      });

      setShowInstituteModal(false);
      setNewInstitute({ name: '', description: '', email: '', phone: '', address: '', adminId: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'institutes');
    } finally {
      setBatching(false);
    }
  };

  const handleUpdateInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInstitute.id || !editInstitute.name || !editInstitute.adminId) return;

    setBatching(true);
    try {
      const oldInst = institutes.find(i => i.id === editInstitute.id);
      
      // 1. Update the institute
      await updateDoc(doc(db, 'institutes', editInstitute.id), {
        name: editInstitute.name,
        description: editInstitute.description,
        email: editInstitute.email.toLowerCase().trim(),
        phone: editInstitute.phone,
        address: editInstitute.address,
        adminId: editInstitute.adminId,
        updatedAt: serverTimestamp()
      });

      // 2. If admin changed, update users
      if (oldInst?.adminId !== editInstitute.adminId) {
        // Demote old admin if needed? Actually maybe keep them as admin but remove instituteId
        // For simplicity, just promote the new one
        await updateDoc(doc(db, 'users', editInstitute.adminId), {
          instituteId: editInstitute.id,
          role: 'admin',
          isApproved: true,
          updatedAt: serverTimestamp()
        });
      }

      setShowEditInstituteModal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `institutes/${editInstitute.id}`);
    } finally {
      setBatching(false);
    }
  };

  const deleteInstitute = async (instituteId: string) => {
    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'institutes', instituteId));
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `institutes/${instituteId}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleInstituteStatus = async (instituteId: string, currentStatus: boolean) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'institutes', instituteId), {
        isBanned: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `institutes/${instituteId}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.email || !newStaff.role) return;

    setUpdating(true);
    try {
      const staffEmail = newStaff.email.toLowerCase().trim();
      const docRef = doc(db, 'users', staffEmail);
      
      await setDoc(docRef, {
        email: staffEmail,
        displayName: newStaff.displayName.trim(),
        role: newStaff.role,
        password: newStaff.password,
        uid: staffEmail, // Using email as temporary UID
        isApproved: false, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isInvited: true
      });

      setShowAddModal(false);
      setNewStaff({ email: '', displayName: '', role: 'admission_officer', password: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaff.id || !editStaff.email || !editStaff.role) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', editStaff.id), {
        email: editStaff.email.toLowerCase().trim(),
        displayName: editStaff.displayName.trim(),
        role: editStaff.role,
        password: editStaff.password,
        updatedAt: serverTimestamp(),
        // Clear assignments if role changes from admission_officer
        ...(editStaff.role !== 'admission_officer' ? { assignedPrograms: [] } : {})
      });
      setShowEditModal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${editStaff.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'users', userId));
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    } finally {
      setUpdating(false);
    }
  };

  const initiateDeleteStaff = (user: any) => {
    setConfirmAction({
      type: 'role', // Reusing role type for deletion confirmation UI
      userId: user.id,
      userName: user.displayName || user.email,
      targetName: 'DELETE_USER' // Special flag for the confirm button
    });
  };

  const openEditModal = (user: any) => {
    setEditStaff({
      id: user.id,
      email: user.email,
      displayName: user.displayName || '',
      role: user.role,
      password: user.password || ''
    });
    setShowEditModal(user.id);
  };

  const openEditInstituteModal = (inst: any) => {
    setEditInstitute({
      id: inst.id,
      name: inst.name,
      description: inst.description || '',
      email: inst.email || '',
      phone: inst.phone || '',
      address: inst.address || '',
      adminId: inst.adminId
    });
    setShowEditInstituteModal(inst.id);
  };

  const initiateDeleteInstitute = (inst: any) => {
    setConfirmAction({
      type: 'institute',
      instituteId: inst.id,
      instituteName: inst.name,
      targetName: 'DELETE_INSTITUTE'
    });
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInstitutes = institutes.filter(i =>
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Staff & Role Management</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Assign roles and manage program assignments for admission officers.</p>
          </div>
          <div className="flex items-center gap-3">
            {profile?.role === 'super_admin' && (
              <button
                onClick={() => setShowInstituteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 dark:shadow-amber-900/20"
              >
                <ShieldCheck className="w-4 h-4" />
                New Institute
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              <UserPlus className="w-4 h-4" />
              Add New Staff
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all w-64 shadow-sm dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Super Admin Section - Special Prestige UI */}
          {profile?.role === 'super_admin' && (
            <div className="relative group/super">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 rounded-[2.6rem] blur opacity-25 group-hover/super:opacity-40 transition duration-1000 group-hover/super:duration-200" />
              <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-purple-100 dark:border-purple-900 shadow-xl overflow-hidden">
                <div className="px-8 py-8 border-b border-purple-50 dark:border-purple-900 bg-gradient-to-r from-purple-50/50 to-indigo-50/30 dark:from-purple-900/20 dark:to-indigo-900/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                      <Crown className="w-7 h-7 text-amber-500 fill-amber-500/20" />
                      Platform Overseers
                    </h2>
                    <p className="text-xs text-purple-600/60 dark:text-purple-400/60 font-bold tracking-[0.2em] mt-1 ml-10">SUPER ADMIN LEVEL ACCESS</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-100/50 dark:bg-purple-900/30 rounded-2xl border border-purple-200/50 dark:border-purple-800/50">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                      {users.filter(u => u.role === 'super_admin').length} ACTIVE
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-purple-400 dark:text-purple-500 text-[10px] font-black uppercase tracking-widest border-b border-purple-50 dark:border-purple-900/50">
                        <th className="px-8 py-5">Administrator</th>
                        <th className="px-8 py-5">Authority Scope</th>
                        <th className="px-8 py-5">Verification</th>
                        <th className="px-8 py-5 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="relative">
                      {users.filter(u => u.role === 'super_admin').map((u) => (
                        <tr key={u.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-all duration-300">
                          <td className="px-8 py-7">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-50" />
                                <div className="relative w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center font-black text-xl text-white dark:text-slate-900 border-2 border-purple-300 dark:border-purple-700">
                                  {u.displayName?.[0] || u.email?.[0].toUpperCase()}
                                </div>
                                <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-lg shadow-lg">
                                  <Sparkles className="w-3 h-3 fill-white" />
                                </div>
                              </div>
                              <div>
                                <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                  {u.displayName || 'Root Administrator'}
                                </p>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono tracking-tighter">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-7">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-lg w-fit shadow-lg shadow-indigo-100 dark:shadow-none mb-1">GLOBAL</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Full Platform Rights</span>
                            </div>
                          </td>
                          <td className="px-8 py-7">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-black text-[10px] ${
                              u.isApproved 
                              ? 'bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 shadow-sm'
                              : 'bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                            }`}>
                              {u.isApproved ? (
                                <><ShieldCheck className="w-4 h-4" /> VERIFIED</>
                              ) : (
                                <><Shield className="w-4 h-4 animate-pulse" /> PENDING</>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-7 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-700 rounded-xl transition-all hover:shadow-md"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Immutable Role</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Institutes Section - Super Admin Only */}
          {profile?.role === 'super_admin' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  Institutes Management
                </h2>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {filteredInstitutes.length} Registered Institutes
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                      <th className="px-8 py-4">Institute</th>
                      <th className="px-8 py-4">Primary Admin</th>
                      <th className="px-8 py-4">Contact Info</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredInstitutes.map((inst) => {
                      const instAdmin = users.find(u => u.id === inst.adminId);
                      return (
                        <tr key={inst.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group ${inst.isBanned ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                                inst.isBanned 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                              }`}>
                                <Building2 className="w-6 h-6" />
                              </div>
                              <div className="max-w-[200px]">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {inst.name}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{inst.description || 'No description'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            {instAdmin ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{instAdmin.displayName}</span>
                                <span className="text-[10px] text-slate-500">{instAdmin.email}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-rose-500 font-bold flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> No Admin Assigned
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                <Mail className="w-3 h-3" /> {inst.email || 'N/A'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {inst.phone || 'No phone'}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              inst.isBanned
                              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${inst.isBanned ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                              {inst.isBanned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditInstituteModal(inst)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                                title="Edit Institute"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleInstituteStatus(inst.id, inst.isBanned)}
                                className={`p-2 rounded-lg transition-all ${
                                  inst.isBanned 
                                  ? 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' 
                                  : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                                }`}
                                title={inst.isBanned ? 'Unban Institute' : 'Ban Institute'}
                              >
                                {inst.isBanned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => initiateDeleteInstitute(inst)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Delete Institute"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInstitutes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                          No institutes registered. Click &quot;New Institute&quot; to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admission Officers Section - Hide for Super Admin if it's the "Institute" view */}
          {profile?.role !== 'super_admin' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Admission Officers
              </h2>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {filteredUsers.filter(u => u.role === 'admission_officer').length} Active Officers
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                    <th className="px-8 py-4">Officer</th>
                    <th className="px-8 py-4">Assigned Programs</th>
                    <th className="px-8 py-4">Verification</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredUsers.filter(u => u.role === 'admission_officer').map((u) => (
                    <tr key={u.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group ${!u.isApproved ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                            u.isApproved 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}>
                            {u.displayName?.[0] || u.email?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                              {u.displayName || 'No Name'}
                              {!u.isApproved && <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">PENDING</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2 max-w-md">
                          {u.assignedPrograms?.map((progId: string) => {
                            const prog = programs.find(p => p.id === progId);
                            return (
                              <span key={progId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700 group/tag">
                                {prog?.name || 'Unknown Program'}
                                <button 
                                  onClick={() => initiateProgramRemoval(u, progId, prog?.name || 'Unknown Program')}
                                  className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                          <button 
                            onClick={() => setShowAssignModal(u.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Assign
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <button
                          onClick={() => handleToggleApproval(u)}
                          disabled={updating || (u.role === 'super_admin' && profile?.role !== 'super_admin')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                            u.isApproved 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 grayscale-0'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isApproved ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          {u.isApproved ? 'Approved' : 'Click to Approve'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Admins cannot edit or delete super admins */}
                            {u.role !== 'super_admin' || profile?.role === 'super_admin' ? (
                              <>
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                                  title="Edit User"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => initiateDeleteStaff(u)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <select
                                  value={u.role}
                                  onChange={(e) => initiateRoleUpdate(u, e.target.value)}
                                  className="text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none bg-white dark:bg-slate-900 dark:text-white shadow-sm"
                                >
                                  <option value="student">Revoke Access (Student)</option>
                                  <option value="admission_officer">Admission Officer</option>
                                  <option value="admin">Promote to Admin</option>
                                  {profile?.role === 'super_admin' && (
                                    <option value="super_admin">Promote to Super Admin</option>
                                  )}
                                </select>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">System Protected</span>
                            )}
                          </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.filter(u => u.role === 'admission_officer').length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                        No admission officers found. Use the table below to assign roles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                Registered Members
              </h2>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {profile?.role === 'super_admin' ? 'Platform Wide' : 'Institutional'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Institute</th>
                    <th className="px-8 py-4">Current Role</th>
                    <th className="px-8 py-4">Access Status</th>
                    <th className="px-8 py-4 text-right">Update Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredUsers.filter(u => profile?.role === 'super_admin' ? u.role !== 'super_admin' : u.role !== 'admission_officer' && u.role !== 'super_admin').map((u) => {
                    const userInst = institutes.find(i => i.id === u.instituteId);
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group ${!u.isApproved && u.role !== 'student' ? 'opacity-70 bg-amber-50/5 dark:bg-amber-500/5' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-all ${
                              u.isApproved 
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' 
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                            }`}>
                              {u.displayName?.[0] || u.email?.[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {u.displayName || 'No Name'}
                                {!u.isApproved && u.role !== 'student' && <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">WAITING APPROVAL</span>}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                             {userInst?.name || 'Platform Generic'}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${
                            u.role === 'super_admin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20' :
                            u.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' :
                            u.role === 'admission_officer' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <button
                            onClick={() => handleToggleApproval(u)}
                            disabled={updating || (u.role === 'super_admin' && profile?.role !== 'super_admin')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              u.isApproved 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 animate-pulse'
                            }`}
                          >
                            {u.isApproved ? (
                              <><ShieldCheck className="w-3 h-3" /> Approved</>
                            ) : (
                              <><Shield className="w-3 h-3" /> Approve Now</>
                            )}
                          </button>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.role !== 'super_admin' || profile?.role === 'super_admin' ? (
                              <>
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                                  title="Edit User"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => initiateDeleteStaff(u)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <select
                                  value={u.role}
                                  onChange={(e) => initiateRoleUpdate(u, e.target.value)}
                                  className="text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none bg-white dark:bg-slate-900 dark:text-white shadow-sm"
                                >
                                  <option value="student">Student</option>
                                  <option value="parent">Parent</option>
                                  <option value="admission_officer">Admission Officer</option>
                                  <option value="admin">Admin</option>
                                  {profile?.role === 'super_admin' && (
                                    <option value="super_admin">Super Admin</option>
                                  )}
                                </select>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">System Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Staff Member</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update staff profile and system role.</p>
              </div>
              <form onSubmit={handleEditStaff} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editStaff.displayName}
                    onChange={(e) => setEditStaff(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editStaff.email}
                    onChange={(e) => setEditStaff(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">System Role</label>
                  <select
                    required
                    disabled={editStaff.role === 'super_admin'}
                    value={editStaff.role}
                    onChange={(e) => setEditStaff(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="admission_officer">Admission Officer</option>
                    <option value="admin">Administrator</option>
                    {profile?.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Staff Password</label>
                  <input
                    type="password"
                    required
                    value={editStaff.password}
                    onChange={(e) => setEditStaff(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="Set new password"
                  />
                  <p className="text-[10px] text-slate-500 italic">Used for email/password login.</p>
                </div>
                
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(null)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Staff</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create a new staff account with a specific role.</p>
              </div>
              <form onSubmit={handleAddStaff} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStaff.displayName}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">System Role</label>
                  <select
                    required
                    value={newStaff.role}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  >
                    <option value="admission_officer">Admission Officer</option>
                    <option value="admin">Administrator</option>
                    {profile?.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Login Password</label>
                  <input
                    type="password"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    placeholder="Enter login password"
                  />
                  <p className="text-[10px] text-slate-500 italic">Provide a password for the staff to sign in.</p>
                </div>
                
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Program Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Assign Programs</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select programs for this officer to manage.</p>
              </div>
              <div className="p-8 max-h-[400px] overflow-y-auto space-y-3">
                {programs.map((prog) => {
                  const user = users.find(u => u.id === showAssignModal);
                  const isAssigned = user?.assignedPrograms?.includes(prog.id);
                  return (
                    <button
                      key={prog.id}
                      disabled={assigning || isAssigned}
                      onClick={() => handleAssignProgram(showAssignModal, prog.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isAssigned 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAssigned ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">{prog.name}</p>
                          <p className="text-[10px] opacity-70 uppercase tracking-wider font-bold">{prog.category}</p>
                        </div>
                      </div>
                      {isAssigned ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Plus className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => setShowAssignModal(null)}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-lg shadow-slate-200 dark:shadow-indigo-900/20"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* New Institute Modal */}
      <AnimatePresence>
        {showInstituteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstituteModal(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Institute</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Register a new educational institution and assign an admin.</p>
              </div>
              <form onSubmit={handleAddInstitute} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Institute Name</label>
                    <input
                      type="text"
                      required
                      value={newInstitute.name}
                      onChange={(e) => setNewInstitute(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="e.g. Oxford University"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={newInstitute.email}
                      onChange={(e) => setNewInstitute(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="admissions@oxford.edu"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <input
                      type="text"
                      value={newInstitute.phone}
                      onChange={(e) => setNewInstitute(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Address</label>
                    <input
                      type="text"
                      value={newInstitute.address}
                      onChange={(e) => setNewInstitute(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                      placeholder="123 Education St, Oxford"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={newInstitute.description}
                    onChange={(e) => setNewInstitute(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white min-h-[80px]"
                    placeholder="Brief information about the institute..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Assign Institute Admin</label>
                  <select
                    required
                    value={newInstitute.adminId}
                    onChange={(e) => setNewInstitute(prev => ({ ...prev, adminId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">Select a user to promote...</option>
                    {users
                      .filter(u => u.role !== 'super_admin') // Don't allow assigning super admins to sub-institutes
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.email} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                    Note: The selected user will be promoted to Admin and restricted to this institute.
                  </p>
                
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowInstituteModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={batching}
                    className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 dark:shadow-amber-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {batching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Institute'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Institute Modal */}
      <AnimatePresence>
        {showEditInstituteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditInstituteModal(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Institute</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update institutional details and management.</p>
              </div>
              <form onSubmit={handleUpdateInstitute} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Institute Name</label>
                    <input
                      type="text"
                      required
                      value={editInstitute.name}
                      onChange={(e) => setEditInstitute(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={editInstitute.email}
                      onChange={(e) => setEditInstitute(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                    <input
                      type="text"
                      value={editInstitute.phone}
                      onChange={(e) => setEditInstitute(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Address</label>
                    <input
                      type="text"
                      value={editInstitute.address}
                      onChange={(e) => setEditInstitute(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={editInstitute.description}
                    onChange={(e) => setEditInstitute(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Primary Admin</label>
                  <select
                    required
                    value={editInstitute.adminId}
                    onChange={(e) => setEditInstitute(prev => ({ ...prev, adminId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all bg-white dark:bg-slate-900 dark:text-white"
                  >
                    {users
                      .filter(u => u.role !== 'super_admin')
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.email} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditInstituteModal(null)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={batching}
                    className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 dark:shadow-amber-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {batching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Institute'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmAction(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden p-8 text-center"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
                confirmAction.type === 'role' || confirmAction.type === 'institute' && confirmAction.targetName !== 'DELETE_INSTITUTE' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {confirmAction.type === 'role' ? <Shield className="w-10 h-10" /> : (confirmAction.type === 'institute' ? <Building2 className="w-10 h-10" /> : <X className="w-10 h-10" />)}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {confirmAction.targetName === 'DELETE_USER' ? 'Delete User Account' : 
                 confirmAction.targetName === 'DELETE_INSTITUTE' ? 'Delete Institute' :
                 (confirmAction.type === 'role' ? 'Confirm Role Change' : 'Remove Assignment')}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                {confirmAction.targetName === 'DELETE_USER' ? (
                  <>Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">{confirmAction.userName}</span>? This action cannot be undone.</>
                ) : confirmAction.targetName === 'DELETE_INSTITUTE' ? (
                  <>Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">{confirmAction.instituteName}</span>? This will leave its programs and applications orphaned.</>
                ) : confirmAction.type === 'role' ? (
                  <>Are you sure you want to change the role of <span className="font-bold text-slate-900 dark:text-white">{confirmAction.userName}</span> to <span className="font-bold text-slate-900 dark:text-white capitalize">{confirmAction.targetName}</span>?</>
                ) : (
                  <>Are you sure you want to remove <span className="font-bold text-slate-900 dark:text-white">{confirmAction.targetName}</span> from <span className="font-bold text-slate-900 dark:text-white">{confirmAction.userName}</span>&apos;s assignments?</>
                )}
                {confirmAction.type === 'role' && confirmAction.targetId !== 'admission_officer' && confirmAction.targetName !== 'DELETE_USER' && (
                  <span className="block mt-2 text-rose-500 dark:text-rose-400 font-medium text-sm">This will also clear all their program assignments.</span>
                )}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={updating || batching}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.targetName === 'DELETE_USER') {
                      handleDeleteStaff(confirmAction.userId!);
                    } else if (confirmAction.targetName === 'DELETE_INSTITUTE') {
                      deleteInstitute(confirmAction.instituteId!);
                    } else if (confirmAction.type === 'role') {
                      handleRoleUpdate(confirmAction.userId!, confirmAction.targetId!);
                    } else {
                      handleRemoveProgram(confirmAction.userId!, confirmAction.targetId!);
                    }
                  }}
                  disabled={updating || batching}
                  className={`flex-1 px-6 py-3 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                    confirmAction.targetName === 'DELETE_USER' || confirmAction.targetName === 'DELETE_INSTITUTE' || confirmAction.type === 'program' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 dark:shadow-rose-900/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-100 dark:shadow-amber-900/20'
                  }`}
                >
                  {updating || batching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
