'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { motion } from 'motion/react';
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
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent opacity-70" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 mb-6 border border-indigo-100">
                <Zap className="w-4 h-4 mr-2 text-indigo-500" />
                Modern Admission Management
              </span>
              <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight text-slate-900 mb-6">
                Streamline Your <span className="text-indigo-600">Admission</span> Journey
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed">
                A complete end-to-end solution for online and offline admissions. 
                Automated eligibility checks, merit calculation, and secure fee management.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/programs"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 group"
                >
                  Browse Programs
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-900 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Student Login
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Why Choose AdmissionPro?</h2>
              <p className="text-slate-600">Built for efficiency, transparency, and speed.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Automated Eligibility",
                  desc: "Rule-based system automatically evaluates applications based on marks and criteria.",
                  icon: ShieldCheck,
                  color: "text-indigo-500",
                  bg: "bg-indigo-50"
                },
                {
                  title: "Real-time Tracking",
                  desc: "Students can track their application status from submission to final enrollment.",
                  icon: Clock,
                  color: "text-amber-500",
                  bg: "bg-amber-50"
                },
                {
                  title: "Hybrid Admissions",
                  desc: "Seamlessly manage both online registrations and manual offline entries.",
                  icon: Globe,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all"
                >
                  <div className={`${feature.bg} ${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { label: "Applications Processed", value: "50k+" },
                { label: "Success Rate", value: "98%" },
                { label: "Programs Offered", value: "120+" },
                { label: "Active Institutions", value: "45" }
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl font-display font-bold mb-2 text-indigo-100">{stat.value}</p>
                  <p className="text-indigo-300 text-sm uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-slate-900" />
              <span className="text-xl font-display font-bold tracking-tight">AdmissionPro</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500">
              <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-slate-900 transition-colors">Contact Support</Link>
            </div>
            <p className="text-sm text-slate-400">© 2026 AdmissionPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
