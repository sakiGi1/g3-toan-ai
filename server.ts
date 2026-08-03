import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, UserData, StudentData, LessonData, ClassData, EvidenceData, ProgressData } from './src/lib/store.js';
import { signToken, verifyToken, TokenPayload } from './src/lib/auth.js';
import { askSocraticTutor } from './src/lib/gemini.js';
import { uploadToCloudinary } from './src/lib/cloudinary.js';

const getDirname = () => {
  if (typeof import.meta !== 'undefined' && import.meta?.url) {
    try {
      return path.dirname(fileURLToPath(import.meta.url));
    } catch {
      return process.cwd();
    }
  }
  return process.cwd();
};
const __dirname = getDirname();

const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Middleware to extract Auth Token
const authMiddleware = (req: Request & { user?: TokenPayload }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa đăng nhập hoặc thiếu Auth Token' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
    }
    req.user = payload;
    next();
  };

  // --- API ROUTES ---

  // 1. Auth: Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập Email và Mới mật khẩu' });
    }

    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Email hoặc Mật khẩu không chính xác' });
    }

    const studentProfile = user.role === 'student' ? db.getStudentByUserId(user.id) : undefined;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: studentProfile?.id,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: studentProfile?.id,
        classId: studentProfile?.classId,
        level: studentProfile?.level,
      },
    });
  });

  // 2. Auth: Register
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, role = 'student', classId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ Tên, Email và Mật khẩu' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống' });
    }

    const newUser: UserData = {
      id: 'usr-' + Date.now(),
      name,
      email,
      password,
      role: (role === 'admin' || role === 'teacher' || role === 'student') ? role : 'student',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    let studentProfile: StudentData | undefined = undefined;
    if (newUser.role === 'student') {
      studentProfile = {
        id: 'std-' + Date.now(),
        userId: newUser.id,
        classId: classId || (db.classes[0]?.id || undefined),
        level: 'Khá',
      };
      db.students.push(studentProfile);
    }

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      studentId: studentProfile?.id,
    });

    return res.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId: studentProfile?.id,
        classId: studentProfile?.classId,
        level: studentProfile?.level,
      },
    });
  });

  // 3. Auth: Current User Profile
  app.get('/api/auth/me', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Không xác thực' });
    const user = db.getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });

    const studentProfile = user.role === 'student' ? db.getStudentByUserId(user.id) : undefined;

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: studentProfile?.id,
        classId: studentProfile?.classId,
        level: studentProfile?.level,
      },
    });
  });

  // 4. AI Socratic Chat
  app.post('/api/chat', authMiddleware, async (req: Request & { user?: TokenPayload }, res: Response) => {
    const { question, lessonId, lessonTitle } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Vui lòng cung cấp nội dung câu hỏi' });
    }

    const studentId = req.user?.studentId || 'std-guest';

    // Get lesson details if available
    let lessonContext = lessonTitle || '';
    if (lessonId) {
      const lesson = db.lessons.find(l => l.id === lessonId);
      if (lesson) {
        lessonContext = `[Nhan đề bài học]: ${lesson.title}\n[Nội dung tóm tắt]: ${lesson.content}`;
      }
    }

    // Get student chat history
    const pastChat = db.chatHistory
      .filter(c => c.studentId === studentId)
      .slice(-5)
      .map(c => ({ question: c.question, answer: c.answer }));

    // Generate Socratic response
    const answer = await askSocraticTutor(question, lessonContext, pastChat);

    // Record in history
    const historyItem = {
      id: 'chat-' + Date.now(),
      studentId,
      question,
      answer,
      createdAt: new Date().toISOString(),
    };
    db.chatHistory.push(historyItem);

    return res.json({ answer, historyItem });
  });

  // 5. Get Chat History for Student
  app.get('/api/chat/history', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    const studentId = req.user?.studentId || req.query.studentId as string;
    if (!studentId) return res.json({ history: [] });

    const history = db.chatHistory.filter(c => c.studentId === studentId);
    return res.json({ history });
  });

  // 6. Lessons API
  app.get('/api/lesson', (req: Request, res: Response) => {
    return res.json({ lessons: db.lessons });
  });

  app.post('/api/lesson', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Chỉ Giáo viên hoặc Admin mới có quyền tạo bài học' });
    }

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tiêu đề và nội dung bài học' });
    }

    const newLesson: LessonData = {
      id: 'lsn-' + Date.now(),
      title,
      content,
    };

    db.lessons.push(newLesson);
    return res.json({ lesson: newLesson });
  });

  app.put('/api/lesson/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa' });
    }

    const { id } = req.params;
    const { title, content } = req.body;
    const index = db.lessons.findIndex(l => l.id === id);

    if (index === -1) return res.status(404).json({ error: 'Không tìm thấy bài học' });

    if (title) db.lessons[index].title = title;
    if (content) db.lessons[index].content = content;

    return res.json({ lesson: db.lessons[index] });
  });

  app.delete('/api/lesson/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Không có quyền xóa' });
    }

    const { id } = req.params;
    db.lessons = db.lessons.filter(l => l.id !== id);
    return res.json({ success: true, message: 'Đã xóa bài học' });
  });

  // 7. Students API
  app.get('/api/student', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    const students = db.getAllStudentsWithDetails();
    return res.json({ students });
  });

  app.put('/api/student/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Không có quyền cập nhật' });
    }

    const { id } = req.params;
    const { level, classId, name } = req.body;

    const studentIndex = db.students.findIndex(s => s.id === id);
    if (studentIndex === -1) return res.status(404).json({ error: 'Không tìm thấy học sinh' });

    if (level) db.students[studentIndex].level = level;
    if (classId !== undefined) db.students[studentIndex].classId = classId;

    if (name) {
      const user = db.getUserById(db.students[studentIndex].userId);
      if (user) user.name = name;
    }

    return res.json({ success: true, student: db.students[studentIndex] });
  });

  app.delete('/api/student/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền xóa tài khoản học sinh' });
    }

    const { id } = req.params;
    const student = db.students.find(s => s.id === id);
    if (student) {
      db.users = db.users.filter(u => u.id !== student.userId);
      db.students = db.students.filter(s => s.id !== id);
    }
    return res.json({ success: true, message: 'Đã xóa học sinh thành công' });
  });

  // 8. Progress API
  app.get('/api/progress', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    const role = req.user?.role;
    const studentId = req.user?.studentId;

    if (role === 'student' && studentId) {
      const list = db.progress.filter(p => p.studentId === studentId).map(p => {
        const lesson = db.lessons.find(l => l.id === p.lessonId);
        return {
          ...p,
          lessonTitle: lesson?.title || 'Bài học',
        };
      });
      return res.json({ progress: list });
    }

    // Teacher or Admin gets all student progress
    const all = db.progress.map(p => {
      const student = db.getStudentById(p.studentId);
      const studentUser = student ? db.getUserById(student.userId) : null;
      const lesson = db.lessons.find(l => l.id === p.lessonId);
      const cls = db.classes.find(c => c.id === student?.classId);
      return {
        ...p,
        studentName: studentUser?.name || 'Học sinh',
        className: cls?.name || 'Chưa phân lớp',
        lessonTitle: lesson?.title || 'Bài học',
        studentLevel: student?.level || 'Khá',
      };
    });

    return res.json({ progress: all });
  });

  app.post('/api/progress', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    const { studentId, lessonId, status, score } = req.body;
    const targetStudentId = studentId || req.user?.studentId;

    if (!targetStudentId || !lessonId) {
      return res.status(400).json({ error: 'Thiếu thông tin học sinh hoặc bài học' });
    }

    const existingIndex = db.progress.findIndex(p => p.studentId === targetStudentId && p.lessonId === lessonId);

    if (existingIndex !== -1) {
      if (status) db.progress[existingIndex].status = status;
      if (score !== undefined) db.progress[existingIndex].score = Number(score);
      return res.json({ progress: db.progress[existingIndex] });
    } else {
      const newProgress: ProgressData = {
        id: 'prg-' + Date.now(),
        studentId: targetStudentId,
        lessonId,
        status: status || 'Đang học',
        score: score !== undefined ? Number(score) : undefined,
      };
      db.progress.push(newProgress);
      return res.json({ progress: newProgress });
    }
  });

  // 9. Evidence Upload & API
  app.get('/api/evidence', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    const role = req.user?.role;
    const studentId = req.user?.studentId;

    if (role === 'student' && studentId) {
      const studentEvidences = db.evidences.filter(e => e.studentId === studentId);
      return res.json({ evidences: studentEvidences });
    }

    // Teacher & Admin see all evidences
    const allEvidences = db.evidences.map(e => {
      const student = db.getStudentById(e.studentId);
      const studentUser = student ? db.getUserById(student.userId) : null;
      const cls = db.classes.find(c => c.id === student?.classId);
      return {
        ...e,
        studentName: studentUser?.name || 'Học sinh',
        className: cls?.name || 'Chưa phân lớp',
      };
    });

    return res.json({ evidences: allEvidences });
  });

  app.post('/api/evidence', authMiddleware, async (req: Request & { user?: TokenPayload }, res: Response) => {
    const { title, fileData, fileName, fileType } = req.body;
    const studentId = req.user?.studentId;

    if (!studentId) {
      return res.status(403).json({ error: 'Chỉ tài khoản học sinh mới có thể tải lên minh chứng' });
    }

    if (!title || !fileData) {
      return res.status(400).json({ error: 'Vui lòng cung cấp tiêu đề và tập tin minh chứng' });
    }

    try {
      const uploadResult = await uploadToCloudinary(fileData, fileName || 'evidence', fileType || 'image/jpeg');

      const newEvidence: EvidenceData = {
        id: 'ev-' + Date.now(),
        studentId,
        title,
        fileUrl: uploadResult.fileUrl,
        fileType: uploadResult.fileType,
        createdAt: new Date().toISOString(),
      };

      db.evidences.push(newEvidence);
      return res.json({ evidence: newEvidence });
    } catch (err: any) {
      return res.status(500).json({ error: 'Tải lên minh chứng thất bại: ' + err.message });
    }
  });

  app.delete('/api/evidence/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    const { id } = req.params;
    db.evidences = db.evidences.filter(e => e.id !== id);
    return res.json({ success: true, message: 'Đã xóa minh chứng' });
  });

  // 10. Class Management API
  app.get('/api/class', (req: Request, res: Response) => {
    return res.json({ classes: db.getClasses() });
  });

  app.post('/api/class', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Không có quyền tạo lớp học' });
    }

    const { name, teacherId } = req.body;
    if (!name) return res.status(400).json({ error: 'Vui lòng nhập tên lớp học' });

    const newClass: ClassData = {
      id: 'cls-' + Date.now(),
      name,
      teacherId,
    };

    db.classes.push(newClass);
    return res.json({ class: newClass });
  });

  app.put('/api/class/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Không có quyền sửa lớp học' });
    }

    const { id } = req.params;
    const { name, teacherId } = req.body;
    const cls = db.classes.find(c => c.id === id);

    if (!cls) return res.status(404).json({ error: 'Không tìm thấy lớp học' });

    if (name) cls.name = name;
    if (teacherId !== undefined) cls.teacherId = teacherId;

    return res.json({ class: cls });
  });

  app.delete('/api/class/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền xóa lớp học' });
    }

    const { id } = req.params;
    db.classes = db.classes.filter(c => c.id !== id);
    return res.json({ success: true, message: 'Đã xóa lớp học' });
  });

  // 11. Teacher Management API
  app.get('/api/teacher', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    const teachers = db.getTeachers().map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      createdAt: t.createdAt,
      classCount: db.classes.filter(c => c.teacherId === t.id).length,
    }));
    return res.json({ teachers });
  });

  app.post('/api/teacher', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền tạo tài khoản Giáo viên' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Điền đầy đủ Tên, Email và Mật khẩu giáo viên' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const newTeacher: UserData = {
      id: 'usr-teacher-' + Date.now(),
      name,
      email,
      password,
      role: 'teacher',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newTeacher);
    return res.json({ teacher: newTeacher });
  });

  app.delete('/api/teacher/:id', authMiddleware, (req: Request & { user?: TokenPayload }, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền xóa giáo viên' });
    }

    const { id } = req.params;
    db.users = db.users.filter(u => u.id !== id);
    // Unassign teacher from classes
    db.classes.forEach(c => {
      if (c.teacherId === id) c.teacherId = undefined;
    });

    return res.json({ success: true, message: 'Đã xóa giáo viên' });
  });

export default app;

// --- STANDALONE SERVER FOR DEV & DOCKER / CLOUD RUN ---
async function startStandaloneServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server LMS running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startStandaloneServer();
}

