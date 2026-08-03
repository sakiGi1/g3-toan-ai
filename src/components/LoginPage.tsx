import React, { useState } from 'react';
import { User, ClassItem } from '../types';
import { safeFetchJson } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  classes: ClassItem[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, classes }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, password, role, classId };

      const data = await safeFetchJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      localStorage.setItem('lms_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const fillSampleCredentials = (sampleRole: 'admin' | 'teacher' | 'student') => {
    setMode('login');
    setError(null);
    if (sampleRole === 'admin') {
      setEmail('admin@lms.edu.vn');
      setPassword('admin123');
    } else if (sampleRole === 'teacher') {
      setEmail('teacher.hung@lms.edu.vn');
      setPassword('teacher123');
    } else {
      setEmail('student.nam@lms.edu.vn');
      setPassword('student123');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 text-zinc-900 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-block bg-zinc-900 text-white px-3 py-1 text-xs font-mono font-bold uppercase rounded tracking-wider">
          Socratic LMS Engine
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">
          {mode === 'login' ? 'Đăng Nhập Hệ Thống' : 'Tạo Tài Khoản Mới'}
        </h2>
        <p className="text-xs text-zinc-500 font-mono">
          Vui lòng nhập thông tin để truy cập không gian học tập & quản lý
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`py-2 text-center rounded border transition ${
            mode === 'login'
              ? 'bg-zinc-900 text-white font-bold border-zinc-900'
              : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Đăng Nhập
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`py-2 text-center rounded border transition ${
            mode === 'register'
              ? 'bg-zinc-900 text-white font-bold border-zinc-900'
              : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Đăng Ký
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-1">
              Họ và Tên
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập họ và tên..."
              className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-mono text-zinc-600 mb-1">
            Địa chỉ Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@lms.edu.vn"
            className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-600 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
          />
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-mono text-zinc-600 mb-1">
                Vai Trò Tài Khoản
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-mono"
              >
                <option value="student">Học Sinh (Student)</option>
                <option value="teacher">Giáo Viên (Teacher)</option>
                <option value="admin">Quản Trị Viên (Admin)</option>
              </select>
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-xs font-mono text-zinc-600 mb-1">
                  Chọn Lớp Học
                </label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-mono"
                >
                  <option value="">-- Chưa chọn lớp --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-lg text-xs font-mono uppercase tracking-wider transition disabled:opacity-50 mt-2"
        >
          {loading
            ? 'Đang Xử Lý...'
            : mode === 'login'
            ? 'Đăng Nhập Ngay'
            : 'Tạo Tài Khoản'}
        </button>
      </form>

      {/* Helper preset buttons to fill form fields for convenience */}
      {mode === 'login' && (
        <div className="pt-4 border-t border-zinc-200 text-center space-y-2">
          <div className="text-[11px] font-mono text-zinc-500">
            Điền nhanh thông tin tài khoản mẫu:
          </div>
          <div className="flex justify-center gap-2 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => fillSampleCredentials('admin')}
              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded"
            >
              [Admin]
            </button>
            <button
              type="button"
              onClick={() => fillSampleCredentials('teacher')}
              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded"
            >
              [Giáo Viên]
            </button>
            <button
              type="button"
              onClick={() => fillSampleCredentials('student')}
              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded"
            >
              [Học Sinh]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
