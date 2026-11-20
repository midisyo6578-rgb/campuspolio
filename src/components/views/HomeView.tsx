import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AssignmentStatus, Weekday } from '../../types/campus';
import {
  COURSE_COLORS,
  WEEKDAYS,
  addDaysISO,
  calculateSemesterGpaSummary,
  detectFreeGapsForDay,
  formatDateISO,
  formatTimeRange,
  getDeadlineInfo,
  getTodayWeekday,
} from '../../utils/calculations';

export const HomeView: React.FC = () => {
  const {
    state,
    setActiveTab,
    setFocusedCourseId,
    urgentAssignments,
    updateAssignment,
    toggleFreeSlotRoutine,
    updateCourse,
    pomodoro,
    setPomodoroCourse,
    setPomodoroDuration,
    togglePomodoroRunning,
    resetPomodoro,
    switchPomodoroMode,
    logPomodoroManual,
  } = useWorkspace();

  const [selectedDay, setSelectedDay] = useState<Weekday>(() => getTodayWeekday());

  const now = new Date();
  const todayStr = formatDateISO(now);
  const koreanDate = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const dayClasses = useMemo(() => {
    const items: {
      courseId: string;
      name: string;
      code: string;
      room: string;
      professor: string;
      category: string;
      color: keyof typeof COURSE_COLORS;
      startHour: number;
      endHour: number;
    }[] = [];
    for (const c of state.courses) {
      for (const s of c.slots) {
        if (s.day === selectedDay) {
          items.push({
            courseId: c.id,
            name: c.name,
            code: c.code,
            room: c.room,
            professor: c.professor,
            category: c.category,
            color: c.color,
            startHour: s.startHour,
            endHour: s.endHour,
          });
        }
      }
    }
    return items.sort((a, b) => a.startHour - b.startHour);
  }, [state.courses, selectedDay]);

  const dayGaps = useMemo(
    () => detectFreeGapsForDay(state.courses, selectedDay),
    [state.courses, selectedDay]
  );

  const dayRoutines = state.freeSlotRoutines.filter((r) => r.day === selectedDay);

  const todayStudyMinutes = state.pomodoroSessions
    .filter((s) => s.date === todayStr)
    .reduce((acc, s) => acc + s.minutes, 0);

  const gpaSummary = useMemo(
    () => calculateSemesterGpaSummary(state.courses, state.pastSemesters),
    [state.courses, state.pastSemesters]
  );

  const upcomingAssignments = useMemo(() => {
    return state.assignments
      .filter((a) => a.status !== '제출완료')
      .map((a) => ({ assignment: a, info: getDeadlineInfo(a.dueDate, now) }))
      .sort((a, b) => a.info.diffMs - b.info.diffMs)
      .slice(0, 5);
  }, [state.assignments]);

  const dueReviews = useMemo(() => {
    const list: {
      courseId: string;
      courseName: string;
      week: number;
      topic: string;
      cycleKey: 'day1' | 'day3' | 'day7' | 'day14';
      cycleLabel: string;
      targetDate: string;
    }[] = [];

    for (const c of state.courses) {
      for (const w of c.weeklyProgress) {
        if (!w.completed || !w.studiedAt) continue;
        const cycles: {
          key: 'day1' | 'day3' | 'day7' | 'day14';
          days: number;
          label: string;
        }[] = [
          { key: 'day1', days: 1, label: '1일차 복습' },
          { key: 'day3', days: 3, label: '3일차 복습' },
          { key: 'day7', days: 7, label: '7일차 복습' },
          { key: 'day14', days: 14, label: '14일차 복습' },
        ];
        for (const cy of cycles) {
          if (!w.reviewChecks[cy.key]) {
            const targetDate = addDaysISO(w.studiedAt, cy.days);
            if (targetDate <= addDaysISO(todayStr, 2)) {
              list.push({
                courseId: c.id,
                courseName: c.name,
                week: w.week,
                topic: w.topic,
                cycleKey: cy.key,
                cycleLabel: cy.label,
                targetDate,
              });
              break;
            }
          }
        }
      }
    }
    return list.slice(0, 5);
  }, [state.courses, todayStr]);

  const cycleAssignmentStatus = (id: string, current: AssignmentStatus) => {
    const target = state.assignments.find((a) => a.id === id);
    if (!target) return;
    const next: AssignmentStatus =
      current === '예정' ? '진행중' : current === '진행중' ? '제출완료' : '예정';
    updateAssignment({ ...target, status: next });
  };

  const handleCheckReview = (
    courseId: string,
    weekNum: number,
    cycleKey: 'day1' | 'day3' | 'day7' | 'day14'
  ) => {
    const course = state.courses.find((c) => c.id === courseId);
    if (!course) return;
    updateCourse({
      ...course,
      weeklyProgress: course.weeklyProgress.map((w) =>
        w.week === weekNum
          ? { ...w, reviewChecks: { ...w.reviewChecks, [cycleKey]: true } }
          : w
      ),
    });
  };

  const mins = String(Math.floor(pomodoro.secondsLeft / 60)).padStart(2, '0');
  const secs = String(pomodoro.secondsLeft % 60).padStart(2, '0');
  const totalSec =
    (pomodoro.mode === 'focus' ? pomodoro.focusMinutes : pomodoro.breakMinutes) * 60;
  const progressPct = totalSec > 0 ? ((totalSec - pomodoro.secondsLeft) / totalSec) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header & 4 Individual KPI Cards */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <p className="text-xs font-medium text-emerald-800/80 mb-1">
              휴먼서비스대학 · 치매재활학과 1학년 2학기 · {koreanDate}
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              오늘의 학업 브리핑
            </h2>
          </div>
          <p className="text-xs text-emerald-900/70">
            수업 · 과제 · 복습 · 집중 타이머를 카드별로 한눈에 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
            <div className="text-xs text-slate-500 mb-1.5">{selectedDay}요일 강의</div>
            <div className="font-mono-tabular text-2xl font-bold text-slate-900">
              {dayClasses.length}
              <span className="text-sm font-normal text-slate-500 ml-1">개</span>
            </div>
            <div className="text-xs text-emerald-700 mt-1.5">
              공강 블록 {dayGaps.length}구간
            </div>
          </div>

          <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
            <div className="text-xs text-slate-500 mb-1.5">24시간 이내 마감</div>
            <div
              className={`font-mono-tabular text-2xl font-bold ${
                urgentAssignments.length > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {urgentAssignments.length}
              <span className="text-sm font-normal text-slate-500 ml-1">건</span>
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              전체 미제출 {state.assignments.filter((a) => a.status !== '제출완료').length}건
            </div>
          </div>

          <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
            <div className="text-xs text-slate-500 mb-1.5">오늘 순수 공부 시간</div>
            <div className="font-mono-tabular text-2xl font-bold text-emerald-700">
              {todayStudyMinutes}
              <span className="text-sm font-normal text-slate-500 ml-1">분</span>
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              누적 세션 {state.pomodoroSessions.length}회
            </div>
          </div>

          <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
            <div className="text-xs text-slate-500 mb-1.5">이번 학기 예상 평점</div>
            <div className="font-mono-tabular text-2xl font-bold text-slate-900">
              {gpaSummary.currentProjectedGpa.toFixed(2)}
              <span className="text-sm font-normal text-slate-400 ml-1">/ 4.50</span>
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              누적 {gpaSummary.combinedOverallGpa.toFixed(2)} ({gpaSummary.combinedTotalCredits}학점)
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Card Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Timetable Card Group */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  오늘의 시간표 및 공강 루틴
                </h3>
                <div className="flex items-center gap-0.5 p-0.5 bg-white/80 border border-emerald-200/80 rounded-xl">
                  {WEEKDAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        selectedDay === d
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('timetable')}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap"
              >
                <span>전체 시간표</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dayClasses.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm py-10 px-5 text-center">
                <p className="text-sm text-slate-500 mb-3">
                  {selectedDay}요일에 등록된 수업이 없습니다.
                </p>
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                >
                  시간표에 강의 추가하기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {dayClasses.map((cls) => {
                  const colorToken = COURSE_COLORS[cls.color];
                  return (
                    <div
                      key={`${cls.courseId}-${cls.startHour}`}
                      className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${colorToken.dot}`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {cls.name}
                            </span>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {cls.category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            <span className="font-mono-tabular font-medium text-slate-700">
                              {formatTimeRange(cls.startHour, cls.endHour)}
                            </span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span>{cls.room}</span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span>{cls.professor}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFocusedCourseId(cls.courseId);
                          setActiveTab('archive');
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl hover:bg-emerald-100 whitespace-nowrap shrink-0"
                      >
                        자료실 열기
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detected Free Gaps & Routines Cards */}
            {(dayGaps.length > 0 || dayRoutines.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {dayGaps.map((gap, i) => (
                  <div
                    key={i}
                    className="bg-white/90 border border-dashed border-emerald-300 rounded-2xl p-4 flex flex-col justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-mono-tabular font-semibold text-emerald-800">
                        {formatTimeRange(gap.startHour, gap.endHour)} ({gap.durationHours}h 공강)
                      </div>
                      <div className="text-slate-700 mt-1">{gap.suggestion}</div>
                    </div>
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className="text-left text-emerald-700 hover:text-emerald-900 font-semibold whitespace-nowrap"
                    >
                      루틴 설정 →
                    </button>
                  </div>
                ))}
                {dayRoutines.map((r) => (
                  <label
                    key={r.id}
                    className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 flex items-start gap-2.5 text-xs cursor-pointer hover:border-emerald-300"
                  >
                    <input
                      type="checkbox"
                      checked={r.done}
                      onChange={() => toggleFreeSlotRoutine(r.id)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-mono-tabular text-slate-500">
                        {formatTimeRange(r.startHour, r.endHour)}
                      </div>
                      <div
                        className={`mt-0.5 font-medium ${
                          r.done ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {r.title}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Urgent Assignments Card Stack */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                마감 임박 과제 및 프로젝트
              </h3>
              <button
                onClick={() => setActiveTab('study')}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap"
              >
                <span>과제 보드</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingAssignments.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm px-5 py-8 text-center text-xs text-slate-500">
                남아있는 미제출 과제가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {upcomingAssignments.map(({ assignment, info }) => {
                  const course = state.courses.find((c) => c.id === assignment.courseId);
                  const isUrgent =
                    info.urgency === 'overdue' ||
                    info.urgency === 'critical3h' ||
                    info.urgency === 'soon24h';
                  return (
                    <div
                      key={assignment.id}
                      className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-slate-700 truncate">
                            {course?.name || '미지정 과목'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-mono-tabular font-semibold inline-flex items-center gap-1 ${
                              info.urgency === 'overdue' || info.urgency === 'critical3h'
                                ? 'text-red-600'
                                : info.urgency === 'soon24h'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {isUrgent && <AlertTriangle className="w-3 h-3" />}
                            {info.dDayLabel} ({info.timeRemainingLabel})
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {assignment.title}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          cycleAssignmentStatus(assignment.id, assignment.status)
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
                          assignment.status === '진행중'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title="클릭하여 상태 변경"
                      >
                        {assignment.status}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right 5 Cols: Pomodoro Card, Ebbinghaus Cards, Campus Quick Link Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pomodoro Focus Timer Card */}
          <section className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  학습 타이머 (뽀모도로)
                </h3>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-emerald-50 border border-emerald-200/70 rounded-xl">
                <button
                  onClick={() => switchPomodoroMode('focus')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    pomodoro.mode === 'focus'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  집중
                </button>
                <button
                  onClick={() => switchPomodoroMode('break')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    pomodoro.mode === 'break'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  휴식
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">측정 과목</label>
              <select
                value={pomodoro.courseId}
                onChange={(e) => setPomodoroCourse(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600"
              >
                {state.courses.length === 0 && <option value="">과목을 먼저 추가하세요</option>}
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="py-5 text-center bg-[#F3FAF6] border border-emerald-200/70 rounded-xl">
              <div className="font-mono-tabular text-4xl font-semibold tracking-tight text-slate-900">
                {mins}:{secs}
              </div>
              <div className="mt-3 mx-6 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={togglePomodoroRunning}
                  disabled={!pomodoro.courseId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 disabled:opacity-50"
                >
                  {pomodoro.isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>일시정지</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>타이머 시작</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetPomodoro}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>초기화</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">세션 길이:</span>
                {[25, 50].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPomodoroDuration(m, m === 50 ? 10 : 5)}
                    className={`px-2.5 py-1 rounded-lg border font-mono-tabular ${
                      pomodoro.focusMinutes === m
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}분
                  </button>
                ))}
              </div>
              <button
                onClick={() => logPomodoroManual(pomodoro.courseId, 25)}
                disabled={!pomodoro.courseId}
                className="text-emerald-700 hover:text-emerald-900 font-semibold whitespace-nowrap disabled:opacity-40"
              >
                +25분 직접 기록
              </button>
            </div>
          </section>

          {/* Ebbinghaus Review Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  에빙하우스 복습 권장 알림
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('study')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
              >
                전체 진도표
              </button>
            </div>
            {dueReviews.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm px-5 py-6 text-center text-xs text-slate-500">
                오늘 예정된 망각곡선 복습 항목을 모두 완료했습니다.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dueReviews.map((rev) => (
                  <div
                    key={`${rev.courseId}-${rev.week}-${rev.cycleKey}`}
                    className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">
                        <span>{rev.courseName}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="font-semibold text-emerald-700">{rev.cycleLabel}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                        {rev.week}주차: {rev.topic}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleCheckReview(rev.courseId, rev.week, rev.cycleKey)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 shrink-0"
                    >
                      <Check className="w-3 h-3" />
                      <span>복습 완료</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Campus Quick Link Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                캠퍼스 Quick 링크
              </h3>
              <button
                onClick={() => setActiveTab('campus')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
              >
                학교생활 허브
              </button>
            </div>
            {state.campusLinks.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5 text-center text-xs text-slate-500">
                등록된 바로가기 링크가 없습니다. 학교생활 허브에서 자주 쓰는 사이트를 등록해 보세요.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {state.campusLinks.slice(0, 4).map((lk) => (
                  <a
                    key={lk.id}
                    href={lk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-3.5 flex items-center justify-between gap-2 hover:border-emerald-400 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {lk.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {lk.category}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Enrolled Course Cards Overview */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              휴먼서비스대학 치매재활학과 1학년 2학기 수강과목
            </h3>
            <p className="text-xs text-emerald-800/75 mt-0.5 font-mono-tabular">
              {state.semesterName} · 총 {state.courses.length}과목 ·{' '}
              {state.courses.reduce((sum, c) => sum + c.credits, 0)}학점
            </p>
          </div>
          <button
            onClick={() => setActiveTab('timetable')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
          >
            <span>시간표 · 과목 카드 전체</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.courses.length === 0 ? (
          <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-8 text-center space-y-3">
            <p className="text-sm text-slate-500">
              아직 직접 등록한 수강과목이 없습니다. 시간표 화면에서 수강과목을 추가하면 카드가 표시됩니다.
            </p>
            <button
              onClick={() => setActiveTab('timetable')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 shadow-xs"
            >
              <span>수강과목 직접 등록하기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.courses.map((course) => {
              const token = COURSE_COLORS[course.color];
              const completedWeeks = course.weeklyProgress.filter((w) => w.completed).length;
              const totalWeeks = Math.max(1, course.weeklyProgress.length);
              return (
                <div
                  key={course.id}
                  className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className={`px-4 py-3 ${token.bg} border-b ${token.border}`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 font-mono-tabular font-semibold text-slate-600">
                        <span className={`w-2 h-2 rounded-full ${token.dot}`} />
                        <span>{course.code}</span>
                      </span>
                      <span className={`font-semibold ${token.text}`}>
                        {course.category} · {course.credits}학점
                      </span>
                    </div>
                    <div className={`font-display text-sm font-bold mt-1 ${token.text}`}>
                      {course.name}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800 truncate">{course.professor}</span>
                      <span className="text-slate-500 truncate">{course.room}</span>
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-500 truncate">
                      {course.slots.length > 0
                        ? course.slots
                            .map((s) => `${s.day} ${formatTimeRange(s.startHour, s.endHour)}`)
                            .join(' · ')
                        : '시간 미지정'}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-mono-tabular text-emerald-700 font-semibold">
                        진도 {completedWeeks}/{totalWeeks}주
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setFocusedCourseId(course.id);
                            setActiveTab('archive');
                          }}
                          className="font-medium text-slate-600 hover:text-emerald-800"
                        >
                          자료실
                        </button>
                        <button
                          onClick={() => {
                            setFocusedCourseId(course.id);
                            setActiveTab('study');
                          }}
                          className="font-semibold text-emerald-700 hover:text-emerald-900"
                        >
                          진도·과제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
