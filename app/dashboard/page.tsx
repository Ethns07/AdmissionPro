'use client';

import React, { useEffect, useState } from 'react';
import { useFirebase } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  CreditCard,
  Plus,
  Calendar,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { SeedButton } from '@/components/SeedButton';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile, loading } = useFirebase();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !profile) return;

    let q;
    const appsRef = collection(db, 'applications');

    if (profile.role === 'student') {
      q = query(appsRef, where('studentUid', '==', user.uid), orderBy('createdAt', 'desc'));
    } else if (['admin', 'super_admin', 'admission_officer'].includes(profile.role)) {
      q = query(appsRef, orderBy('createdAt', 'desc'), limit(10));
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setApplications(apps);
      
      // Simple stats calculation
      if (profile.role !== 'student') {
        const total = snapshot.size;
        const pending = apps.filter(a => a.status === 'pending').length;
        const enrolled = apps.filter(a => a.status === 'enrolled').length;
        setStats({ total, pending, enrolled });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    return () => unsubscribe();
  }, [user, profile]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-display font-bold text-slate-900">
            Welcome back, {profile.displayName || 'User'}
          </h1>
          <p className="text-slate-500 capitalize">{profile.role.replace('_', ' ')} Dashboard</p>
        </header>

        {profile.role === 'student' ? (
          <StudentDashboard applications={applications} />
        ) : (
          <AdminDashboard stats={stats} recentApplications={applications} role={profile.role} />
        )}
      </main>
    </div>
  );
}

const StudentDashboard = ({ applications }: { applications: any[] }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Applications</p>
              <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="text-2xl font-bold text-slate-900">
                {applications.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Offers Received</p>
              <p className="text-2xl font-bold text-slate-900">
                {applications.filter(a => a.status === 'offer_extended').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">My Applications</h2>
          <Link 
            href="/programs" 
            className="text-sm font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> New Application
          </Link>
        </div>
        
        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Application ID</th>
                  <th className="px-6 py-3 font-medium">Program</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{app.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{app.programName || 'Loading...'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        app.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {app.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/applications/${app.id}`}
                        className="text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500">You haven&apos;t submitted any applications yet.</p>
            <Link href="/programs" className="mt-4 inline-block text-slate-900 font-bold hover:underline">
              Browse Programs & Apply
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = ({ stats, recentApplications, role }: { stats: any, recentApplications: any[], role: string }) => {
  return (
    <div className="space-y-8">
      {role === 'super_admin' && (
        <div className="flex justify-end mb-4">
          <SeedButton />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Applications" value={stats?.total || 0} icon={Users} color="indigo" />
        <StatCard title="Pending Review" value={stats?.pending || 0} icon={Clock} color="amber" />
        <StatCard title="Final Enrollments" value={stats?.enrolled || 0} icon={CheckCircle} color="emerald" />
        <StatCard title="Daily Collections" value="$12,450" icon={CreditCard} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
            <Link href="/admin/applications" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Applicant</th>
                  <th className="px-6 py-3 font-medium">Program</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{app.studentName || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{app.studentEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{app.programName || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-semibold text-indigo-600 hover:underline">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/admin/offline-admission" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <span className="text-sm font-medium text-slate-700">Offline Admission</span>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
              </Link>
              <Link href="/admin/programs/new" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <span className="text-sm font-medium text-slate-700">Create Program</span>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
              </Link>
              <Link href="/admin/categories" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <span className="text-sm font-medium text-slate-700">Manage Categories</span>
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold mb-2 text-indigo-100">System Status</h3>
            <p className="text-sm text-indigo-300 mb-4">All admission rules are active and running correctly.</p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className={`${colors[color]} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
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
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
