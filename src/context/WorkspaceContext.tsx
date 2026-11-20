import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AcademicEvent,
  Assignment,
  CafeteriaMenu,
  CampusActivity,
  CampusLink,
  Course,
  CourseResource,
  FreeSlotRoutine,
  GraduationGoal,
  LibraryRoom,
  NavTabId,
  PastSemester,
  PersonalMemo,
  StudyNote,
  TeamProject,
  WorkspaceState,
} from '../types/campus';
import { createEmptyWorkspaceState } from '../data/sampleData';
import { formatDateISO, getUrgentAssignments } from '../utils/calculations';

const STORAGE_KEY = 'campusfolio_workspace_v4';

interface PomodoroState {
  courseId: string;
  mode: 'focus' | 'break';
  focusMinutes: number;
  breakMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
}

interface WorkspaceContextValue {
  state: WorkspaceState;
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  focusedCourseId: string | null;
  setFocusedCourseId: (courseId: string | null) => void;
  urgentAssignments: ReturnType<typeof getUrgentAssignments>;
  toast: { id: number; message: string; type: 'info' | 'success' | 'warning' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void;

  // Pomodoro global controls
  pomodoro: PomodoroState;
  setPomodoroCourse: (courseId: string) => void;
  setPomodoroDuration: (focusMins: number, breakMins?: number) => void;
  togglePomodoroRunning: () => void;
  resetPomodoro: () => void;
  switchPomodoroMode: (mode: 'focus' | 'break') => void;
  logPomodoroManual: (courseId: string, minutes: number) => void;

  // Workspace data mutations
  setSemesterName: (name: string) => void;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;

  addAcademicEvent: (ev: AcademicEvent) => void;
  deleteAcademicEvent: (id: string) => void;

  addFreeSlotRoutine: (routine: FreeSlotRoutine) => void;
  toggleFreeSlotRoutine: (id: string) => void;
  deleteFreeSlotRoutine: (id: string) => void;

  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => void;

  addTeamProject: (project: TeamProject) => void;
  updateTeamProject: (project: TeamProject) => void;
  deleteTeamProject: (id: string) => void;

  addNote: (note: StudyNote) => void;
  updateNote: (note: StudyNote) => void;
  deleteNote: (id: string) => void;

  addResource: (resource: CourseResource) => void;
  deleteResource: (id: string) => void;

  addPastSemester: (sem: PastSemester) => void;
  deletePastSemester: (id: string) => void;
  updateGraduationGoal: (goal: GraduationGoal) => void;

  addCampusLink: (link: CampusLink) => void;
  deleteCampusLink: (id: string) => void;
  addLibraryRoom: (room: LibraryRoom) => void;
  updateLibraryRoom: (room: LibraryRoom) => void;
  deleteLibraryRoom: (id: string) => void;
  addCafeteriaMenu: (menu: CafeteriaMenu) => void;
  deleteCafeteriaMenu: (id: string) => void;
  addCampusActivity: (act: CampusActivity) => void;
  updateCampusActivity: (act: CampusActivity) => void;
  deleteCampusActivity: (id: string) => void;
  addPersonalMemo: (memo: PersonalMemo) => void;
  updatePersonalMemo: (memo: PersonalMemo) => void;
  deletePersonalMemo: (id: string) => void;

  // Backup / Reset
  startBlankSemester: () => void;
  importWorkspaceJson: (jsonStr: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function loadInitialState(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (parsed && Array.isArray(parsed.courses)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to empty state
  }
  return createEmptyWorkspaceState();
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WorkspaceState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [focusedCourseId, setFocusedCourseId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning';
  } | null>(null);

  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => ({
    courseId: state.courses[0]?.id ?? '',
    mode: 'focus',
    focusMinutes: 25,
    breakMinutes: 5,
    secondsLeft: 25 * 60,
    isRunning: false,
  }));

  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'warning' = 'success') => {
      const id = Date.now();
      setToast({ id, message, type });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3200);
    },
    []
  );

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues
    }
  }, [state]);

  // Keep valid pomodoro courseId when courses change
  useEffect(() => {
    if (state.courses.length > 0 && !state.courses.some((c) => c.id === pomodoro.courseId)) {
      setPomodoro((p) => ({ ...p, courseId: state.courses[0].id }));
    }
  }, [state.courses, pomodoro.courseId]);

  const pomodoroRef = useRef(pomodoro);
  pomodoroRef.current = pomodoro;

  // Pomodoro tick interval
  useEffect(() => {
    if (!pomodoro.isRunning) return;
    const interval = window.setInterval(() => {
      setPomodoro((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }

        // Timer reached 0
        if (prev.mode === 'focus') {
          const todayStr = formatDateISO(new Date());
          const newSession = {
            id: `ps-${Date.now()}`,
            courseId: prev.courseId,
            minutes: prev.focusMinutes,
            date: todayStr,
            completedAt: new Date().toISOString(),
          };
          setState((s) => ({
            ...s,
            pomodoroSessions: [...s.pomodoroSessions, newSession],
          }));
          showToast(`${prev.focusMinutes}분 집중 학습이 기록되었습니다. 휴식 모드로 전환합니다.`, 'success');
          return {
            ...prev,
            mode: 'break',
            secondsLeft: prev.breakMinutes * 60,
            isRunning: false,
          };
        } else {
          showToast('휴식 시간이 종료되었습니다. 다음 집중 세션을 시작하세요.', 'info');
          return {
            ...prev,
            mode: 'focus',
            secondsLeft: prev.focusMinutes * 60,
            isRunning: false,
          };
        }
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [pomodoro.isRunning, showToast]);

  const urgentAssignments = getUrgentAssignments(state.assignments);

  const setPomodoroCourse = useCallback((courseId: string) => {
    setPomodoro((p) => ({ ...p, courseId }));
  }, []);

  const setPomodoroDuration = useCallback((focusMins: number, breakMins = 5) => {
    setPomodoro((p) => ({
      ...p,
      focusMinutes: focusMins,
      breakMinutes: breakMins,
      secondsLeft: p.mode === 'focus' ? focusMins * 60 : breakMins * 60,
      isRunning: false,
    }));
  }, []);

  const togglePomodoroRunning = useCallback(() => {
    setPomodoro((p) => ({ ...p, isRunning: !p.isRunning }));
  }, []);

  const resetPomodoro = useCallback(() => {
    setPomodoro((p) => ({
      ...p,
      isRunning: false,
      secondsLeft: p.mode === 'focus' ? p.focusMinutes * 60 : p.breakMinutes * 60,
    }));
  }, []);

  const switchPomodoroMode = useCallback((mode: 'focus' | 'break') => {
    setPomodoro((p) => ({
      ...p,
      mode,
      isRunning: false,
      secondsLeft: mode === 'focus' ? p.focusMinutes * 60 : p.breakMinutes * 60,
    }));
  }, []);

  const logPomodoroManual = useCallback(
    (courseId: string, minutes: number) => {
      if (!courseId || minutes <= 0) return;
      const todayStr = formatDateISO(new Date());
      setState((s) => ({
        ...s,
        pomodoroSessions: [
          ...s.pomodoroSessions,
          {
            id: `ps-${Date.now()}`,
            courseId,
            minutes,
            date: todayStr,
            completedAt: new Date().toISOString(),
          },
        ],
      }));
      showToast(`${minutes}분 학습 기록이 추가되었습니다.`, 'success');
    },
    [showToast]
  );

  // Mutations
  const setSemesterName = (semesterName: string) =>
    setState((s) => ({ ...s, semesterName }));

  const addCourse = (course: Course) =>
    setState((s) => ({ ...s, courses: [...s.courses, course] }));

  const updateCourse = (course: Course) =>
    setState((s) => ({
      ...s,
      courses: s.courses.map((c) => (c.id === course.id ? course : c)),
    }));

  const deleteCourse = (courseId: string) =>
    setState((s) => ({
      ...s,
      courses: s.courses.filter((c) => c.id !== courseId),
      assignments: s.assignments.filter((a) => a.courseId !== courseId),
      notes: s.notes.filter((n) => n.courseId !== courseId),
      resources: s.resources.filter((r) => r.courseId !== courseId),
    }));

  const addAcademicEvent = (ev: AcademicEvent) =>
    setState((s) => ({ ...s, academicEvents: [...s.academicEvents, ev] }));

  const deleteAcademicEvent = (id: string) =>
    setState((s) => ({
      ...s,
      academicEvents: s.academicEvents.filter((e) => e.id !== id),
    }));

  const addFreeSlotRoutine = (routine: FreeSlotRoutine) =>
    setState((s) => ({ ...s, freeSlotRoutines: [...s.freeSlotRoutines, routine] }));

  const toggleFreeSlotRoutine = (id: string) =>
    setState((s) => ({
      ...s,
      freeSlotRoutines: s.freeSlotRoutines.map((r) =>
        r.id === id ? { ...r, done: !r.done } : r
      ),
    }));

  const deleteFreeSlotRoutine = (id: string) =>
    setState((s) => ({
      ...s,
      freeSlotRoutines: s.freeSlotRoutines.filter((r) => r.id !== id),
    }));

  const addAssignment = (assignment: Assignment) =>
    setState((s) => ({ ...s, assignments: [assignment, ...s.assignments] }));

  const updateAssignment = (assignment: Assignment) =>
    setState((s) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === assignment.id ? assignment : a)),
    }));

  const deleteAssignment = (id: string) =>
    setState((s) => ({
      ...s,
      assignments: s.assignments.filter((a) => a.id !== id),
    }));

  const addTeamProject = (project: TeamProject) =>
    setState((s) => ({ ...s, teamProjects: [project, ...s.teamProjects] }));

  const updateTeamProject = (project: TeamProject) =>
    setState((s) => ({
      ...s,
      teamProjects: s.teamProjects.map((p) => (p.id === project.id ? project : p)),
    }));

  const deleteTeamProject = (id: string) =>
    setState((s) => ({
      ...s,
      teamProjects: s.teamProjects.filter((p) => p.id !== id),
    }));

  const addNote = (note: StudyNote) =>
    setState((s) => ({ ...s, notes: [note, ...s.notes] }));

  const updateNote = (note: StudyNote) =>
    setState((s) => ({
      ...s,
      notes: s.notes.map((n) => (n.id === note.id ? note : n)),
    }));

  const deleteNote = (id: string) =>
    setState((s) => ({
      ...s,
      notes: s.notes.filter((n) => n.id !== id),
    }));

  const addResource = (resource: CourseResource) =>
    setState((s) => ({ ...s, resources: [resource, ...s.resources] }));

  const deleteResource = (id: string) =>
    setState((s) => ({
      ...s,
      resources: s.resources.filter((r) => r.id !== id),
    }));

  const addPastSemester = (sem: PastSemester) =>
    setState((s) => ({ ...s, pastSemesters: [...s.pastSemesters, sem] }));

  const deletePastSemester = (id: string) =>
    setState((s) => ({
      ...s,
      pastSemesters: s.pastSemesters.filter((p) => p.id !== id),
    }));

  const updateGraduationGoal = (graduationGoal: GraduationGoal) =>
    setState((s) => ({ ...s, graduationGoal }));

  const addCampusLink = (link: CampusLink) =>
    setState((s) => ({ ...s, campusLinks: [...s.campusLinks, link] }));

  const deleteCampusLink = (id: string) =>
    setState((s) => ({
      ...s,
      campusLinks: s.campusLinks.filter((l) => l.id !== id),
    }));

  const addLibraryRoom = (room: LibraryRoom) =>
    setState((s) => ({ ...s, libraryRooms: [...s.libraryRooms, room] }));

  const updateLibraryRoom = (room: LibraryRoom) =>
    setState((s) => ({
      ...s,
      libraryRooms: s.libraryRooms.map((r) => (r.id === room.id ? room : r)),
    }));

  const deleteLibraryRoom = (id: string) =>
    setState((s) => ({
      ...s,
      libraryRooms: s.libraryRooms.filter((r) => r.id !== id),
    }));

  const addCafeteriaMenu = (menu: CafeteriaMenu) =>
    setState((s) => ({ ...s, cafeteriaMenus: [...s.cafeteriaMenus, menu] }));

  const deleteCafeteriaMenu = (id: string) =>
    setState((s) => ({
      ...s,
      cafeteriaMenus: s.cafeteriaMenus.filter((m) => m.id !== id),
    }));

  const addCampusActivity = (act: CampusActivity) =>
    setState((s) => ({ ...s, campusActivities: [act, ...s.campusActivities] }));

  const updateCampusActivity = (act: CampusActivity) =>
    setState((s) => ({
      ...s,
      campusActivities: s.campusActivities.map((a) => (a.id === act.id ? act : a)),
    }));

  const deleteCampusActivity = (id: string) =>
    setState((s) => ({
      ...s,
      campusActivities: s.campusActivities.filter((a) => a.id !== id),
    }));

  const addPersonalMemo = (memo: PersonalMemo) =>
    setState((s) => ({ ...s, personalMemos: [memo, ...s.personalMemos] }));

  const updatePersonalMemo = (memo: PersonalMemo) =>
    setState((s) => ({
      ...s,
      personalMemos: s.personalMemos.map((m) => (m.id === memo.id ? memo : m)),
    }));

  const deletePersonalMemo = (id: string) =>
    setState((s) => ({
      ...s,
      personalMemos: s.personalMemos.filter((m) => m.id !== id),
    }));

  const startBlankSemester = () => {
    const empty = createEmptyWorkspaceState();
    setState(empty);
    showToast('모든 데이터가 초기화되었습니다. 새 데이터를 직접 등록해 보세요.', 'info');
  };

  const importWorkspaceJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as WorkspaceState;
      if (!parsed || !Array.isArray(parsed.courses) || !Array.isArray(parsed.assignments)) {
        showToast('올바른 캠퍼스폴리오 백업 파일 형식이 아닙니다.', 'warning');
        return false;
      }
      setState(parsed);
      showToast('백업 데이터를 성공적으로 복원했습니다.', 'success');
      return true;
    } catch {
      showToast('JSON 파일을 읽는 중 오류가 발생했습니다.', 'warning');
      return false;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        focusedCourseId,
        setFocusedCourseId,
        urgentAssignments,
        toast,
        showToast,
        pomodoro,
        setPomodoroCourse,
        setPomodoroDuration,
        togglePomodoroRunning,
        resetPomodoro,
        switchPomodoroMode,
        logPomodoroManual,
        setSemesterName,
        addCourse,
        updateCourse,
        deleteCourse,
        addAcademicEvent,
        deleteAcademicEvent,
        addFreeSlotRoutine,
        toggleFreeSlotRoutine,
        deleteFreeSlotRoutine,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        addTeamProject,
        updateTeamProject,
        deleteTeamProject,
        addNote,
        updateNote,
        deleteNote,
        addResource,
        deleteResource,
        addPastSemester,
        deletePastSemester,
        updateGraduationGoal,
        addCampusLink,
        deleteCampusLink,
        addLibraryRoom,
        updateLibraryRoom,
        deleteLibraryRoom,
        addCafeteriaMenu,
        deleteCafeteriaMenu,
        addCampusActivity,
        updateCampusActivity,
        deleteCampusActivity,
        addPersonalMemo,
        updatePersonalMemo,
        deletePersonalMemo,
        startBlankSemester,
        importWorkspaceJson,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
