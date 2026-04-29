'use client';

import React from 'react';
import Link from 'next/link';
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
  GraduationCap,
  Building2,
  Users,
  BarChart3,
  Search,
  Lock,
  Database,
  Cpu,
  Workflow
} from 'lucide-react';

export default function LandingPage() {
  const { profile } = useFirebase();
  const isStudent = profile && profile.role === 'student';
  
  // Mouse tracking for subtle parallax effect
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth - 0.5) * 20,
      y: (clientY / innerHeight - 0.5) * 20
    });
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
      onMouseMove={handleMouseMove}
    >
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section - Elite Institutional Design */}
        <section className="relative min-h-[90vh] flex items-center pt-8 pb-16 lg:pt-12 lg:pb-32 overflow-hidden bg-slate-50 dark:bg-slate-950">
          {/* Advanced Background Architecture */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            {/* Dynamic Mesh Gradients with Mouse Parallax */}
            <motion.div 
              animate={{ 
                x: mousePos.x * -1.5,
                y: mousePos.y * -1.5,
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
                opacity: [0.08, 0.12, 0.08]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-500 rounded-full blur-[140px]" 
            />
            <motion.div 
              animate={{ 
                x: mousePos.x * 1.5,
                y: mousePos.y * 1.5,
                scale: [1, 1.2, 1],
                rotate: [0, -5, 0],
                opacity: [0.05, 0.1, 0.05]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[140px]" 
            />
            
            {/* Fine Technical Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_80%,transparent_100%)]" />
            
            {/* Floating Geometric Accents with Parallax */}
            <motion.div 
              animate={{ 
                x: mousePos.x * 0.5,
                y: [0, 15, 0], 
                opacity: [0.3, 0.6, 0.3] 
              }}
              transition={{ 
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute top-1/4 left-1/4 w-12 h-12 border border-indigo-500/20 rounded-lg rotate-12"
            />
            <motion.div 
              animate={{ 
                x: mousePos.x * -0.5,
                y: [0, -15, 0], 
                opacity: [0.2, 0.5, 0.2] 
              }}
              transition={{ 
                y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 },
                opacity: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }
              }}
              className="absolute bottom-1/4 right-1/4 w-16 h-16 border-2 border-blue-500/10 rounded-full"
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="max-w-5xl mx-auto">
              <div className="relative z-10">
                {/* Refined Institutional Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl shadow-indigo-500/5 mb-6 group cursor-default"
                >
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Institutional Governance Protocol v2.4
                  </span>
                </motion.div>
                
                {/* Hero Headline with Animated Gradient & Stagger */}
                <div className="mb-12 overflow-visible">
                  <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-display font-black tracking-tight text-slate-950 dark:text-white leading-[1.1] md:leading-[1.05]"
                  >
                    <div className="flex flex-wrap justify-center overflow-visible">
                      {["The", "Global", "Standard"].map((word, i) => (
                        <motion.span
                          key={i}
                          initial={{ y: 20, opacity: 0, scale: 0.9 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="inline-block mr-[0.2em] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-500"
                        >
                          {word}
                        </motion.span>
                      ))}
                    </div>
                    <motion.span 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 1 }}
                      className="inline-block mt-2 relative"
                    >
                      <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 dark:from-indigo-400 dark:via-blue-400 dark:to-blue-200 drop-shadow-sm">
                        Academic Intake.
                      </span>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1.5, duration: 1.2, ease: "circOut" }}
                        className="absolute -bottom-4 left-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
                      />
                    </motion.span>
                  </motion.h1>
                </div>
                
                {/* High-Impact Subtext */}
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="max-w-4xl mx-auto text-base md:text-lg text-slate-600 dark:text-slate-400 mb-16 leading-relaxed font-medium tracking-tight"
                >
                  Sophisticated infrastructure for modern academic registrars. Automated eligibility verification, verified credential routing, and secure enrollment pipeline management at institutional scale.
                </motion.p>
                
                {/* Sophisticated CTA Cluster with Glassmorphism */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-6 relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/programs"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-[10px] font-black text-white bg-slate-950 dark:bg-indigo-600 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all shadow-[0_15px_40px_rgba(79,70,229,0.25)] group overflow-hidden relative border border-white/10 tracking-[0.2em] uppercase"
                    >
                      <span className="relative z-10 flex items-center">
                        Access Program Catalog
                        <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </span>
                      <motion.div 
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                      />
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-[10px] font-black text-slate-950 dark:text-white bg-white/20 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800 transition-all backdrop-blur-2xl shadow-lg tracking-[0.2em] uppercase"
                    >
                      Institutional Console
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll Discovery Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600">Discover Protocol</span>
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-px h-12 bg-gradient-to-b from-indigo-500/50 to-transparent"
            />
          </motion.div>
        </section>

        {/* Feature Ecosystem Section */}
        <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-4">Core Infrastructure</h2>
              <p className="text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                High-Performance Tools for Academic Operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Database,
                  title: "Unified Registrar Base",
                  desc: "A single source of truth for student records, enrollment status, and institutional program catalogs.",
                },
                {
                  icon: Cpu,
                  title: "Automated Verification",
                  desc: "Rule-based scoring engines that detect eligibility and compute merit rankings in real-time.",
                },
                {
                  icon: Lock,
                  title: "Role-Based Authority",
                  desc: "Granular access control ensuring sensitive student data and financial records are strictly protected.",
                },
                {
                  icon: Workflow,
                  title: "Pipeline Automation",
                  desc: "Move candidates from application to enrollment through custom state-machine workflows.",
                },
                {
                  icon: BarChart3,
                  title: "Strategic Analytics",
                  desc: "Identify intake trends and optimize program capacities with live data visualization dashboards.",
                },
                {
                  icon: Search,
                  title: "Global Audit Search",
                  desc: "Instantly locate records across the entire institutional history with powerful forensic indexing.",
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section - Operations Architecture */}
        <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
          
          {/* Architectural Lines */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
              <div className="lg:col-span-12 text-center mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 mb-6 font-mono text-[10px] font-black tracking-widest text-indigo-400 uppercase leading-none">
                    Execution_Logic_v2
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-display font-black mb-8 leading-[1.1] tracking-tight">
                    Seamless Lifecycle Management.
                  </h2>
                  <p className="max-w-4xl mx-auto text-base md:text-lg text-slate-400 leading-relaxed font-medium tracking-tight">
                    Sophisticated infrastructure for modern academic registrars. Automated eligibility verification, verified credential routing, and secure enrollment pipeline management at institutional scale.
                  </p>
                </motion.div>
              </div>

              <div className="lg:col-span-5">
                <div className="space-y-10 relative">
                  {/* Progress Line */}
                  <div className="absolute left-[1.35rem] top-2 bottom-2 w-px bg-slate-800" />
                  
                  {[
                    {
                      icon: GraduationCap,
                      title: "Protocol Intake",
                      desc: "Zero-friction registration engine with edge-validated credential collect via distributed nodes."
                    },
                    {
                      icon: Cpu,
                      title: "Intelligent Scoring",
                      desc: "Proprietary evaluation logic calculates eligibility indices against institutional compliance benchmarks."
                    },
                    {
                      icon: ShieldCheck,
                      title: "Authority Consensus",
                      desc: "Immutable record creation via multi-signature officer approval and secure database commits."
                    }
                  ].map((s, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-8 group"
                    >
                      <div className="relative z-10 shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-all duration-500">
                        <s.icon className="w-5 h-5" />
                        <div className="absolute -inset-1 bg-indigo-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2 tracking-tight group-hover:text-indigo-400 transition-colors uppercase text-xs font-black tracking-widest underline decoration-indigo-500/10 decoration-2 underline-offset-4">{s.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium tracking-tight">{s.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="lg:col-span-7 relative"
              >
                 <div className="absolute -inset-10 bg-indigo-500/5 blur-[120px] rounded-full" />
                 
                 {/* High-Fidelity Dashboard Preview */}
                 <div className="relative bg-[#0a0c10] border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl overflow-hidden shadow-indigo-500/5">
                    {/* Glass header */}
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                       <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-800" />
                          <div className="w-3 h-3 rounded-full bg-slate-800" />
                          <div className="w-3 h-3 rounded-full bg-slate-800" />
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">System_Online</div>
                          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Institutional_Grid_A1</div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                       {[
                         { label: "Active_Threads", value: "24", icon: Zap, color: "text-amber-400" },
                         { label: "Latency_Index", value: "12ms", icon: Clock, color: "text-indigo-400" },
                         { label: "Success_Rate", value: "99.98%", icon: CheckCircle2, color: "text-emerald-400" }
                       ].map((stat, i) => (
                         <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                               <stat.icon className={`w-4 h-4 ${stat.color}`} />
                               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <p className="text-xl font-black font-mono tracking-tighter">{stat.value}</p>
                         </div>
                       ))}
                    </div>

                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/5 to-blue-600/5 border border-indigo-500/20 relative overflow-hidden">
                       <div className="relative z-10">
                          <div className="flex justify-between items-end mb-8">
                             <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Workload_Intensity</p>
                                <p className="text-2xl font-black tracking-tight">Eligibility Queue Alpha</p>
                             </div>
                             <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 text-right">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Queue_Priority</p>
                                <p className="text-sm font-mono font-bold text-white">CRITICAL_HI</p>
                             </div>
                          </div>
                          
                          <div className="space-y-6">
                             <div className="relative">
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                   <motion.div 
                                     animate={{ width: ["10%", "95%", "30%", "85%"] }}
                                     transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                                     className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
                                   />
                                </div>
                                <motion.div 
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute -top-6 left-[65%] text-[10px] font-mono font-bold text-indigo-400"
                                >
                                  OPTIMIZING...
                                </motion.div>
                             </div>
                             
                             <div className="flex justify-between items-center">
                                <div className="flex -space-x-3">
                                   {[1,2,3,4].map(i => (
                                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black">U{i}</div>
                                   ))}
                                   <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-black">+12</div>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                   Current_Session: <span className="text-white">Active</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       {/* Background decorative elements */}
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Integration Hub / Logo Cloud section - Replaced with Text Badges */}
        <section className="py-24 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-900">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Security & Compliance Standards</p>
              <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-30">
                 <div className="flex items-center gap-3 font-display font-black text-2xl italic tracking-tighter text-slate-900 dark:text-white">
                    <ShieldCheck className="w-8 h-8" /> ISO_27001
                 </div>
                 <div className="flex items-center gap-3 font-display font-black text-2xl italic tracking-tighter text-slate-900 dark:text-white">
                    <Lock className="w-8 h-8" /> SOC2_TYPE_II
                 </div>
                 <div className="flex items-center gap-3 font-display font-black text-2xl italic tracking-tighter text-slate-900 dark:text-white">
                    <Globe className="w-8 h-8" /> DATA_EU_RES
                 </div>
                 <div className="flex items-center gap-3 font-display font-black text-2xl italic tracking-tighter text-slate-900 dark:text-white">
                    <ShieldCheck className="w-8 h-8" /> FERPA_CERT
                 </div>
              </div>
           </div>
        </section>

        {/* Modern Call to Action */}
        <section className="py-32 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-12 lg:p-24 bg-slate-900 dark:bg-indigo-600 rounded-[3rem] text-center text-white overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl lg:text-5xl font-display font-bold mb-6 leading-tight">
                  Ready to evolve your <br /> institutional operations?
                </h2>
                <p className="text-lg text-slate-400 dark:text-indigo-100 mb-12 font-medium">
                  Join the network of forward-thinking institutions using our infrastructure to scale their academic reach and operational efficiency.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/programs"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 text-sm font-bold text-slate-900 bg-white rounded-xl hover:bg-slate-50 transition-all shadow-xl shadow-white/5 group"
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 text-sm font-bold text-white border-2 border-white/20 rounded-xl hover:bg-white/10 transition-all font-display"
                  >
                    Enterprise Login
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-indigo-600 flex items-center justify-center rounded-xl shadow-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-slate-900 dark:text-white">AdmissionPro</span>
            </div>
            
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <Link href="#" className="hover:text-indigo-600 transition-colors">Infrastructure</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Governance</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Authority</Link>
              <Link href="#" className="hover:text-indigo-600 transition-colors">Support</Link>
            </div>

            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">
              © 2026 ADMISSION_PRO_INTL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
