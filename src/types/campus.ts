export type NavTabId =
  | 'home'
  | 'timetable'
  | 'study'
  | 'archive'
  | 'grades'
  | 'campus';

export type Weekday = '월' | '화' | '수' | '목' | '금' | '토';

export type CourseCategory = '전필' | '전선' | '교양';

export type CourseColorKey =
  | 'indigo'
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate';

export interface TimeSlot {
  day: Weekday;
  startHour: number; // e.g., 9.0, 10.5
  endHour: number;   // e.g., 10.5, 12.0
}

export interface WeekProgressItem {
  week: number;
  topic: string;
  completed: boolean;
  studiedAt?: string; // YYYY-MM-DD
  reviewChecks: {
    day1: boolean;
    day3: boolean;
    day7: boolean;
    day14: boolean;
  };
}

export interface ExamChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ExamPrepConfig {
  examType: '중간고사' | '기말고사';
  examDate: string; // YYYY-MM-DD
  scope: string;
  checklist: ExamChecklistItem[];
}

export interface GradeConfig {
  attendanceWeight: number;
  assignmentWeight: number;
  midtermWeight: number;
  finalWeight: number;
  attendanceScore: number; // 0-100
  assignmentScore: number; // 0-100
  midtermScore: number;    // 0-100
  finalScore: number;      // 0-100
}

export interface Course {
  id: string;
  name: string;
  code: string;
  category: CourseCategory;
  credits: number;
  professor: string;
  room: string;
  color: CourseColorKey;
  slots: TimeSlot[];
  weeklyProgress: WeekProgressItem[];
  examPrep: ExamPrepConfig;
  gradeConfig: GradeConfig;
}

export type AcademicEventType =
  | '수강신청'
  | '중간고사'
  | '기말고사'
  | '휴강'
  | '보강'
  | '학사일정';

export interface AcademicEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: AcademicEventType;
  courseId?: string;
  memo: string;
}

export interface FreeSlotRoutine {
  id: string;
  day: Weekday;
  startHour: number;
  endHour: number;
  title: string;
  linkedAssignmentId?: string;
  done: boolean;
}

export type AssignmentStatus = '예정' | '진행중' | '제출완료';
export type PriorityLevel = '높음' | '보통' | '낮음';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string; // ISO string YYYY-MM-DDTHH:mm
  status: AssignmentStatus;
  priority: PriorityLevel;
  remind24h: boolean;
  remind3h: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  done: boolean;
}

export interface MeetingNote {
  id: string;
  date: string;
  title: string;
  summary: string;
  actionItems: string[];
}

export interface TeamProject {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  members: TeamMember[];
  milestones: ProjectMilestone[];
  meetings: MeetingNote[];
}

export interface PomodoroSession {
  id: string;
  courseId: string;
  minutes: number;
  date: string; // YYYY-MM-DD
  completedAt: string;
}

export interface StudyNote {
  id: string;
  courseId: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export type ResourceType = 'PDF' | 'PPT' | '논문/링크' | '기타';

export interface CourseResource {
  id: string;
  courseId: string;
  title: string;
  resourceType: ResourceType;
  url?: string;
  fileName?: string;
  fileSize?: string;
  dataUrl?: string;
  tags: string[];
  createdAt: string;
}

export interface PastSemester {
  id: string;
  term: string;
  majorCredits: number;
  generalCredits: number;
  gpa: number;
  majorGpa: number;
}

export interface GraduationGoal {
  requiredTotalCredits: number;
  requiredMajorCredits: number;
  requiredGeneralCredits: number;
  targetOverallGpa: number;
}

export interface CampusLink {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
}

export interface LibraryRoom {
  id: string;
  name: string;
  totalSeats: number;
  occupiedSeats: number;
  updatedAt: string;
}

export interface CafeteriaMenu {
  id: string;
  hall: string;
  mealType: '중식' | '석식';
  menu: string[];
  price: string;
}

export type ActivityCategory = '장학금' | '비교과' | '대외활동' | '교내공지';

export interface CampusActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  deadline: string;
  organization: string;
  url?: string;
  bookmarked: boolean;
  applied: boolean;
  memo: string;
}

export type PersonalMemoCategory = '동아리' | '아르바이트' | '개인약속';

export interface PersonalMemo {
  id: string;
  category: PersonalMemoCategory;
  title: string;
  date?: string;
  content: string;
  done: boolean;
}

export interface WorkspaceState {
  semesterName: string;
  courses: Course[];
  academicEvents: AcademicEvent[];
  freeSlotRoutines: FreeSlotRoutine[];
  assignments: Assignment[];
  teamProjects: TeamProject[];
  pomodoroSessions: PomodoroSession[];
  notes: StudyNote[];
  resources: CourseResource[];
  pastSemesters: PastSemester[];
  graduationGoal: GraduationGoal;
  campusLinks: CampusLink[];
  libraryRooms: LibraryRoom[];
  cafeteriaMenus: CafeteriaMenu[];
  campusActivities: CampusActivity[];
  personalMemos: PersonalMemo[];
}
