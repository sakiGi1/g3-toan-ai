import React, { useState, useEffect, useRef } from 'react';
import { LessonItem, ProgressItem, EvidenceItem, ChatHistoryItem } from '../types';
import { safeFetchJson } from '../lib/api';

interface StudentDashboardProps {
  token: string;
  activeTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ token, activeTab }) => {
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [progresses, setProgresses] = useState<ProgressItem[]>([]);
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  // AI Chat State
  const [inputQuestion, setInputQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Evidence Upload State
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, aiLoading]);

  const fetchStudentData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [dataL, dataP, dataE, dataC] = await Promise.all([
        safeFetchJson('/api/lesson', { headers }).catch(() => ({ lessons: [] })),
        safeFetchJson('/api/progress', { headers }).catch(() => ({ progress: [] })),
        safeFetchJson('/api/evidence', { headers }).catch(() => ({ evidences: [] })),
        safeFetchJson('/api/chat/history', { headers }).catch(() => ({ history: [] })),
      ]);

      if (dataL.lessons) {
        setLessons(dataL.lessons);
        if (dataL.lessons.length > 0 && !selectedLesson) {
          setSelectedLesson(dataL.lessons[0]);
        }
      }
      if (dataP.progress) setProgresses(dataP.progress);
      if (dataE.evidences) setEvidences(dataE.evidences);
      if (dataC.history) setChatHistory(dataC.history);
    } catch (err) {
      console.error('Error fetching student data:', err);
    }
  };

  // Submit Socratic AI Question
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || aiLoading) return;

    const qText = inputQuestion.trim();
    setInputQuestion('');
    setAiLoading(true);

    // Optimistic user question entry
    const tempChat: ChatHistoryItem = {
      id: 'temp-' + Date.now(),
      studentId: 'me',
      question: qText,
      answer: 'Đang suy nghĩ câu hỏi gợi mở...',
      createdAt: new Date().toISOString(),
    };
    setChatHistory(prev => [...prev, tempChat]);

    try {
      const data = await safeFetchJson('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: qText,
          lessonId: selectedLesson?.id,
          lessonTitle: selectedLesson?.title,
        }),
      });

      // Update with real response
      setChatHistory(prev =>
        prev.map(c => (c.id === tempChat.id ? data.historyItem : c))
      );
    } catch (err: any) {
      setChatHistory(prev =>
        prev.map(c =>
          c.id === tempChat.id
            ? { ...c, answer: `Lỗi khi gọi AI: ${err.message}` }
            : c
        )
      );
    } finally {
      setAiLoading(false);
    }
  };

  // File Select Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload Evidence
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle || (!selectedFile && !previewDataUrl)) {
      setMsg('Vui lòng nhập tiêu đề và chọn tập tin minh chứng');
      return;
    }

    setUploading(true);
    setMsg(null);

    try {
      await safeFetchJson('/api/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: evidenceTitle,
          fileData: previewDataUrl,
          fileName: selectedFile?.name || 'minh-chung.jpg',
          fileType: selectedFile?.type || 'image/jpeg',
        }),
      });

      setMsg('Đã tải lên minh chứng học tập thành công!');
      setEvidenceTitle('');
      setSelectedFile(null);
      setPreviewDataUrl(null);
      fetchStudentData();
    } catch (err: any) {
      setMsg(`Lỗi: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Mark lesson status as complete or in progress
  const updateLessonStatus = async (lessonId: string, status: 'Đang học' | 'Hoàn thành') => {
    try {
      await safeFetchJson('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId, status }),
      });
      fetchStudentData();
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              KHÔNG GIAN HỌC TẬP HỌC SINH
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mt-1">
              Học Bài, Hỏi AI Socratic & Nộp Minh Chứng
            </h2>
          </div>
          <div className="font-mono text-xs text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded">
            Đã lưu: {chatHistory.length} Lượt hỏi AI
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono rounded">
          Thông báo: {msg}
        </div>
      )}

      {/* 1. LESSON STUDY TAB */}
      {(activeTab === 'student-lessons' || activeTab === 'student') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              1. BÀI HỌC VÀ LÝ THUYẾT
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Chọn bài học để nghiên cứu]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lesson Catalog Sidebar */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-zinc-600 uppercase">
                Danh Sách Bài Học
              </h4>
              <div className="space-y-2">
                {lessons.map(l => {
                  const prg = progresses.find(p => p.lessonId === l.id);
                  const isSelected = selectedLesson?.id === l.id;

                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLesson(l);
                        updateLessonStatus(l.id, 'Đang học');
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 font-bold shadow-xs'
                          : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="text-xs font-sans">{l.title}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                        <span className={isSelected ? 'text-zinc-300' : 'text-zinc-500'}>
                          Trạng thái: {prg?.status || 'Chưa học'}
                        </span>
                        {prg?.score !== undefined && (
                          <span className={isSelected ? 'text-emerald-300 font-bold' : 'text-emerald-600 font-bold'}>
                            Điểm: {prg.score}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Lesson Content View */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
              {selectedLesson ? (
                <>
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <h4 className="text-lg font-bold text-zinc-900 font-sans">
                      {selectedLesson.title}
                    </h4>
                    <button
                      onClick={() => updateLessonStatus(selectedLesson.id, 'Hoàn thành')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-mono rounded"
                    >
                      [Đánh Dấu Đã Hoàn Thành]
                    </button>
                  </div>

                  <div className="text-sm text-zinc-800 font-sans leading-relaxed whitespace-pre-line bg-zinc-50 p-4 rounded border border-zinc-200">
                    {selectedLesson.content}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 800, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono font-bold rounded"
                    >
                      [Chuyển Sang Khung Hỏi AI Socratic]
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-zinc-400 font-mono text-xs">
                  Vui lòng chọn bài học ở danh sách bên trái
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. SOCRATIC AI CHAT SESSION */}
      {(activeTab === 'student-ai-chat' || activeTab === 'student') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              2. TRỢ LÝ AI GIẢNG DẠY SOCRATIC
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Gợi ý từng bước, không cho đáp án trực tiếp]
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
            {/* Context Badge */}
            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded text-xs font-mono flex items-center justify-between text-zinc-600">
              <span>
                Đang trao đổi về: <strong className="text-zinc-900">{selectedLesson?.title || 'Tổng quát'}</strong>
              </span>
              <span className="text-[11px] text-zinc-500">
                Quy tắc: AI sẽ gợi ý từng bước & đặt câu hỏi ngược
              </span>
            </div>

            {/* Chat History Container */}
            <div className="h-96 overflow-y-auto space-y-4 p-4 bg-zinc-50 rounded border border-zinc-200">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 font-mono text-xs p-6 space-y-2">
                  <p className="text-zinc-800 font-bold">Bắt đầu trao đổi với AI Socratic!</p>
                  <p>Hãy hỏi về một bước tính toán, nhờ giải thích công thức, hoặc gửi lời giải của em để AI kiểm tra.</p>
                </div>
              ) : (
                chatHistory.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-3">
                    {/* Student Question */}
                    <div className="flex justify-end">
                      <div className="bg-zinc-900 text-white max-w-xl rounded-lg px-4 py-2.5 text-xs font-sans border border-zinc-800 shadow-xs">
                        <div className="text-[10px] font-mono text-zinc-300 mb-1 uppercase">
                          Học Sinh Hỏi:
                        </div>
                        {item.question}
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="bg-white text-zinc-900 max-w-2xl rounded-lg px-4 py-3 text-xs font-sans border border-zinc-200 space-y-1 shadow-xs">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider">
                          Trợ Lý AI Socratic:
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-zinc-600 px-4 py-2 rounded text-xs font-mono border border-zinc-200 animate-pulse shadow-xs">
                    AI Socratic đang phân tích câu hỏi và soạn gợi ý từng bước...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendQuestion} className="flex gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                placeholder="Nhập câu hỏi, thắc mắc công thức hoặc lời giải của em..."
                className="flex-1 bg-white border border-zinc-300 rounded px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
              />
              <button
                type="submit"
                disabled={aiLoading || !inputQuestion.trim()}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-5 py-2.5 rounded text-xs font-mono uppercase tracking-wider transition disabled:opacity-50"
              >
                [Gửi AI]
              </button>
            </form>
          </div>
        </section>
      )}

      {/* 3. STUDENT PROGRESS TAB */}
      {(activeTab === 'student-progress' || activeTab === 'student') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              3. KẾT QUẢ VÀ TIẾN ĐỘ HỌC TẬP
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Lịch sử theo dõi của giáo viên]
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 px-2">BÀI HỌC</th>
                  <th className="py-2 px-2">TRẠNG THÁI</th>
                  <th className="py-2 px-2">ĐIỂM SỐ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {progresses.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="py-2.5 px-2 font-sans font-medium text-zinc-900">
                      {p.lessonTitle}
                    </td>
                    <td className="py-2.5 px-2">
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
                    </td>
                    <td className="py-2.5 px-2 text-zinc-900 font-bold">
                      {p.score !== undefined ? `${p.score} / 10` : 'Chưa chấm điểm'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. EVIDENCE UPLOAD TAB */}
      {(activeTab === 'student-upload' || activeTab === 'student') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold font-mono text-zinc-900 uppercase">
              4. NỘP MINH CHỨNG HỌC TẬP
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              [Tải lên hình ảnh bài làm hoặc tài liệu]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Form */}
            <form onSubmit={handleUploadEvidence} className="bg-white border border-zinc-200 p-4 rounded-lg space-y-3 shadow-xs">
              <h4 className="text-xs font-mono font-bold text-zinc-900 uppercase">
                Tải Lên Minh Chứng Mới
              </h4>

              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Tiêu Đề Bài Nộp / Minh Chứng
                </label>
                <input
                  type="text"
                  required
                  value={evidenceTitle}
                  onChange={e => setEvidenceTitle(e.target.value)}
                  placeholder="Ví dụ: Bài tập phương trình bậc 2 - Lớp 12A1"
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">
                  Chọn Tập Tin / Ảnh Bài Làm
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-600 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-mono file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200"
                />
              </div>

              {previewDataUrl && (
                <div className="p-2 border border-zinc-200 rounded bg-zinc-50">
                  <div className="text-[10px] font-mono text-zinc-500 mb-1">
                    Xem trước minh chứng:
                  </div>
                  <img
                    src={previewDataUrl}
                    alt="Preview"
                    className="max-h-36 w-full object-contain rounded"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-3 rounded text-xs font-mono uppercase tracking-wider transition disabled:opacity-50"
              >
                {uploading ? 'Đang Tải Lên...' : '+ Nộp Minh Chứng'}
              </button>
            </form>

            {/* Evidence History List */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-mono font-bold text-zinc-600 uppercase">
                Lịch Sử Minh Chứng Đã Nộp ({evidences.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evidences.map(e => (
                  <div key={e.id} className="bg-white border border-zinc-200 p-3 rounded-lg space-y-2 shadow-xs">
                    <div className="text-[10px] font-mono text-zinc-500">
                      {new Date(e.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs font-bold text-zinc-900 font-sans">{e.title}</div>

                    {e.fileUrl.startsWith('data:image') || e.fileUrl.includes('unsplash') || e.fileUrl.includes('cloudinary') ? (
                      <img
                        src={e.fileUrl}
                        alt={e.title}
                        className="w-full h-32 object-cover rounded border border-zinc-200"
                      />
                    ) : (
                      <div className="p-3 bg-zinc-50 text-xs font-mono text-zinc-700 rounded border border-zinc-200">
                        Tập tin bài nộp
                      </div>
                    )}

                    <a
                      href={e.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[11px] font-mono text-zinc-600 hover:text-zinc-900 underline text-right"
                    >
                      [Xem Chi Tiết Tập Tin]
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
