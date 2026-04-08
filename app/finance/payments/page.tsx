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
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download,
  Loader2,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion } from 'motion/react';
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
  Pie
} from 'recharts';

export default function FinanceManagementPage() {
  const { profile, loading: authLoading } = useFirebase();
  const router = useRouter();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && (!profile || !['admin', 'super_admin', 'finance_officer'].includes(profile.role))) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (paymentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payments/${paymentId}`);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      payment.applicationId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    
    return matchesSearch && matchesMethod;
  });

  const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0);
  
  const chartData = [
    { name: 'Online', value: payments.filter(p => p.method === 'online').length },
    { name: 'Cash', value: payments.filter(p => p.method === 'cash').length },
    { name: 'Cheque', value: payments.filter(p => p.method === 'cheque').length },
    { name: 'DD', value: payments.filter(p => p.method === 'dd').length },
  ];

  const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8'];

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
            <h1 className="text-3xl font-display font-bold text-slate-900">Finance Management</h1>
            <p className="text-slate-500">Track fee collections and reconcile payments</p>
          </div>
          
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Revenue</p>
              <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-slate-400" />
              Payment Methods Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-slate-400" />
              Collection Summary
            </h2>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-slate-600 font-medium">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by receipt or application ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all bg-white text-sm font-medium"
              >
                <option value="all">All Methods</option>
                <option value="online">Online</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="dd">Demand Draft</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Receipt #</th>
                    <th className="px-6 py-4 font-medium">Application ID</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">
                        {payment.receiptNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {payment.applicationId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        ${payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          payment.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(payment.id, 'completed')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(payment.id, 'failed')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPayments.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-slate-500">No payment records found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
