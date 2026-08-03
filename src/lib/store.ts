export interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  createdAt: string;
}

export interface ClassData {
  id: string;
  name: string;
  teacherId?: string;
}

export interface StudentData {
  id: string;
  userId: string;
  classId?: string;
  level: 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu';
}

export interface LessonData {
  id: string;
  title: string;
  content: string;
}

export interface ChatHistoryData {
  id: string;
  studentId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface EvidenceData {
  id: string;
  studentId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface ProgressData {
  id: string;
  studentId: string;
  lessonId: string;
  status: 'Chưa học' | 'Đang học' | 'Hoàn thành';
  score?: number;
}

// Initial Data Seed
export const initialUsers: UserData[] = [
  {
    id: 'usr-admin-1',
    name: 'Quản Trị Viên',
    email: 'admin@lms.edu.vn',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-teacher-1',
    name: 'Thầy Nguyễn Văn Hùng',
    email: 'teacher.hung@lms.edu.vn',
    password: 'teacher123',
    role: 'teacher',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-teacher-2',
    name: 'Cô Lê Thị Lan',
    email: 'teacher.lan@lms.edu.vn',
    password: 'teacher123',
    role: 'teacher',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-student-1',
    name: 'Trần Văn Nam',
    email: 'student.nam@lms.edu.vn',
    password: 'student123',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-student-2',
    name: 'Phạm Minh Hoa',
    email: 'student.hoa@lms.edu.vn',
    password: 'student123',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-student-3',
    name: 'Hoàng Anh Tú',
    email: 'student.tu@lms.edu.vn',
    password: 'student123',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
];

export const initialClasses: ClassData[] = [
  {
    id: 'cls-12a1',
    name: 'Lớp 12A1 - Toán Chuyên',
    teacherId: 'usr-teacher-1',
  },
  {
    id: 'cls-12a2',
    name: 'Lớp 12A2 - Khoa Học Tự Nhiên',
    teacherId: 'usr-teacher-2',
  },
];

export const initialStudents: StudentData[] = [
  {
    id: 'std-1',
    userId: 'usr-student-1',
    classId: 'cls-12a1',
    level: 'Khá',
  },
  {
    id: 'std-2',
    userId: 'usr-student-2',
    classId: 'cls-12a1',
    level: 'Giỏi',
  },
  {
    id: 'std-3',
    userId: 'usr-student-3',
    classId: 'cls-12a2',
    level: 'Trung bình',
  },
];

export const initialLessons: LessonData[] = [
  {
    id: 'lsn-1',
    title: 'Bài 1: Khảo sát và vẽ đồ thị hàm số bậc ba',
    content: `I. MỤC TIÊU BÀI HỌC
1. Khái niệm tập xác định và đạo hàm y' = 3ax² + 2bx + c.
2. Phương pháp tìm cực trị và điểm uốn của đồ thị hàm số bậc 3: y = ax³ + bx² + cx + d (a ≠ 0).
3. Bảng biến thiên và các dạng đồ thị phụ thuộc vào dấu của a và số nghiệm của y' = 0.

II. TÓM TẮT LÝ THUYẾT VÀ CÔNG THỨC
- Tập xác định: D = R.
- Đạo hàm: y' = 3ax² + 2bx + c.
- Phương trình y' = 0 có biệt thức Δ' = b² - 3ac.
  + Nếu Δ' > 0: Hàm số có 2 điểm cực trị.
  + Nếu Δ' ≤ 0: Hàm số không có cực trị (đơn điệu trên R).
- Điểm uốn U(x₀, y₀) thỏa mãn y'' = 6ax + 2b = 0 => x₀ = -b / (3a).

III. CÂU HỎI THẢO LUẬN
- Hãy nêu cách xác định tọa độ điểm uốn của đồ thị hàm số bậc 3?
- Khi nào hàm số bậc 3 đồng biến trên toàn bộ tập số thực R?`,
  },
  {
    id: 'lsn-2',
    title: 'Bài 2: Phương trình bậc hai và Biệt thức Delta',
    content: `I. TÓM TẮT LÝ THUYẾT
Phương trình bậc hai một ẩn có dạng: ax² + bx + c = 0 (a ≠ 0).

II. CÔNG THỨC CỐT LÕI
Biệt thức Δ = b² - 4ac (hoặc Δ' = b'² - ac với b = 2b').
- Trường hợp 1: Δ > 0 => Phương trình có 2 nghiệm phân biệt:
  x₁ = (-b + √Δ) / (2a)
  x₂ = (-b - √Δ) / (2a)
- Trường hợp 2: Δ = 0 => Phương trình có nghiệm kép: x₁ = x₂ = -b / (2a).
- Trường hợp 3: Δ < 0 => Phương trình vô nghiệm trên tập số thực R.

III. ĐỊNH LÝ VI-ÉT
Nếu x₁, x₂ là nghiệm của phương trình thì:
  S = x₁ + x₂ = -b / a
  P = x₁ × x₂ = c / a`,
  },
  {
    id: 'lsn-3',
    title: 'Bài 3: Tính diện tích và chu vi các hình phẳng cơ bản',
    content: `I. MỤC TIÊU BÀI HỌC
Ôn tập các công thức hình học phẳng cơ bản dành cho bài toán ứng dụng thực tế.

II. CÔNG THỨC CẦN NHỚ
1. Hình Tam Giác:
   - Diện tích S = (1/2) × a × h
   - Công thức Heron: S = √(p(p-a)(p-b)(p-c)) với p = (a + b + c)/2
2. Hình Chữ Nhật & Hình Vuông:
   - S_chữ_nhật = a × b, Chu vi P = 2 × (a + b)
   - S_vuông = a², Chu vi P = 4 × a
3. Hình Tròn:
   - S = π × r² (với π ≈ 3.14159)
   - Chu vi C = 2 × π × r`,
  },
];

export const initialChatHistory: ChatHistoryData[] = [
  {
    id: 'chat-1',
    studentId: 'std-1',
    question: 'Làm sao để tìm nghiệm phương trình 2x² - 5x + 2 = 0?',
    answer: `Để giải phương trình bậc hai này, chúng ta cùng làm theo từng bước:

Bước 1: Em hãy xác định các hệ số a, b, c.
Trong bài này: a = 2, b = -5, c = 2.

Bước 2: Em hãy tính biệt thức Δ = b² - 4ac.
Gợi ý: Δ = (-5)² - 4 × 2 × 2 = ?

Em hãy tính thử Δ ra bao nhiêu và cho thầy/cô biết kết quả nhé?`,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export const initialEvidences: EvidenceData[] = [
  {
    id: 'ev-1',
    studentId: 'std-1',
    title: 'Bài tập giải phương trình bậc hai - Lớp 12A1',
    fileUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    fileType: 'Hình ảnh bài làm',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ev-2',
    studentId: 'std-2',
    title: 'Bản vẽ đồ thị điểm uốn hàm bậc ba',
    fileUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
    fileType: 'Hình ảnh đồ thị',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const initialProgress: ProgressData[] = [
  {
    id: 'prg-1',
    studentId: 'std-1',
    lessonId: 'lsn-1',
    status: 'Đang học',
    score: 7.5,
  },
  {
    id: 'prg-2',
    studentId: 'std-1',
    lessonId: 'lsn-2',
    status: 'Hoàn thành',
    score: 9.0,
  },
  {
    id: 'prg-3',
    studentId: 'std-2',
    lessonId: 'lsn-1',
    status: 'Hoàn thành',
    score: 10.0,
  },
  {
    id: 'prg-4',
    studentId: 'std-3',
    lessonId: 'lsn-2',
    status: 'Chưa học',
  },
];

// Persistent Memory Store class
class MemoryDatabase {
  users: UserData[] = [...initialUsers];
  classes: ClassData[] = [...initialClasses];
  students: StudentData[] = [...initialStudents];
  lessons: LessonData[] = [...initialLessons];
  chatHistory: ChatHistoryData[] = [...initialChatHistory];
  evidences: EvidenceData[] = [...initialEvidences];
  progress: ProgressData[] = [...initialProgress];

  // User methods
  getUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  getStudentByUserId(userId: string) {
    return this.students.find(s => s.userId === userId);
  }

  getStudentById(id: string) {
    return this.students.find(s => s.id === id);
  }

  // Role lists
  getTeachers() {
    return this.users.filter(u => u.role === 'teacher');
  }

  getAllStudentsWithDetails() {
    return this.students.map(s => {
      const u = this.getUserById(s.userId);
      const c = this.classes.find(cls => cls.id === s.classId);
      return {
        id: s.id,
        userId: s.userId,
        name: u?.name || 'Không xác định',
        email: u?.email || '',
        classId: s.classId,
        className: c?.name || 'Chưa phân lớp',
        level: s.level,
        createdAt: u?.createdAt || '',
      };
    });
  }

  getLessons() {
    return this.lessons;
  }

  getClasses() {
    return this.classes.map(c => {
      const t = this.getUserById(c.teacherId || '');
      const studentCount = this.students.filter(s => s.classId === c.id).length;
      return {
        ...c,
        teacherName: t?.name || 'Chưa phân công',
        studentCount,
      };
    });
  }
}

export const db = new MemoryDatabase();
