import React, { useState } from 'react';
import { User, ClassItem } from '../types';
import { safeFetchJson } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  classes: ClassItem[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  classes,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 rounded-lg max-w-md w-full p-6 text-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-4">
          <h2 className="text-lg font-bold font-mono tracking-tight text-zinc-900">
            {mode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : 'ĐĂNG KÝ TÀI KHOẢN MỚI'}
          </h2>
          <button
            onClick={onClose}
            className="text-xs font-mono text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200"
          >
            [Đóng]
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
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
            1. Đăng Nhập
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
            2. Đăng Ký
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded">
            Lỗi: {error}
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
                className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
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
              className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
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
              className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-mono text-zinc-600 mb-1">
                  Vai Trò Trong Hệ Thống
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-mono"
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
                    className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-800 font-mono"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-4 rounded text-xs font-mono uppercase tracking-wider transition disabled:opacity-50"
            >
              {loading ? 'Đang Xử Lý...' : mode === 'login' ? 'Xác Nhận Đăng Nhập' : 'Tạo Tài Khoản Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
