import React, { useState, useEffect } from 'react';
import { LessonItem, ClassItem, ProgressItem, EvidenceItem, StudentItem } from '../types';
import { safeFetchJson } from '../lib/api';

interface TeacherDashboardProps {
  token: string;
  activeTab: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ token, activeTab }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [progresses, setProgresses] = useState<ProgressItem[]>([]);
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // New Lesson State
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Updating Score/Status
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<'Chưa học' | 'Đang học' | 'Hoàn thành'>('Đang học');

  useEffect(() => {
    fetchTeacherData();
  }, [token]);

  const fetchTeacherData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [dataC, dataL, dataP, dataE, dataS] = await Promise.all([
        safeFetchJson('/api/class', { headers }).catch(() => ({ classes: [] })),
        safeFetchJson('/api/lesson', { headers }).catch(() => ({ lessons: [] })),
        safeFetchJson('/api/progress', { headers }).catch(() => ({ progress: [] })),
        safeFetchJson('/api/evidence', { headers }).catch(() => ({ evidences: [] })),
        safeFetchJson('/api/student', { headers }).catch(() => ({ students: [] })),
      ]);

      if (dataC.classes) setClasses(dataC.classes);
      if (dataL.lessons) setLessons(dataL.lessons);
      if (dataP.progress) setProgresses(dataP.progress);
      if (dataE.evidences) setEvidences(dataE.evidences);
      if (dataS.students) setStudents(dataS.students);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    }
  };

  // Create or Update Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      const url = editingLessonId ? `/api/lesson/${editingLessonId}` : '/api/lesson';
      const method = editingLessonId ? 'PUT' : 'POST';

      await safeFetchJson(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: lessonTitle,
          content: lessonContent,
        }),
      });

      setMsg(editingLessonId ? 'Đã cập nhật nội dung bài học!' : 'Đã xuất bản bài học mới!');
      setLessonTitle('');
      setLessonContent('');
      setEditingLessonId(null);
      fetchTeacherData();
    } catch (err: any) {
      setMsg(`Lỗi: ${err.message}`);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Xóa bài học này khỏi chương trình?')) return;
    try {
      await safeFetchJson(`/api/lesson/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeacherData();
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  // Update Student Score / Status
  const handleSaveProgress = async (studentId: string, lessonId: string) => {
    try {
      await safeFetchJson('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          lessonId,
          status: editStatus,
          score: editScore !== '' ? Number(editScore) : undefined,
        }),
      });

      setMsg('Đã lưu điểm số và trạng thái học tập!');
      setEditingProgressId(null);
      fetchTeacherData();
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Teacher Header Banner */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              GIAO DIỆN GIẢNG DẠY DÀNH CHO GIÁO VIÊN
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mt-1">
              Quản Lý Lớp, Bài Học & Theo Dõi Tiến Độ
            </h2>
          </div>
          <div className="flex gap-2 font-mono text-xs">
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-1 rounded">
              Bài học: {lessons.length}
            </span>
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-1 rounded">
              Minh chứng: {evidences.length}
            </span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono rounded">
          Thông báo: {msg}
        </div>
      )}

      {/* 1. CLASSES MANAGEMENT */}
      {(activeTab === 'teacher-classes' || activeTab === 'teacher') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              1. DANH SÁCH LỚP HỌC PHỤ TRÁCH
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Thông tin sĩ số và phân loại học sinh]
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map(c => {
              const classStudents = students.filter(s => s.classId === c.id);

              return (
                <div key={c.id} className="bg-white border border-zinc-200 p-5 rounded-lg space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <h4 className="text-sm font-bold text-zinc-900 font-sans">{c.name}</h4>
                    <span className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded border border-zinc-200">
                      {c.studentCount || classStudents.length} Học sinh
                    </span>
                  </div>

                  <div className="space-y-1 text-xs font-mono text-zinc-700">
                    <div className="text-[11px] text-zinc-500 uppercase font-bold mb-1">
                      Danh sách học sinh trong lớp:
                    </div>
                    {classStudents.map(s => (
                      <div key={s.id} className="flex justify-between py-1 border-b border-zinc-100">
                        <span>{s.name} ({s.email})</span>
                        <span className="text-zinc-600 font-bold">{s.level}</span>
                      </div>
                    ))}
                    {classStudents.length === 0 && (
                      <div className="text-zinc-400 py-1">Chưa có học sinh nào gán vào lớp này.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. LESSONS MANAGEMENT */}
      {(activeTab === 'teacher-lessons' || activeTab === 'teacher') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              2. QUẢN LÝ VÀ BIÊN SOẠN BÀI HỌC
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Soạn giáo án & nội dung bài giảng]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create/Edit Lesson Form */}
            <form onSubmit={handleSaveLesson} className="bg-white border border-zinc-200 p-4 rounded-lg space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-zinc-900 uppercase">
                  {editingLessonId ? 'Chỉnh Sửa Bài Học' : 'Soạn Bài Học Mới'}
                </h4>
                {editingLessonId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLessonId(null);
                      setLessonTitle('');
                      setLessonContent('');
                    }}
                    className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 underline"
                  >
                    [Hủy Chỉnh Sửa]
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Tiêu Đề Bài Học
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  placeholder="Tiêu đề bài giảng..."
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Nội Dung Bài Học (Tóm tắt, Công thức, Bài tập)
                </label>
                <textarea
                  rows={8}
                  required
                  value={lessonContent}
                  onChange={e => setLessonContent(e.target.value)}
                  placeholder="Nhập nội dung tóm tắt, công thức cốt lõi và bài tập mẫu..."
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-3 rounded text-xs font-mono transition"
              >
                {editingLessonId ? 'Cập Nhật Bài Học' : '+ Xuất Bản Bài Học'}
              </button>
            </form>

            {/* Lessons List */}
            <div className="lg:col-span-2 space-y-3">
              {lessons.map(l => (
                <div key={l.id} className="bg-white border border-zinc-200 p-4 rounded-lg space-y-2 shadow-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <h4 className="text-sm font-bold text-zinc-900 font-sans">{l.title}</h4>
                    <div className="space-x-2 font-mono text-xs">
                      <button
                        onClick={() => {
                          setEditingLessonId(l.id);
                          setLessonTitle(l.title);
                          setLessonContent(l.content);
                        }}
                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded"
                      >
                        [Sửa]
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(l.id)}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded"
                      >
                        [Xóa]
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-700 font-sans whitespace-pre-line line-clamp-3">
                    {l.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. PROGRESS TRACKING */}
      {(activeTab === 'teacher-progress' || activeTab === 'teacher') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              3. THEO DÕI TIẾN ĐỘ & CHẤM ĐIỂM HỌC SINH
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Bảng tổng hợp tiến độ hoàn thành các bài học]
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 px-2">HỌC SINH</th>
                  <th className="py-2 px-2">LỚP</th>
                  <th className="py-2 px-2">BÀI HỌC</th>
                  <th className="py-2 px-2">TRẠNG THÁI</th>
                  <th className="py-2 px-2">ĐIỂM SỐ (0 - 10)</th>
                  <th className="py-2 px-2 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {progresses.map(p => {
                  const isEditing = editingProgressId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="py-2.5 px-2 font-sans font-medium text-zinc-900">
                        {p.studentName}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-600">{p.className}</td>
                      <td className="py-2.5 px-2 text-zinc-700">{p.lessonTitle}</td>

                      {/* Status */}
                      <td className="py-2.5 px-2">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value as any)}
                            className="bg-white border border-zinc-300 text-zinc-900 rounded px-2 py-1 text-xs"
                          >
                            <option value="Chưa học">Chưa học</option>
                            <option value="Đang học">Đang học</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              p.status === 'Hoàn thành'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.status === 'Đang học'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-2.5 px-2">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={editScore}
                            onChange={e => setEditScore(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Điểm..."
                            className="w-20 bg-white border border-zinc-300 text-zinc-900 rounded px-2 py-1 text-xs"
                          />
                        ) : (
                          <span className="font-bold text-zinc-900">
                            {p.score !== undefined ? `${p.score} / 10` : 'Chưa chấm'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveProgress(p.studentId, p.lessonId)}
                              className="px-2 py-1 text-[11px] bg-zinc-900 text-white font-bold rounded"
                            >
                              [Lưu Điểm]
                            </button>
                            <button
                              onClick={() => setEditingProgressId(null)}
                              className="px-2 py-1 text-[11px] bg-zinc-200 text-zinc-700 rounded"
                            >
                              [Hủy]
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingProgressId(p.id);
                              setEditScore(p.score !== undefined ? p.score : '');
                              setEditStatus(p.status);
                            }}
                            className="px-2 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded"
                          >
                            [Nhập Điểm / Trạng Thái]
                          </button>
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

      {/* 4. EVIDENCE MANAGEMENT */}
      {(activeTab === 'teacher-evidences' || activeTab === 'teacher') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              4. QUẢN LÝ VÀ ĐÁNH GIÁ MINH CHỨNG
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Duyệt tập tin và hình ảnh bài nộp học sinh]
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidences.map(e => (
              <div key={e.id} className="bg-white border border-zinc-200 p-4 rounded-lg space-y-3 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>{e.studentName} ({e.className})</span>
                    <span>{new Date(e.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 font-sans">{e.title}</h4>
                  <div className="text-xs font-mono text-zinc-500">Loại minh chứng: {e.fileType}</div>

                  {/* Preview image if image URL */}
                  {e.fileUrl.startsWith('data:image') || e.fileUrl.includes('unsplash') || e.fileUrl.includes('cloudinary') ? (
                    <div className="mt-2 rounded border border-zinc-200 overflow-hidden bg-zinc-50">
                      <img
                        src={e.fileUrl}
                        alt={e.title}
                        className="w-full h-44 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-xs font-mono text-zinc-700">
                      Tập tin tài liệu: {e.fileType}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                  <a
                    href={e.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-zinc-700 hover:text-zinc-900 underline"
                  >
                    [Xem Toàn Màn Hình]
                  </a>
                  <button
                    onClick={async () => {
                      if (!confirm('Xóa minh chứng này?')) return;
                      await fetch(`/api/evidence/${e.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      fetchTeacherData();
                    }}
                    className="text-[11px] font-mono text-rose-600 hover:text-rose-800"
                  >
                    [Xóa Minh Chứng]
                  </button>
                </div>
              </div>
            ))}
            {evidences.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-400 font-mono text-xs bg-white border border-zinc-200 rounded-lg">
                Chưa có minh chứng nào được học sinh tải lên
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
