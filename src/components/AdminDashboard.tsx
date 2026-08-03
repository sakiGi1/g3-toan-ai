import React, { useState, useEffect } from 'react';
import { TeacherItem, StudentItem, ClassItem } from '../types';
import { safeFetchJson } from '../lib/api';

interface AdminDashboardProps {
  token: string;
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, activeTab }) => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Forms State
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');

  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacherId, setNewClassTeacherId] = useState('');

  // Editing student
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu'>('Khá');
  const [editClassId, setEditClassId] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [dataT, dataS, dataC] = await Promise.all([
        safeFetchJson('/api/teacher', { headers }).catch(() => ({ teachers: [] })),
        safeFetchJson('/api/student', { headers }).catch(() => ({ students: [] })),
        safeFetchJson('/api/class', { headers }).catch(() => ({ classes: [] })),
      ]);

      if (dataT.teachers) setTeachers(dataT.teachers);
      if (dataS.students) setStudents(dataS.students);
      if (dataC.classes) setClasses(dataC.classes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await safeFetchJson('/api/teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeacherName,
          email: newTeacherEmail,
          password: newTeacherPass,
        }),
      });

      setMsg('Đã tạo tài khoản Giáo viên thành công!');
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPass('');
      fetchAdminData();
    } catch (err: any) {
      setMsg(`Lỗi: ${err.message}`);
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) return;
    try {
      await safeFetchJson(`/api/teacher/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg('Đã xóa giáo viên');
      fetchAdminData();
    } catch (err) {
      console.error('Lỗi khi xóa giáo viên:', err);
    }
  };

  // Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await safeFetchJson('/api/class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newClassName,
          teacherId: newClassTeacherId || undefined,
        }),
      });

      setMsg('Đã khởi tạo lớp học mới!');
      setNewClassName('');
      setNewClassTeacherId('');
      fetchAdminData();
    } catch (err: any) {
      setMsg(`Lỗi: ${err.message}`);
    }
  };

  // Delete Class
  const handleDeleteClass = async (id: string) => {
    if (!confirm('Xóa lớp học này khỏi hệ thống?')) return;
    try {
      await safeFetchJson(`/api/class/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdminData();
    } catch (err) {
      console.error('Error deleting class:', err);
    }
  };

  // Save Student Update
  const handleSaveStudent = async (id: string) => {
    try {
      await safeFetchJson(`/api/student/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          level: editLevel,
          classId: editClassId,
        }),
      });

      setMsg('Cập nhật thông tin học sinh thành công!');
      setEditingStudentId(null);
      fetchAdminData();
    } catch (err) {
      console.error('Error saving student:', err);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Xóa học sinh này? Hành động không thể hoàn tác.')) return;
    try {
      await safeFetchJson(`/api/student/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdminData();
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              PANEL BẢNG ĐIỀU HÀNH ADMIN
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mt-1">
              Quản Lý Hệ Thống Học Tập
            </h2>
          </div>
          <div className="flex gap-2 font-mono text-xs">
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-1 rounded">
              Giáo viên: {teachers.length}
            </span>
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-1 rounded">
              Học sinh: {students.length}
            </span>
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-1 rounded">
              Lớp học: {classes.length}
            </span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono rounded">
          Thông báo: {msg}
        </div>
      )}

      {/* 1. TEACHER MANAGEMENT TAB */}
      {(activeTab === 'teachers' || activeTab === 'admin') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              1. QUẢN LÝ GIÁO VIÊN
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Tạo tài khoản & phân công]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Teacher Form */}
            <form onSubmit={handleCreateTeacher} className="bg-white border border-zinc-200 p-4 rounded-lg space-y-3 shadow-xs">
              <h4 className="text-xs font-mono font-bold text-zinc-900 uppercase">
                Tạo Tài Khoản Giáo Viên Mới
              </h4>
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Họ và Tên Giáo Viên
                </label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  placeholder="Thầy/Cô..."
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Email Đăng Nhập
                </label>
                <input
                  type="email"
                  required
                  value={newTeacherEmail}
                  onChange={e => setNewTeacherEmail(e.target.value)}
                  placeholder="teacher@lms.edu.vn"
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Mật Khẩu Ban Đầu
                </label>
                <input
                  type="password"
                  required
                  value={newTeacherPass}
                  onChange={e => setNewTeacherPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-3 rounded text-xs font-mono transition"
              >
                + Khởi Tạo Tài Khoản Giáo Viên
              </button>
            </form>

            {/* Teacher List Table */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="py-2 px-2">HỌ VÀ TÊN</th>
                    <th className="py-2 px-2">EMAIL</th>
                    <th className="py-2 px-2">SỐ LỚP</th>
                    <th className="py-2 px-2 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-50">
                      <td className="py-2.5 px-2 font-sans font-medium text-zinc-900">
                        {t.name}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-600">{t.email}</td>
                      <td className="py-2.5 px-2 text-zinc-700">
                        {t.classCount || 0} Lớp
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => handleDeleteTeacher(t.id)}
                          className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded"
                        >
                          [Xóa]
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-zinc-400">
                        Chưa có dữ liệu giáo viên
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 2. CLASS MANAGEMENT TAB */}
      {(activeTab === 'classes' || activeTab === 'admin') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              2. QUẢN LÝ LỚP HỌC
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Tạo lớp & phân công giảng dạy]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Class Form */}
            <form onSubmit={handleCreateClass} className="bg-white border border-zinc-200 p-4 rounded-lg space-y-3 shadow-xs">
              <h4 className="text-xs font-mono font-bold text-zinc-900 uppercase">
                Khởi Tạo Lớp Học Mới
              </h4>
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Tên Lớp Học
                </label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp 12A3 - Khối Tự Nhiên"
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Phân Công Giáo Viên Phụ Trách
                </label>
                <select
                  value={newClassTeacherId}
                  onChange={e => setNewClassTeacherId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800 font-mono"
                >
                  <option value="">-- Chưa phân công --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-3 rounded text-xs font-mono transition"
              >
                + Khởi Tạo Lớp Học
              </button>
            </form>

            {/* Class List Table */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="py-2 px-2">TÊN LỚP HỌC</th>
                    <th className="py-2 px-2">GIÁO VIÊN PHỤ TRÁCH</th>
                    <th className="py-2 px-2">SĨ SỐ</th>
                    <th className="py-2 px-2 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {classes.map(c => (
                    <tr key={c.id} className="hover:bg-zinc-50">
                      <td className="py-2.5 px-2 font-sans font-medium text-zinc-900">
                        {c.name}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-700">
                        {c.teacherName || 'Chưa phân công'}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-600">
                        {c.studentCount || 0} Học sinh
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => handleDeleteClass(c.id)}
                          className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded"
                        >
                          [Xóa Lớp]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 3. STUDENT MANAGEMENT TAB */}
      {(activeTab === 'students' || activeTab === 'admin') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              3. QUẢN LÝ HỌC SINH & XẾP LOẠI
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Danh sách học sinh & chỉnh sửa trình độ]
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 px-2">HỌ VÀ TÊN</th>
                  <th className="py-2 px-2">EMAIL</th>
                  <th className="py-2 px-2">LỚP HỌC</th>
                  <th className="py-2 px-2">TRÌNH ĐỘ (LEVEL)</th>
                  <th className="py-2 px-2 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {students.map(s => {
                  const isEditing = editingStudentId === s.id;

                  return (
                    <tr key={s.id} className="hover:bg-zinc-50">
                      <td className="py-2.5 px-2 font-sans font-medium text-zinc-900">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-600">{s.email}</td>

                      {/* Class Column */}
                      <td className="py-2.5 px-2 text-zinc-700">
                        {isEditing ? (
                          <select
                            value={editClassId}
                            onChange={e => setEditClassId(e.target.value)}
                            className="bg-white border border-zinc-300 text-zinc-900 rounded px-2 py-1 text-xs"
                          >
                            <option value="">Chưa chọn lớp</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          s.className || 'Chưa xếp lớp'
                        )}
                      </td>

                      {/* Level Column */}
                      <td className="py-2.5 px-2">
                        {isEditing ? (
                          <select
                            value={editLevel}
                            onChange={e => setEditLevel(e.target.value as any)}
                            className="bg-white border border-zinc-300 text-zinc-900 rounded px-2 py-1 text-xs"
                          >
                            <option value="Giỏi">Giỏi</option>
                            <option value="Khá">Khá</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Yếu">Yếu</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              s.level === 'Giỏi'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : s.level === 'Khá'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : s.level === 'Trung bình'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {s.level}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveStudent(s.id)}
                              className="px-2 py-1 text-[11px] bg-zinc-900 text-white font-bold rounded"
                            >
                              [Lưu]
                            </button>
                            <button
                              onClick={() => setEditingStudentId(null)}
                              className="px-2 py-1 text-[11px] bg-zinc-200 text-zinc-700 rounded"
                            >
                              [Hủy]
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingStudentId(s.id);
                                setEditLevel(s.level);
                                setEditClassId(s.classId || '');
                              }}
                              className="px-2 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded"
                            >
                              [Sửa Trình Độ/Lớp]
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="px-2 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded"
                            >
                              [Xóa]
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
