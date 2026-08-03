export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  classId?: string;
  level?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  studentCount?: number;
}

export interface StudentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  classId?: string;
  className?: string;
  level: 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu';
  createdAt?: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  classCount?: number;
}

export interface LessonItem {
  id: string;
  title: string;
  content: string;
}

export interface ChatHistoryItem {
  id: string;
  studentId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  studentId: string;
  studentName?: string;
  className?: string;
  title: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface ProgressItem {
  id: string;
  studentId: string;
  studentName?: string;
  className?: string;
  lessonId: string;
  lessonTitle?: string;
  status: 'Chưa học' | 'Đang học' | 'Hoàn thành';
  score?: number;
  studentLevel?: string;
}
