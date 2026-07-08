import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Briefcase, User, LogOut, LayoutDashboard, Search, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export function Layout() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'it' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span>puulp.<span className="text-blue-600">it</span></span>
          </Link>
          <nav className="flex items-center gap-6">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'IT' : 'EN'}
            </button>
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-2">
              <Search className="h-4 w-4" /> {t('nav.home')}
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> {t('nav.dashboard')}
                </Link>
                <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
                  <Link to="/dashboard" className="flex items-center gap-2 group">
                    <img src={user.photoURL || ''} alt="Avatar" className="h-8 w-8 rounded-full border border-gray-200 group-hover:border-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 hidden md:block group-hover:text-blue-600 transition-colors">{user.displayName}</span>
                  </Link>
                  <button
                    onClick={signOut}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                    title={t('nav.signout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-end">
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 shadow-sm"
                >
                  <User className="h-4 w-4" /> {t('nav.signin')}
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
