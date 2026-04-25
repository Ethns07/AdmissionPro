'use client';

import React, { useEffect, useState } from 'react';
import { useFirebase } from '@/components/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Users, 
  BookOpen, 
  Layers, 
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Plus,
  Settings,
  Activity,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

export default function AdminDashboardPage() {
  const { user, profile, loading } = useFirebase();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReviews: 0,
    enrolledStudents: 0,
    activePrograms: 0,
    totalUsers: 0
  });
  
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [programDistribution, setProgramDistribution] = useState<any[]>([]);
  const [applicationTrends, setApplicationTrends] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && user && profile) {
      const isStaff = ['admin', 'super_admin', 'admission_officer'].includes(profile.role);
      const isApproved = profile.isApproved || profile.role === 'super_admin';
      
      if (!isStaff) {
        router.push('/dashboard');
      } else if (!isApproved) {
        router.push('/login?error=pending_approval');
      }
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user || !profile) return;

    // 1. Listen to Applications for stats and recent list
    const appsQuery = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const total = snapshot.size;
      const pending = apps.filter((a: any) => a.status === 'pending').length;
      const enrolled = apps.filter((a: any) => a.status === 'enrolled').length;
      
      setStats(prev => ({ ...prev, totalApplications: total, pendingReviews: pending, enrolledStudents: enrolled }));
      setRecentApplications(apps.slice(0, 5));

      // Calculate trends for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
          date: format(date, 'MMM dd'),
          fullDate: date,
          count: 0
        };
      }).reverse();

      apps.forEach((a: any) => {
        if (!a.createdAt) return;
        const appDate = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dayMatch = last7Days.find(d => isSameDay(d.fullDate, appDate));
        if (dayMatch) dayMatch.count++;
      });
      setApplicationTrends(last7Days);

      // Calculate distribution for chart
      const dist: Record<string, number> = {};
      apps.forEach((a: any) => {
        const name = a.programName || 'Unknown';
        dist[name] = (dist[name] || 0) + 1;
      });
      const chartData = Object.entries(dist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
      setProgramDistribution(chartData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });

    // 2. Listen to Programs and Categories for distribution
    const programsQuery = query(collection(db, 'programs'));
    const categoriesQuery = query(collection(db, 'categories'));

    const unsubscribeProgs = onSnapshot(programsQuery, (progSnapshot) => {
      const active = progSnapshot.docs.filter(doc => doc.data().isActive !== false).length;
      setStats(prev => ({ ...prev, activePrograms: active }));

      // Fetch categories to map names
      getDocs(categoriesQuery).then(catSnapshot => {
        const categories = catSnapshot.docs.reduce((acc: any, doc) => {
          acc[doc.id] = doc.data().name;
          return acc;
        }, {});

        const catDist: Record<string, number> = {};
        progSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const catName = categories[data.categoryId] || 'Uncategorized';
          catDist[catName] = (catDist[catName] || 0) + 1;
        });

        const catChartData = Object.entries(catDist).map(([name, value]) => ({ name, value }));
        setCategoryDistribution(catChartData);
      });
    });

    // 3. Listen to Users for total count and distribution
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
      
      const roles: Record<string, number> = {};
      users.forEach((u: any) => {
        const role = u.role || 'student';
        roles[role] = (roles[role] || 0) + 1;
      });
      const roleData = Object.entries(roles).map(([name, value]) => ({ 
        name: name.replace('_', ' '), 
        value 
      })).sort((a, b) => b.value - a.value);
      setRoleDistribution(roleData);
      
      setIsLoadingData(false);
    });

    return () => {
      unsubscribeApps();
      unsubscribeProgs();
      unsubscribeUsers();
    };
  }, [user, profile]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) return null;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">System Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {profile.displayName}. Here&apos;s what&apos;s happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Logs
            </button>
            {['admin', 'super_admin'].includes(profile?.role || '') && (
              <Link 
                href="/admin/programs/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg dark:shadow-indigo-900/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Program
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Applications" 
            value={stats.totalApplications} 
            icon={FileText} 
            trend="+12% from last week"
            color="indigo" 
          />
          <StatCard 
            title="Pending Reviews" 
            value={stats.pendingReviews} 
            icon={Clock} 
            trend="Needs attention"
            color="amber" 
          />
          <StatCard 
            title="Final Enrollments" 
            value={stats.enrolledStudents} 
            icon={UserCheck} 
            trend="+5 new today"
            color="emerald" 
          />
          <StatCard 
            title="Active Programs" 
            value={stats.activePrograms} 
            icon={BookOpen} 
            trend="Across 5 categories"
            color="purple" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Application Trends Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Application Trends
              </h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  Last 7 Days
                </span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationTrends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-10" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc'
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Program Categories
            </h2>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activePrograms}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Programs</p>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {categoryDistribution.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Program Popularity Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Program Popularity
              </h2>
              <span className="text-xs font-bold text-slate-400">Applications per Program</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-10" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc'
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {programDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Management Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                User Roles
              </h2>
              <div className="space-y-4">
                {roleDistribution.map((role, i) => (
                  <div key={role.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">{role.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{role.value}</span>
                  </div>
                ))}
              </div>
              <Link 
                href="/admin/staff" 
                className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                Manage Staff <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                Management
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <ManagementLink 
                  href="/admin/programs" 
                  title="Manage Programs" 
                  desc={`${stats.activePrograms} active offerings`}
                  icon={BookOpen}
                  color="indigo"
                />
                <ManagementLink 
                  href="/admin/applications" 
                  title="View Applications" 
                  desc={`${stats.pendingReviews} pending review`}
                  icon={FileText}
                  color="amber"
                />
                <ManagementLink 
                  href="/admin/categories" 
                  title="Program Categories" 
                  desc="Manage academic areas"
                  icon={Layers}
                  color="emerald"
                />
                <ManagementLink 
                  href="/admin/staff" 
                  title="User Roles & Staff" 
                  desc={`${stats.totalUsers} total registered users`}
                  icon={ShieldCheck}
                  color="purple"
                />
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <h3 className="font-bold mb-2 text-indigo-100">System Health</h3>
              <p className="text-sm text-indigo-300 mb-6 leading-relaxed">
                All services are operational. Automated eligibility checks are running at 100% accuracy.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </div>
                <span className="text-[10px] text-slate-500 font-mono">v2.4.0-stable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Applications</h2>
            <Link href="/admin/applications" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-8 py-4">Applicant</th>
                  <th className="px-8 py-4">Program</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Merit</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentApplications.map((app, i) => (
                  <motion.tr 
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                          {app.studentName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{app.studentName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{app.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{app.programName || 'N/A'}</span>
                    </td>
                    <td className="px-8 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${app.meritScore || 0}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{app.meritScore?.toFixed(1) || '0.0'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <Link 
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
                {recentApplications.length === 0 && !isLoadingData && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No recent applications found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const colors: any = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`${colors[color]} w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          trend.includes('+') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}>
          {trend}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
    </motion.div>
  );
};

const ManagementLink = ({ href, title, desc, icon: Icon, color }: any) => {
  const iconColors: any = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <Link 
      href={href} 
      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all group"
    >
      <div className={`${iconColors[color]} w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-grow">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
    </Link>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
    eligible: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    not_eligible: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
    waitlist: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
    offer_extended: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    enrolled: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
  };

  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${styles[status] || "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700"}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
