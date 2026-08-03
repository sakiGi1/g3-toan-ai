import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth,
}) => {
  return (
    <header className="bg-white border-b border-zinc-200 text-zinc-900 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 text-white px-2.5 py-1 text-xs font-mono font-bold tracking-wider rounded">
              LMS + AI
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-zinc-900">
                Socratic LMS
              </h1>
              <p className="text-[11px] text-zinc-500 font-mono hidden sm:block">
                Hệ Thống Học Tập & AI Trợ Lý Socratic
              </p>
            </div>
          </div>

          {/* User Nav Tabs */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('teachers')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'teachers'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Quản Lý Giáo Viên
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'students'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Quản Lý Học Sinh
                  </button>
                  <button
                    onClick={() => setActiveTab('classes')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'classes'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Quản Lý Lớp
                  </button>
                </>
              )}

              {user.role === 'teacher' && (
                <>
                  <button
                    onClick={() => setActiveTab('teacher-classes')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'teacher-classes'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Danh Sách Lớp
                  </button>
                  <button
                    onClick={() => setActiveTab('teacher-lessons')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'teacher-lessons'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Quản Lý Bài Học
                  </button>
                  <button
                    onClick={() => setActiveTab('teacher-progress')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'teacher-progress'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Theo Dõi Tiến Độ
                  </button>
                  <button
                    onClick={() => setActiveTab('teacher-evidences')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'teacher-evidences'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Quản Lý Minh Chứng
                  </button>
                </>
              )}

              {user.role === 'student' && (
                <>
                  <button
                    onClick={() => setActiveTab('student-lessons')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'student-lessons'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Học Bài
                  </button>
                  <button
                    onClick={() => setActiveTab('student-ai-chat')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'student-ai-chat'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Chat Với AI Socratic
                  </button>
                  <button
                    onClick={() => setActiveTab('student-progress')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'student-progress'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Xem Tiến Độ
                  </button>
                  <button
                    onClick={() => setActiveTab('student-upload')}
                    className={`px-3 py-1.5 rounded transition ${
                      activeTab === 'student-upload'
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    Upload Minh Chứng
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-zinc-800">{user.name}</div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">
                    Vai trò: {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Giáo Viên' : 'Học Sinh'}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded transition"
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded transition"
                >
                  Đăng Nhập / Đăng Ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
