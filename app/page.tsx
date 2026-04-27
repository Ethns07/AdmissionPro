'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { motion } from 'motion/react';
import { useFirebase } from '@/components/FirebaseProvider';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock,
  Globe,
  Award,
  GraduationCap
} from 'lucide-react';

export default function LandingPage() {
  const { profile } = useFirebase();
  const isStudent = profile && profile.role === 'student';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 lg:pt-32 lg:pb-32 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-40 mix-blend-overlay pointer-events-none" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-left"
              >
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-8 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  Precision Intake Infrastructure
                </motion.span>
                
                <h1 className="text-6xl lg:text-8xl font-display font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.95]">
                  Intelligent <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-400 dark:to-emerald-400">Academic Intake.</span>
                </h1>
                
                <p className="max-w-xl text-lg lg:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                  Deploy a high-performance admission engine designed for modern institutions. Automate verification, optimize merit-based selection, and scale your enrollment with industrial-grade reliability.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    href="/programs"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-900 dark:bg-indigo-600 rounded-2xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg dark:shadow-indigo-900/40 group active:scale-95"
                  >
                    Explore Catalogs
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-95 shadow-sm"
                  >
                    Student Portal
                  </Link>
                </div>
                
                {/* Micro-stats */}
                <div className="mt-12 flex flex-wrap gap-8 items-center border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">50k+</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Throughput</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">120+</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Programs</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-500 dark:text-emerald-400">
                      <GraduationCap className="w-4 h-4" />
                      <p className="text-2xl font-bold">98%</p>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Selection Rate</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="relative hidden lg:block"
              >
                {/* Floating Mockup Card 1 */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-12 -left-12 w-64 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Verification</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">App #4592 Verified</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-emerald-500" 
                    />
                  </div>
                </motion.div>

                {/* Main Visual Component - Using an optimized abstract background */}
                <div className="relative rounded-[3rem] overflow-hidden border-[8px] border-white dark:border-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] aspect-[4/5] bg-slate-100 dark:bg-slate-800">
                  <Image 
                    src="https://picsum.photos/seed/admission-modern/1200/1500" 
                    alt="Admission Process"
                    fill
                    className="object-cover opacity-60 dark:opacity-40 grayscale"
                    referrerPolicy="no-referrer"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/40 via-transparent to-emerald-500/20 mix-blend-multiply" />
                  
                  {/* Floating App Mockup Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 border border-white/20">
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Rule-Based Admission</h3>
                    <p className="text-white/70 text-sm">Automated eligibility scoring engine</p>
                    
                    <div className="mt-8 space-y-3 w-full">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 bg-white/20 backdrop-blur-sm rounded-full w-full opacity-50" style={{ width: `${100 - (i * 15)}%`, margin: '0 auto' }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Badge 2 */}
                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-8 -right-8 bg-slate-900 dark:bg-white p-6 rounded-3xl shadow-2xl z-20 text-white dark:text-slate-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 dark:border-white bg-slate-800 dark:bg-slate-200" />
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Active Users</p>
                      <p className="text-lg font-bold leading-tight">1.2k+ Online</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid - Enhanced with industrial spacing and bento-inspired cards */}
        <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
              <div className="max-w-2xl">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6"
                >
                  Engineered for <br /><span className="text-indigo-600 dark:text-indigo-400">Institutional Growth</span>
                </motion.h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  AdmissionPro is the unified operating layer for your registrar. We provide the technical foundation for zero-friction student onboarding.
                </p>
              </div>
              <Link href="/programs" className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2 group">
                Explore all features <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Feature 1: Bento Wide */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-8 p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center gap-10 hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
              >
                <div className="flex-1 order-2 md:order-1">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Algorithmic Eligibility</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    Execute complex eligibility logic in milliseconds. Our automated engine parses academic records to verify prerequisites with 100% precision.
                  </p>
                  <ul className="space-y-3">
                    {['Real-time merit computation', 'Deterministic rule sets', 'Automated decision routing'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 order-1 md:order-2 w-full md:w-auto aspect-video md:aspect-square bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden relative shadow-inner">
                  <Image 
                    src="https://picsum.photos/seed/scoring/800/800" 
                    alt="Automation" 
                    fill 
                    className="object-cover mix-blend-overlay opacity-50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
                      <p className="text-3xl font-bold text-indigo-600">89.4%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Merit Score</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2: Bento Tall */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:col-span-4 p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-amber-500/20 group-hover:rotate-12 transition-transform">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Lifecycle Transparency</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    End-to-end audit trails for every applicant. From initial contact to final enrollment, monitor your intake pipeline with granular visibility.
                  </p>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="h-1.5 w-16 bg-indigo-600 rounded-full" />
                      <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </div>
                    <p className="text-4xl font-bold text-slate-200 dark:text-slate-800">24/7</p>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3: Small Bento */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="md:col-span-6 p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-500/20 group-hover:-translate-y-2 transition-transform">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Omnichannel Enrollment</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Synchronize online registrations and physical walk-in admissions via a single source of truth. Eliminate data silos instantly.
                </p>
              </motion.div>

              {/* Feature 4: Small Bento */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-6 p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex flex-col justify-center relative overflow-hidden"
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">Enterprise-Grade Security</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Protected by hardened infrastructure and global compliance standards. Secure sensitive PII and financial records with bank-level encryption.
                  </p>
                </div>
                <div className="absolute right-[-10%] bottom-[-10%] opacity-20 rotate-12">
                   <ShieldCheck className="w-48 h-48" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Institutional Section */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 lg:p-20 overflow-hidden relative shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[100px] translate-x-1/3" />
              
              <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-6 border border-amber-100 dark:border-amber-500/20"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                    Institutional Enterprise
                  </motion.span>
                  <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6">
                    Management Portal for <br />
                    <span className="text-amber-600 dark:text-amber-500">Staff & Administrators</span>
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                    Designed for heavy-duty registrar operations. Securely manage program catalogs, evaluate student credentials with automated scoring, and oversee the entire financial pipeline from one unified command center.
                  </p>
                  
                  <div className="space-y-4 mb-10">
                    {[
                      "Role-based access control (RBAC)",
                      "Bulk application processing",
                      "Financial reconciliation & auditing",
                      "Automated merit list generation"
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/login?type=institution"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-amber-600 rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/20 group"
                  >
                    Enter Institute Portal
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-inner">
                    <Image 
                      src="https://picsum.photos/seed/dashboard-staff/1200/800" 
                      alt="Staff Dashboard" 
                      fill 
                      className="object-cover opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8">
                      <p className="text-white font-bold text-lg">Centralized Intake Control</p>
                      <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Registry OS v2.4</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-600/5 backdrop-blur-3xl" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 divide-x divide-slate-800">
              {[
                { label: "Applicant Throughput", value: "50k+", trend: "+12%" },
                { label: "Selection Accuracy", value: "98%", trend: "High" },
                { label: "Academic Catalogs", value: "120+", trend: "Live" },
                { label: "Partner Institutions", value: "45", trend: "Global" }
              ].map((stat, i) => (
                <div key={i} className="pl-8 first:pl-0">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    {stat.trend}
                  </span>
                  <p className="text-5xl font-display font-bold mb-3 tracking-tighter">{stat.value}</p>
                  <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* New CTA Section: The Final Push */}
        <section className="py-32 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-indigo-600 rounded-[3rem] p-12 lg:p-24 text-center text-white relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(79,70,229,0.4)]"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl lg:text-6xl font-display font-bold mb-8 leading-tight">
                  Modernize your <br /> institutional intake.
                </h2>
                <p className="text-xl text-indigo-100 mb-12 leading-relaxed opacity-90">
                  Scale your enrollment capacity with the industry standard for academic admission management. Deploy AdmissionPro in minutes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link
                    href={profile ? "/dashboard" : "/programs"}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-indigo-600 bg-white rounded-2xl hover:bg-indigo-50 transition-all shadow-xl active:scale-95 group"
                  >
                    {profile ? "Go to Dashboard" : "Get Started Now"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                  {!isStudent && (
                    <Link
                      href="/login?type=institution"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white border-2 border-white/30 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                    >
                      Institutional Login
                    </Link>
                  )}
                </div>
                <p className="mt-10 text-indigo-200 text-sm font-medium">
                  Free consultation available for new institutions.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 dark:bg-indigo-600 p-1.5 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-white">AdmissionPro</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400">
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Support</Link>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">© 2026 AdmissionPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
