'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Menu, X, LogOut } from 'lucide-react';

interface HeaderProps {
  showLoginButtons?: boolean;
}

export default function Header({ showLoginButtons = true }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    const userToken = localStorage.getItem('authToken');
    const adminToken = localStorage.getItem('token');

    if (userToken) {
      setIsLoggedIn(true);
      setUserType('user');
    } else if (adminToken) {
      setIsLoggedIn(true);
      setUserType('admin');
    } else {
      setIsLoggedIn(false);
      setUserType(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserType(null);
    router.push('/');
  };

  const navigateToDashboard = () => {
    if (userType === 'admin') {
      router.push('/admin/dashboard');
    } else if (userType === 'user') {
      router.push('/tools');
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center animate-float">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-display text-gray-900">TrustInn</h1>
              <p className="text-sm text-gray-600 font-body hidden sm:block">Secure Testing Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-body">Pricing</a>
            <a href="/about" className="text-gray-600 hover:text-blue-600 transition-colors font-body">About</a>
            <a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors font-body">Contact</a>

            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={navigateToDashboard}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-accent"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors font-accent flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : showLoginButtons ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/?login=user')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-accent flex items-center gap-2"
                >
                  <Users size={18} />
                  User Login
                </button>
                <button
                  onClick={() => router.push('/admin/login')}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-accent flex items-center gap-2"
                >
                  <Shield size={18} />
                  Admin Portal
                </button>
              </div>
            ) : null}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg animate-fade-in">
            <div className="px-4 py-4 space-y-4">
              <a href="/pricing" className="block text-gray-600 hover:text-blue-600 transition-colors font-body py-2">Pricing</a>
              <a href="/about" className="block text-gray-600 hover:text-blue-600 transition-colors font-body py-2">About</a>
              <a href="/contact" className="block text-gray-600 hover:text-blue-600 transition-colors font-body py-2">Contact</a>

              {isLoggedIn ? (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={navigateToDashboard}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-accent"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors font-accent"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : showLoginButtons ? (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      router.push('/?login=user');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-accent flex items-center justify-center gap-2"
                  >
                    <Users size={18} />
                    User Login
                  </button>
                  <button
                    onClick={() => {
                      router.push('/admin/login');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-accent flex items-center justify-center gap-2"
                  >
                    <Shield size={18} />
                    Admin Portal
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}