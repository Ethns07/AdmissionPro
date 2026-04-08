'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFirebase } from './FirebaseProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  Bell,
  ChevronDown,
  User as UserIcon,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user, profile, loading } = useFirebase();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setShowUserMenu(false);
  };

  const navLinks = [
    { name: 'Programs', href: '/programs', icon: BookOpen, roles: ['guest', 'student', 'admin', 'super_admin', 'admission_officer', 'parent'] },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student', 'admin', 'super_admin', 'admission_officer', 'parent'] },
    { name: 'Applications', href: '/admin/applications', icon: FileText, roles: ['admin', 'super_admin', 'admission_officer'] },
    { name: 'Staff', href: '/admin/staff', icon: Users, roles: ['super_admin'] },
  ];

  const filteredLinks = navLinks.filter(link => 
    !profile ? link.roles.includes('guest') : link.roles.includes(profile.role)
  );

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 py-2' 
        : 'bg-white border-b border-slate-100 py-3'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div 
                whileHover={{ rotate: -10, scale: 1.1 }}
                className="bg-slate-900 p-1.5 rounded-xl shadow-lg shadow-slate-200"
              >
                <GraduationCap className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-display font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                AdmissionPro
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                      isActive 
                        ? 'text-indigo-600 bg-indigo-50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {link.name}
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 rounded-full"
                        initial={false}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    <div className="text-right hidden lg:block">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {profile?.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                        {profile?.role.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-100">
                      {profile?.displayName?.[0] || user.email?.[0].toUpperCase()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowUserMenu(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20"
                        >
                          <div className="px-4 py-3 border-b border-slate-50 mb-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                          <Link 
                            href="/dashboard" 
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <UserIcon className="w-4 h-4" /> My Profile
                          </Link>
                          <Link 
                            href="/dashboard" 
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="w-4 h-4" /> Settings
                          </Link>
                          <div className="h-px bg-slate-50 my-1" />
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/programs"
                  className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-xl transition-all ${
                isOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-bold transition-all ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <link.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
              
              <div className="h-px bg-slate-100 my-4" />
              
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-3 bg-slate-50 rounded-xl mb-2">
                    <p className="text-sm font-bold text-slate-900">{profile?.displayName || 'User'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-3 rounded-xl text-base font-bold text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-base font-bold text-slate-600 bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/programs"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-base font-bold text-white bg-slate-900"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
