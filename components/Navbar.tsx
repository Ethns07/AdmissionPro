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
  ChevronDown,
  User as UserIcon,
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
    { name: 'Home', href: '/', icon: GraduationCap, roles: ['guest', 'student', 'admin', 'super_admin', 'admission_officer', 'parent'] },
    { name: 'Programs', href: '/programs', icon: BookOpen, roles: ['guest', 'student', 'admin', 'super_admin', 'admission_officer', 'parent'] },
    { name: 'Dashboard', href: ['admin', 'super_admin', 'admission_officer'].includes(profile?.role || '') ? '/admin' : '/dashboard', icon: LayoutDashboard, roles: ['student', 'admin', 'super_admin', 'admission_officer', 'parent'] },
    { name: 'Applications', href: '/admin/applications', icon: FileText, roles: ['admin', 'super_admin', 'admission_officer'] },
    { name: 'Staff', href: '/admin/staff', icon: Users, roles: ['admin', 'super_admin'] },
  ];

  const filteredLinks = navLinks.filter(link => 
    !profile ? link.roles.includes('guest') : link.roles.includes(profile.role)
  );

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/20 border-b border-slate-200 dark:border-slate-800 py-2' 
        : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4'
    }`}>
      {/* Loading Progress Bar */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600 origin-left z-50"
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group" aria-label="AdmissionPro Home">
              <motion.div 
                animate={{ scale: isScrolled ? 0.9 : 1 }}
                whileHover={{ rotate: -10, scale: 1.1 }}
                className="bg-slate-900 dark:bg-indigo-600 p-1.5 rounded-xl shadow-lg shadow-slate-200 dark:shadow-indigo-900/20"
              >
                <GraduationCap className="w-6 h-6 text-white" />
              </motion.div>
              <span className={`font-display font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300 ${
                isScrolled ? 'text-lg' : 'text-xl'
              }`}>
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
                    aria-label={`Navigate to ${link.name}`}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 group ${
                      isActive 
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-slate-300'}`} />
                    {link.name}
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"
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
              <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 transition-all group"
                  >
                    <div className="text-right hidden lg:block">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {profile?.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider opacity-80">
                        {profile?.role.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-indigo-900/20 group-hover:scale-105 transition-transform">
                      {profile?.displayName?.[0] || user.email?.[0].toUpperCase()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowUserMenu(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                          className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-20 overflow-hidden"
                        >
                          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700 mb-1 bg-slate-50/50 dark:bg-slate-900/50">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.displayName || 'User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                          </div>
                          <div className="p-1">
                            <Link 
                              href="/dashboard" 
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <UserIcon className="w-4 h-4" />
                              </div>
                              My Profile
                            </Link>
                            <Link 
                              href="/dashboard" 
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <Settings className="w-4 h-4" />
                              </div>
                              Settings
                            </Link>
                          </div>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />
                          <div className="p-1">
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                                <LogOut className="w-4 h-4" />
                              </div>
                              Sign Out
                            </button>
                          </div>
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
                  className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/programs"
                  className="px-5 py-2 text-sm font-bold text-slate-900 bg-white rounded-xl hover:bg-indigo-400 transition-all shadow-lg shadow-white/10"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className={`p-2 rounded-xl transition-all ${
                isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl z-50"
            >
              <div className="px-4 pt-4 pb-8 space-y-2">
                {filteredLinks.map((link, idx) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center px-4 py-3.5 rounded-2xl text-base font-bold transition-all ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'
                        }`}
                      >
                        <link.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                        {link.name}
                      </Link>
                    </motion.div>
                  );
                })}
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-6 mx-2" />
                
                {user ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: filteredLinks.length * 0.05 }}
                    className="space-y-3"
                  >
                    <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {profile?.displayName?.[0] || user.email?.[0].toUpperCase()}
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.displayName || 'User'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        <UserIcon className="w-4 h-4" /> Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-4 rounded-2xl text-base font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign Out
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: filteredLinks.length * 0.05 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center px-4 py-4 rounded-2xl text-base font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/programs"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center px-4 py-4 rounded-2xl text-base font-bold text-slate-900 bg-white hover:bg-indigo-400 transition-all shadow-lg shadow-white/10"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
