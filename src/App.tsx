import React, { useState, useEffect } from 'react';
import { User, ClassItem } from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';

import { safeFetchJson } from './lib/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  useEffect(() => {
    // Check existing auth token
    const savedToken = localStorage.getItem('lms_token');
    if (savedToken) {
      verifyUserToken(savedToken);
    } else {
      setUser(null);
    }
  }, []);

  const verifyUserToken = async (authToken: string) => {
    try {
      const data = await safeFetchJson('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(data.user);
      setToken(authToken);
      setDefaultTabForRole(data.user.role);
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('lms_token');
      setUser(null);
    }
  };

  const setDefaultTabForRole = (role: string) => {
    if (role === 'admin') setActiveTab('teachers');
    else if (role === 'teacher') setActiveTab('teacher-lessons');
    else setActiveTab('student-lessons');
  };

  const fetchClasses = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const data = await safeFetchJson('/api/class', { headers });
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('lms_token');
    setUser(null);
    setToken('');
  };

  const handleLoginSuccess = (loggedInUser: User, loggedInToken: string) => {
    setUser(loggedInUser);
    setToken(loggedInToken);
    setDefaultTabForRole(loggedInUser.role);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-200 selection:text-zinc-900">
      {/* Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            classes={classes}
          />
        ) : (
          <>
            {user.role === 'admin' && (
              <AdminDashboard token={token} activeTab={activeTab} />
            )}

            {user.role === 'teacher' && (
              <TeacherDashboard token={token} activeTab={activeTab} />
            )}

            {user.role === 'student' && (
              <StudentDashboard token={token} activeTab={activeTab} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>
            Socratic LMS Engine &copy; 2026. Tích hợp Next.js 15, Prisma ORM, PostgreSQL & Gemini AI.
          </div>
        </div>
      </footer>

      {/* Auth Modal Dialog for popup if opened from navbar */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        classes={classes}
      />
    </div>
  );
}
