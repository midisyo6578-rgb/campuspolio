import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Edit3,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  AcademicEventType,
  Course,
  CourseCategory,
  CourseColorKey,
  TimeSlot,
  Weekday,
} from '../../types/campus';
import {
  COURSE_COLORS,
  WEEKDAYS,
  addDaysISO,
  detectFreeGapsForDay,
  formatDateISO,
  formatHour,
  formatTimeRange,
  getDeadlineInfo,
  getTodayWeekday,
} from '../../utils/calculations';
import { WeeklyScheduleCalendar } from '../timetable/WeeklyScheduleCalendar';
import { EnrolledCourseCards } from '../timetable/EnrolledCourseCards';

export const TimetableView: React.FC = () => {
  const {
    state,
    addCourse,
    updateCourse,
    deleteCourse,
    addAcademicEvent,
    deleteAcademicEvent,
    addFreeSlotRoutine,
    toggleFreeSlotRoutine,
    deleteFreeSlotRoutine,
    setActiveTab,
    setFocusedCourseId,
    showToast,
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<'weekly' | 'courses' | 'daily' | 'academic'>('weekly');
  const [includeSaturday, setIncludeSaturday] = useState(false);
  const [dailyDay, setDailyDay] = useState<Weekday>(() => getTodayWeekday());

  // Course Editor Modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [cName, setCName] = useState('');
  const [cCode, setCCode] = useState('');
  const [cCategory, setCCategory] = useState<CourseCategory>('전필');
  const [cCredits, setCCredits] = useState(3);
  const [cProf, setCProf] = useState('');
  const [cRoom, setCRoom] = useState('');
  const [cColor, setCColor] = useState<CourseColorKey>('indigo');
  const [cSlots, setCSlots] = useState<TimeSlot[]>([{ day: '월', startHour: 9, endHour: 10.5 }]);

  // Course Detail Modal
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);

  // Gap Routine Modal
  const [gapTarget, setGapTarget] = useState<{
    day: Weekday;
    startHour: number;
    endHour: number;
  } | null>(null);
  const [gapTitle, setGapTitle] = useState('');

  // Academic Event Filter & Form
  const [eventFilter, setEventFilter] = useState<'전체' | AcademicEventType>('전체');
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState(() => addDaysISO(formatDateISO(new Date()), 2));
  const [evType, setEvType] = useState<AcademicEventType>('학사일정');
  const [evCourseId, setEvCourseId] = useState('');
  const [evMemo, setEvMemo] = useState('');

  const displayDays: Weekday[] = includeSaturday ? [...WEEKDAYS, '토'] : WEEKDAYS;

  const weeklyGaps = useMemo(() => {
    const map: Record<Weekday, ReturnType<typeof detectFreeGapsForDay>> = {
      월: [],
      화: [],
      수: [],
      목: [],
      금: [],
      토: [],
    };
    for (const d of displayDays) {
      map[d] = detectFreeGapsForDay(state.courses, d);
    }
    return map;
  }, [state.courses, displayDays]);

  const openCreateCourse = () => {
    setEditingCourse(null);
    setCName('');
    setCCode('');
    setCCategory('전필');
    setCCredits(3);
    setCProf('');
    setCRoom('');
    setCColor('indigo');
    setCSlots([{ day: '월', startHour: 9, endHour: 10.5 }]);
    setCourseModalOpen(true);
  };

  const openEditCourse = (c: Course) => {
    setEditingCourse(c);
    setCName(c.name);
    setCCode(c.code);
    setCCategory(c.category);
    setCCredits(c.credits);
    setCProf(c.professor);
    setCRoom(c.room);
    setCColor(c.color);
    setCSlots(c.slots.length > 0 ? c.slots : [{ day: '월', startHour: 9, endHour: 10.5 }]);
    setDetailCourse(null);
    setCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;
    const validSlots = cSlots.filter((s) => s.endHour > s.startHour);
    if (editingCourse) {
      updateCourse({
        ...editingCourse,
        name: cName.trim(),
        code: cCode.trim() || 'COURSE',
        category: cCategory,
        credits: cCredits,
        professor: cProf.trim() || '미정',
        room: cRoom.trim() || '미정',
        color: cColor,
        slots: validSlots,
      });
      showToast('강의 정보가 수정되었습니다.', 'success');
    } else {
      const todayStr = formatDateISO(new Date());
      const newCourse: Course = {
        id: `c-${Date.now()}`,
        name: cName.trim(),
        code: cCode.trim() || `DR${Math.floor(100 + Math.random() * 200)}`,
        category: cCategory,
        credits: cCredits,
        professor: cProf.trim() || '미정',
        room: cRoom.trim() || '미정',
        color: cColor,
        slots: validSlots,
        weeklyProgress: Array.from({ length: 16 }, (_, i) => ({
          week: i + 1,
          topic: `${i + 1}주차 강의 내용`,
          completed: false,
          reviewChecks: { day1: false, day3: false, day7: false, day14: false },
        })),
        examPrep: {
          examType: '기말고사',
          examDate: addDaysISO(todayStr, 21),
          scope: '',
          checklist: [],
        },
        gradeConfig: {
          attendanceWeight: 10,
          assignmentWeight: 20,
          midtermWeight: 35,
          finalWeight: 35,
          attendanceScore: 100,
          assignmentScore: 90,
          midtermScore: 88,
          finalScore: 90,
        },
      };
      addCourse(newCourse);
      showToast('새 강의가 시간표에 추가되었습니다.', 'success');
    }
    setCourseModalOpen(false);
  };

  const handleSaveGapRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gapTarget || !gapTitle.trim()) return;
    addFreeSlotRoutine({
      id: `fr-${Date.now()}`,
      day: gapTarget.day,
      startHour: gapTarget.startHour,
      endHour: gapTarget.endHour,
      title: gapTitle.trim(),
      done: false,
    });
    showToast('공강 학습 루틴이 등록되었습니다.', 'success');
    setGapTitle('');
    setGapTarget(null);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    addAcademicEvent({
      id: `ev-${Date.now()}`,
      title: evTitle.trim(),
      date: evDate,
      type: evType,
      courseId: evCourseId || undefined,
      memo: evMemo.trim(),
    });
    showToast('학사 일정이 등록되었습니다.', 'success');
    setEvTitle('');
    setEvMemo('');
  };

  const filteredEvents = useMemo(() => {
    return state.academicEvents
      .filter((e) => eventFilter === '전체' || e.type === eventFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.academicEvents, eventFilter]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-emerald-200/80 rounded-xl shadow-xs">
            {[
              { id: 'weekly' as const, label: '주간 시간표' },
              { id: 'courses' as const, label: '수강과목 카드' },
              { id: 'daily' as const, label: '일간 보기' },
              { id: 'academic' as const, label: '학사 일정 · 공강' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  viewMode === tab.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {viewMode === 'weekly' && (
            <label className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200/80 rounded-xl text-xs text-slate-700 cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={includeSaturday}
                onChange={(e) => setIncludeSaturday(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>토요일 포함</span>
            </label>
          )}
        </div>

        <button
          onClick={openCreateCourse}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl shadow-xs hover:bg-emerald-800 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>강의 추가</span>
        </button>
      </div>

      {/* Weekly Schedule Calendar + Enrolled Course Cards */}
      {viewMode === 'weekly' && (
        <div className="space-y-6">
          <WeeklyScheduleCalendar
            courses={state.courses}
            academicEvents={state.academicEvents}
            assignments={state.assignments}
            freeSlotRoutines={state.freeSlotRoutines}
            weeklyGaps={weeklyGaps}
            includeSaturday={includeSaturday}
            onSelectCourse={(course) => setDetailCourse(course)}
            onSelectGap={(gap) => {
              setGapTarget({
                day: gap.day,
                startHour: gap.startHour,
                endHour: gap.endHour,
              });
              setGapTitle(gap.suggestion);
            }}
            onToggleRoutine={(routineId) => toggleFreeSlotRoutine(routineId)}
          />

          <EnrolledCourseCards
            semesterName={state.semesterName}
            courses={state.courses}
            assignments={state.assignments}
            notes={state.notes}
            resources={state.resources}
            onSelectCourse={(course) => setDetailCourse(course)}
            onCreateCourse={openCreateCourse}
            onOpenArchive={(courseId) => {
              setFocusedCourseId(courseId);
              setActiveTab('archive');
            }}
            onOpenStudy={(courseId) => {
              setFocusedCourseId(courseId);
              setActiveTab('study');
            }}
          />
        </div>
      )}

      {/* Enrolled Course Cards Dedicated View */}
      {viewMode === 'courses' && (
        <EnrolledCourseCards
          semesterName={state.semesterName}
          courses={state.courses}
          assignments={state.assignments}
          notes={state.notes}
          resources={state.resources}
          onSelectCourse={(course) => setDetailCourse(course)}
          onCreateCourse={openCreateCourse}
          onOpenArchive={(courseId) => {
            setFocusedCourseId(courseId);
            setActiveTab('archive');
          }}
          onOpenStudy={(courseId) => {
            setFocusedCourseId(courseId);
            setActiveTab('study');
          }}
        />
      )}

      {/* Daily Timetable View */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-emerald-200/80 rounded-xl shadow-xs w-fit">
            {displayDays.map((d) => (
              <button
                key={d}
                onClick={() => setDailyDay(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  dailyDay === d
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}요일
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.courses
              .flatMap((c) =>
                c.slots.filter((s) => s.day === dailyDay).map((s) => ({ course: c, slot: s }))
              )
              .sort((a, b) => a.slot.startHour - b.slot.startHour)
              .map(({ course, slot }) => {
                const token = COURSE_COLORS[course.color];
                return (
                  <div
                    key={`${course.id}-${slot.startHour}`}
                    className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5 flex flex-col justify-between gap-4 hover:border-emerald-300"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${token.dot}`} />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {course.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {course.code} · {course.category} · {course.credits}학점
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                          <span className="font-mono-tabular font-semibold text-emerald-800">
                            {formatTimeRange(slot.startHour, slot.endHour)}
                          </span>
                          <span className="mx-2 text-slate-300">·</span>
                          <span>{course.room}</span>
                          <span className="mx-2 text-slate-300">·</span>
                          <span>{course.professor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDetailCourse(course)}
                        className="px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                      >
                        상세 · 수정
                      </button>
                    </div>
                  </div>
                );
              })}

            {state.courses.every((c) => c.slots.every((s) => s.day !== dailyDay)) && (
              <div className="md:col-span-2 bg-white border border-emerald-200/80 rounded-2xl shadow-sm py-12 text-center text-sm text-slate-500">
                {dailyDay}요일에 배정된 강의가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Academic Events & Free Gap Management */}
      {viewMode === 'academic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Academic Calendar Events */}
          <section className="lg:col-span-7 bg-white border border-emerald-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  학사 일정 (수강신청 · 시험 · 휴강 · 보강)
                </h3>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {(['전체', '수강신청', '중간고사', '기말고사', '휴강', '보강'] as const).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setEventFilter(f)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-lg ${
                        eventFilter === f
                          ? 'bg-emerald-700 text-white'
                          : 'text-slate-600 hover:bg-emerald-50'
                      }`}
                    >
                      {f}
                    </button>
                  )
                )}
              </div>
            </div>

            <form
              onSubmit={handleAddEvent}
              className="p-4 bg-[#F3FAF6] border-b border-emerald-100 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
            >
              <input
                type="text"
                required
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="일정 제목 (예: 자료구조 보강 수업)"
                className="sm:col-span-5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
              <input
                type="date"
                value={evDate}
                onChange={(e) => setEvDate(e.target.value)}
                className="sm:col-span-3 px-2.5 py-2 text-xs font-mono-tabular bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
              <select
                value={evType}
                onChange={(e) => setEvType(e.target.value as AcademicEventType)}
                className="sm:col-span-2 px-2 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              >
                <option value="학사일정">학사일정</option>
                <option value="수강신청">수강신청</option>
                <option value="중간고사">중간고사</option>
                <option value="기말고사">기말고사</option>
                <option value="휴강">휴강</option>
                <option value="보강">보강</option>
              </select>
              <button
                type="submit"
                className="sm:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
              >
                추가
              </button>
              <select
                value={evCourseId}
                onChange={(e) => setEvCourseId(e.target.value)}
                className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="">연결 과목 (선택)</option>
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={evMemo}
                onChange={(e) => setEvMemo(e.target.value)}
                placeholder="장소/시간 메모"
                className="sm:col-span-8 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </form>

            <div className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  등록된 학사 일정이 없습니다.
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const info = getDeadlineInfo(`${ev.date}T23:59`);
                  const course = state.courses.find((c) => c.id === ev.courseId);
                  return (
                    <div
                      key={ev.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono-tabular font-semibold text-emerald-700">
                            {info.dDayLabel}
                          </span>
                          <span>·</span>
                          <span className="font-mono-tabular">{ev.date}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">{ev.type}</span>
                          {course && (
                            <>
                              <span>·</span>
                              <span>{course.name}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-medium text-slate-900 mt-0.5">
                          {ev.title}
                        </div>
                        {ev.memo && (
                          <div className="text-xs text-slate-500 mt-0.5">{ev.memo}</div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAcademicEvent(ev.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        aria-label="학사 일정 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Weekly Free Gap Routines */}
          <section className="lg:col-span-5 bg-white border border-emerald-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Clock className="w-4 h-4 text-emerald-700" />
              <h3 className="font-display text-sm font-semibold text-slate-900">
                공강 시간 자동 감지 및 루틴
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">감지된 주간 공강</div>
                {WEEKDAYS.flatMap((d) =>
                  weeklyGaps[d].map((g, idx) => (
                    <div
                      key={`${d}-${idx}`}
                      className="flex items-center justify-between gap-3 p-3 bg-[#F3FAF6] border border-emerald-200/70 rounded-xl text-xs"
                    >
                      <div>
                        <div className="font-mono-tabular font-semibold text-slate-800">
                          {d}요일 {formatTimeRange(g.startHour, g.endHour)} ({g.durationHours}시간)
                        </div>
                        <div className="text-slate-600 mt-0.5">{g.suggestion}</div>
                      </div>
                      <button
                        onClick={() => {
                          setGapTarget({
                            day: d,
                            startHour: g.startHour,
                            endHour: g.endHour,
                          });
                          setGapTitle(g.suggestion);
                        }}
                        className="px-2.5 py-1.5 font-medium text-emerald-800 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 shrink-0"
                      >
                        할 일 배정
                      </button>
                    </div>
                  ))
                )}
                {WEEKDAYS.every((d) => weeklyGaps[d].length === 0) && (
                  <p className="text-xs text-slate-500">
                    수업 간 1시간 이상의 공강이 감지되지 않았습니다.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-medium text-slate-500">배정된 공강 루틴 목록</div>
                {state.freeSlotRoutines.length === 0 ? (
                  <p className="text-xs text-slate-400">아직 등록된 공강 루틴이 없습니다.</p>
                ) : (
                  state.freeSlotRoutines.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 p-2.5 border border-slate-200 rounded-xl text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={r.done}
                          onChange={() => toggleFreeSlotRoutine(r.id)}
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        <span className="font-mono-tabular text-slate-500 shrink-0">
                          {r.day} {formatTimeRange(r.startHour, r.endHour)}
                        </span>
                        <span
                          className={`truncate ${
                            r.done ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {r.title}
                        </span>
                      </label>
                      <button
                        onClick={() => deleteFreeSlotRoutine(r.id)}
                        className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Course Detail Modal */}
      {detailCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500">
                  {detailCourse.code} · {detailCourse.category} · {detailCourse.credits}학점
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {detailCourse.name}
                </h3>
              </div>
              <button
                onClick={() => setDetailCourse(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-slate-500">담당 교수</span>
                  <div className="font-medium text-slate-900 mt-0.5">
                    {detailCourse.professor}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">강의실</span>
                  <div className="font-medium text-slate-900 mt-0.5">{detailCourse.room}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">수업 시간</span>
                  <div className="font-mono-tabular font-medium text-slate-900 mt-0.5">
                    {detailCourse.slots
                      .map((s) => `${s.day} ${formatTimeRange(s.startHour, s.endHour)}`)
                      .join(', ') || '시간 미지정'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setFocusedCourseId(detailCourse.id);
                    setDetailCourse(null);
                    setActiveTab('archive');
                  }}
                  className="px-3 py-2 font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                >
                  전공 자료실 ({state.notes.filter((n) => n.courseId === detailCourse.id).length}건)
                </button>
                <button
                  onClick={() => {
                    setFocusedCourseId(detailCourse.id);
                    setDetailCourse(null);
                    setActiveTab('study');
                  }}
                  className="px-3 py-2 font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  과제 · 진도표 보기
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    deleteCourse(detailCourse.id);
                    setDetailCourse(null);
                    showToast('강의가 시간표에서 삭제되었습니다.', 'info');
                  }}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>강의 삭제</span>
                </button>
                <button
                  onClick={() => openEditCourse(detailCourse)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>강의 수정</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Add / Edit Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[1px]">
          <div className="w-full max-w-lg bg-white border border-emerald-200 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {editingCourse ? '강의 정보 수정' : '새 강의 등록'}
              </h3>
              <button
                onClick={() => setCourseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">과목명</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="예: 작업치료학개론"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">과목코드</label>
                  <input
                    type="text"
                    value={cCode}
                    onChange={(e) => setCCode(e.target.value)}
                    placeholder="DR112"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">이수구분</label>
                  <select
                    value={cCategory}
                    onChange={(e) => setCCategory(e.target.value as CourseCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="전필">전필</option>
                    <option value="전선">전선</option>
                    <option value="교양">교양</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">학점</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={cCredits}
                    onChange={(e) => setCCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">컬러 테마</label>
                  <select
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value as CourseColorKey)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {Object.entries(COURSE_COLORS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">교수님</label>
                  <input
                    type="text"
                    value={cProf}
                    onChange={(e) => setCProf(e.target.value)}
                    placeholder="김서연 교수님"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">강의실</label>
                  <input
                    type="text"
                    value={cRoom}
                    onChange={(e) => setCRoom(e.target.value)}
                    placeholder="휴먼서비스관 204호"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">강의 시간표 블록</label>
                  <button
                    type="button"
                    onClick={() =>
                      setCSlots([...cSlots, { day: '수', startHour: 9, endHour: 10.5 }])
                    }
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    + 시간 블록 추가
                  </button>
                </div>
                {cSlots.map((slot, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select
                      value={slot.day}
                      onChange={(e) =>
                        setCSlots(
                          cSlots.map((s, i) =>
                            i === idx ? { ...s, day: e.target.value as Weekday } : s
                          )
                        )
                      }
                      className="col-span-3 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {[...WEEKDAYS, '토'].map((d) => (
                        <option key={d} value={d}>
                          {d}요일
                        </option>
                      ))}
                    </select>
                    <select
                      value={slot.startHour}
                      onChange={(e) =>
                        setCSlots(
                          cSlots.map((s, i) =>
                            i === idx ? { ...s, startHour: Number(e.target.value) } : s
                          )
                        )
                      }
                      className="col-span-4 px-2 py-1.5 text-xs font-mono-tabular border border-slate-200 rounded-lg bg-white"
                    >
                      {Array.from({ length: 22 }, (_, i) => 9 + i * 0.5).map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={slot.endHour}
                      onChange={(e) =>
                        setCSlots(
                          cSlots.map((s, i) =>
                            i === idx ? { ...s, endHour: Number(e.target.value) } : s
                          )
                        )
                      }
                      className="col-span-4 px-2 py-1.5 text-xs font-mono-tabular border border-slate-200 rounded-lg bg-white"
                    >
                      {Array.from({ length: 22 }, (_, i) => 9.5 + i * 0.5).map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setCSlots(cSlots.filter((_, i) => i !== idx))}
                      className="col-span-1 p-1 text-slate-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gap Routine Modal */}
      {gapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white border border-emerald-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                공강 시간 학습 루틴 배정 ({gapTarget.day}요일{' '}
                {formatTimeRange(gapTarget.startHour, gapTarget.endHour)})
              </h3>
              <button
                onClick={() => setGapTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveGapRoutine} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  할 일 / 학습 루틴
                </label>
                <input
                  type="text"
                  required
                  value={gapTitle}
                  onChange={(e) => setGapTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGapTarget(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
                >
                  공강 루틴 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
