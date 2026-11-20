import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  MapPin,
  Rows3,
  User,
} from 'lucide-react';
import {
  AcademicEvent,
  Assignment,
  Course,
  FreeSlotRoutine,
  TimeSlot,
  Weekday,
} from '../../types/campus';
import {
  COURSE_COLORS,
  DetectedGap,
  WEEKDAYS,
  addDaysISO,
  formatDateISO,
  formatHour,
  formatTimeRange,
} from '../../utils/calculations';

const START_HOUR = 9;
const END_HOUR = 20;
const HOUR_HEIGHT = 64; // px per hour — roomy enough for full card layout

interface WeeklyScheduleCalendarProps {
  courses: Course[];
  academicEvents: AcademicEvent[];
  assignments: Assignment[];
  freeSlotRoutines: FreeSlotRoutine[];
  weeklyGaps: Record<Weekday, DetectedGap[]>;
  includeSaturday: boolean;
  onSelectCourse: (course: Course) => void;
  onSelectGap: (gap: { day: Weekday; startHour: number; endHour: number; suggestion: string }) => void;
  onToggleRoutine: (routineId: string) => void;
}

const WEEKDAY_OFFSET: Record<Weekday, number> = {
  월: 0,
  화: 1,
  수: 2,
  목: 3,
  금: 4,
  토: 5,
};

function getMondayOfWeek(baseDate: Date, weekOffset: number): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const jsDay = d.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
  return formatDateISO(d);
}

function formatKoreanShortDate(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number);
  return `${m}/${d}`;
}

function getWeekOfMonthLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const weekNum = Math.ceil((d + offset) / 7);
  return `${y}년 ${m}월 ${weekNum}주차`;
}

export const WeeklyScheduleCalendar: React.FC<WeeklyScheduleCalendarProps> = ({
  courses,
  academicEvents,
  assignments,
  freeSlotRoutines,
  weeklyGaps,
  includeSaturday,
  onSelectCourse,
  onSelectGap,
  onToggleRoutine,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarLayout, setCalendarLayout] = useState<'timeline' | 'cards'>('timeline');
  const [highlightedCourseId, setHighlightedCourseId] = useState<string>('ALL');

  const today = new Date();
  const todayISO = formatDateISO(today);
  const currentDecimalHour = today.getHours() + today.getMinutes() / 60;

  const displayDays: Weekday[] = includeSaturday ? [...WEEKDAYS, '토'] : WEEKDAYS;

  const weekDaysMeta = useMemo(() => {
    const mondayISO = getMondayOfWeek(new Date(), weekOffset);
    return displayDays.map((day) => {
      const dateISO = addDaysISO(mondayISO, WEEKDAY_OFFSET[day]);
      const dayEvents = academicEvents.filter((ev) => ev.date === dateISO);
      const dayAssignments = assignments.filter(
        (a) => a.dueDate.slice(0, 10) === dateISO && a.status !== '제출완료'
      );
      return {
        day,
        dateISO,
        shortDate: formatKoreanShortDate(dateISO),
        dayNumber: Number(dateISO.split('-')[2]),
        isToday: dateISO === todayISO,
        dayEvents,
        dayAssignments,
      };
    });
  }, [displayDays, weekOffset, academicEvents, assignments, todayISO]);

  const weekRangeLabel = useMemo(() => {
    if (weekDaysMeta.length === 0) return '';
    const first = weekDaysMeta[0];
    const last = weekDaysMeta[weekDaysMeta.length - 1];
    const [fy, fm, fd] = first.dateISO.split('-').map(Number);
    const [, lm, ld] = last.dateISO.split('-').map(Number);
    return `${fy}년 ${fm}월 ${fd}일 – ${lm}월 ${ld}일`;
  }, [weekDaysMeta]);

  const weekOfMonthLabel = useMemo(() => {
    if (weekDaysMeta.length === 0) return '';
    return getWeekOfMonthLabel(weekDaysMeta[0].dateISO);
  }, [weekDaysMeta]);

  const weeklyStats = useMemo(() => {
    let classSessions = 0;
    let totalHours = 0;
    for (const c of courses) {
      for (const s of c.slots) {
        if (displayDays.includes(s.day)) {
          classSessions += 1;
          totalHours += Math.max(0, s.endHour - s.startHour);
        }
      }
    }
    const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
    const weekDateSet = new Set(weekDaysMeta.map((d) => d.dateISO));
    const weekEventCount = academicEvents.filter((e) => weekDateSet.has(e.date)).length;
    const weekAssignmentCount = assignments.filter(
      (a) => weekDateSet.has(a.dueDate.slice(0, 10)) && a.status !== '제출완료'
    ).length;

    return {
      classSessions,
      totalHours: Math.round(totalHours * 10) / 10,
      totalCredits,
      weekEventCount,
      weekAssignmentCount,
    };
  }, [courses, displayDays, weekDaysMeta, academicEvents, assignments]);

  const pendingAssignmentsByCourse = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of assignments) {
      if (a.status !== '제출완료') {
        map[a.courseId] = (map[a.courseId] || 0) + 1;
      }
    }
    return map;
  }, [assignments]);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <section className="space-y-4">
      {/* Calendar Control Card */}
      <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Week Title & Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-slate-900">
                  주간 수업 캘린더
                </h2>
                <span className="text-xs font-medium text-emerald-700">{weekOfMonthLabel}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                {weekRangeLabel}
                <span className="mx-1.5 text-slate-300">·</span>
                <span>주 {weeklyStats.classSessions}강 ({weeklyStats.totalHours}시간)</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>총 {weeklyStats.totalCredits}학점</span>
                {(weeklyStats.weekEventCount > 0 || weeklyStats.weekAssignmentCount > 0) && (
                  <>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="text-emerald-700 font-medium">
                      이번 주 일정 {weeklyStats.weekEventCount} · 과제 {weeklyStats.weekAssignmentCount}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Week Nav & Layout Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-[#F3FAF6] border border-emerald-200/80 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-white rounded-lg transition-colors"
                aria-label="이전 주"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  weekOffset === 0
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                이번 주
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-white rounded-lg transition-colors"
                aria-label="다음 주"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="inline-flex items-center bg-[#F3FAF6] border border-emerald-200/80 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setCalendarLayout('timeline')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  calendarLayout === 'timeline'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span>시간표 그리드</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarLayout('cards')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  calendarLayout === 'cards'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>요일 카드 보드</span>
              </button>
            </div>
          </div>
        </div>

        {/* Course Color Legend / Quick Highlight Filter */}
        {courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-emerald-100">
            <button
              type="button"
              onClick={() => setHighlightedCourseId('ALL')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                highlightedCourseId === 'ALL'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#F3FAF6] text-slate-600 hover:text-slate-900 border border-emerald-100'
              }`}
            >
              전체 과목 ({courses.length})
            </button>
            {courses.map((c) => {
              const token = COURSE_COLORS[c.color];
              const active = highlightedCourseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setHighlightedCourseId(active ? 'ALL' : c.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                    active
                      ? `${token.bg} ${token.border} ${token.text} shadow-xs`
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${token.dot}`} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mode 1: Visual Time-Grid Calendar with Card-Shaped Class Blocks */}
      {calendarLayout === 'timeline' && (
        <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm overflow-x-auto">
          <div className="min-w-[820px]">
            {/* Calendar Day Header Row */}
            <div
              className="grid border-b border-emerald-100 bg-[#F3FAF6]"
              style={{
                gridTemplateColumns: `68px repeat(${weekDaysMeta.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="py-3 px-2 flex flex-col items-center justify-center text-[11px] font-medium text-emerald-800/70">
                <Clock className="w-3.5 h-3.5 mb-0.5 text-emerald-700/70" />
                <span>시간</span>
              </div>

              {weekDaysMeta.map((meta) => (
                <div
                  key={meta.day}
                  className={`p-2.5 border-l border-emerald-100 flex flex-col justify-between gap-1.5 ${
                    meta.isToday ? 'bg-emerald-50/70' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{meta.day}요일</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg font-mono-tabular text-[11px] font-semibold ${
                        meta.isToday
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-slate-600 border border-emerald-200/70'
                      }`}
                    >
                      {meta.shortDate}
                    </span>
                  </div>

                  {/* Day Academic Events / Assignment Deadlines Strip */}
                  {(meta.dayEvents.length > 0 || meta.dayAssignments.length > 0) && (
                    <div className="space-y-1">
                      {meta.dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[10px] text-emerald-900 font-medium truncate"
                          title={`${ev.type}: ${ev.title}`}
                        >
                          {ev.type} · {ev.title}
                        </div>
                      ))}
                      {meta.dayAssignments.slice(0, 2).map((as) => (
                        <div
                          key={as.id}
                          className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-medium truncate"
                          title={`과제 마감: ${as.title}`}
                        >
                          마감 · {as.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Calendar Time Grid Body */}
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: `68px repeat(${weekDaysMeta.length}, minmax(0, 1fr))`,
                height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px`,
              }}
            >
              {/* Left Hour Axis */}
              <div className="relative bg-[#FAFCFB]">
                {hours.slice(0, -1).map((h) => (
                  <div
                    key={h}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-emerald-100/80 pr-2.5 pt-1.5 text-right font-mono-tabular text-[11px] text-slate-400"
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDaysMeta.map((meta) => {
                const day = meta.day;
                const dayCourses: Array<{ course: Course; slot: TimeSlot }> = courses.flatMap(
                  (c) => c.slots.filter((s) => s.day === day).map((s) => ({ course: c, slot: s }))
                );
                const gaps = weeklyGaps[day] || [];
                const dayRoutines = freeSlotRoutines.filter((r) => r.day === day);

                const showNowLine =
                  meta.isToday &&
                  currentDecimalHour >= START_HOUR &&
                  currentDecimalHour <= END_HOUR;
                const nowTop = (currentDecimalHour - START_HOUR) * HOUR_HEIGHT;

                return (
                  <div
                    key={day}
                    className={`relative border-l border-emerald-100/80 ${
                      meta.isToday ? 'bg-emerald-50/25' : 'bg-white'
                    }`}
                  >
                    {/* Hourly grid lines */}
                    {hours.slice(0, -1).map((h) => (
                      <div
                        key={h}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="border-b border-slate-100"
                      />
                    ))}

                    {/* Current Time Indicator */}
                    {showNowLine && (
                      <div
                        style={{ top: `${nowTop}px` }}
                        className="absolute inset-x-0 z-20 pointer-events-none flex items-center"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600 -ml-1 shrink-0" />
                        <div className="flex-1 h-[1.5px] bg-emerald-600/80" />
                      </div>
                    )}

                    {/* Free Gap Interactive Cards (only when no routine occupies exact slot) */}
                    {gaps.map((g, idx) => {
                      const hasRoutine = dayRoutines.some(
                        (r) => r.startHour === g.startHour && r.endHour === g.endHour
                      );
                      if (hasRoutine) return null;
                      const top = (g.startHour - START_HOUR) * HOUR_HEIGHT + 3;
                      const height = Math.max(28, (g.endHour - g.startHour) * HOUR_HEIGHT - 6);
                      return (
                        <button
                          key={`gap-${idx}`}
                          type="button"
                          onClick={() =>
                            onSelectGap({
                              day,
                              startHour: g.startHour,
                              endHour: g.endHour,
                              suggestion: g.suggestion,
                            })
                          }
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className="absolute inset-x-1.5 rounded-xl border border-dashed border-emerald-300 bg-[#F3FAF6]/80 hover:bg-emerald-50 hover:border-emerald-500 px-2.5 py-1.5 text-left transition-colors flex flex-col justify-center overflow-hidden"
                        >
                          <div className="font-mono-tabular text-[10px] font-semibold text-emerald-800 truncate">
                            공강 {g.durationHours}h · 루틴 배정
                          </div>
                          {height >= 48 && (
                            <div className="text-[10px] text-emerald-700/80 truncate mt-0.5">
                              {g.suggestion}
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* Assigned Free Slot Routines */}
                    {dayRoutines.map((r) => {
                      const top = (r.startHour - START_HOUR) * HOUR_HEIGHT + 3;
                      const height = Math.max(30, (r.endHour - r.startHour) * HOUR_HEIGHT - 6);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onToggleRoutine(r.id)}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className={`absolute inset-x-1.5 rounded-xl border px-2.5 py-1.5 text-left transition-all flex flex-col justify-center overflow-hidden shadow-xs ${
                            r.done
                              ? 'bg-slate-50 border-slate-200 text-slate-400'
                              : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-700" />
                            <span className="font-mono-tabular">
                              {formatTimeRange(r.startHour, r.endHour)}
                            </span>
                          </div>
                          <div
                            className={`text-[11px] font-medium truncate mt-0.5 ${
                              r.done ? 'line-through' : ''
                            }`}
                          >
                            {r.title}
                          </div>
                        </button>
                      );
                    })}

                    {/* Class Cards */}
                    {dayCourses.map(({ course, slot }, idx) => {
                      const top = (slot.startHour - START_HOUR) * HOUR_HEIGHT + 3;
                      const height = Math.max(38, (slot.endHour - slot.startHour) * HOUR_HEIGHT - 6);
                      const token = COURSE_COLORS[course.color];
                      const dimmed =
                        highlightedCourseId !== 'ALL' && highlightedCourseId !== course.id;
                      const pendingCount = pendingAssignmentsByCourse[course.id] || 0;

                      return (
                        <button
                          key={`${course.id}-${idx}`}
                          type="button"
                          onClick={() => onSelectCourse(course)}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className={`absolute inset-x-1.5 z-10 rounded-xl bg-white border ${token.border} shadow-sm hover:shadow-md hover:border-emerald-400 transition-all text-left overflow-hidden flex flex-col ${
                            dimmed ? 'opacity-30' : 'opacity-100'
                          }`}
                        >
                          {/* Card Top Tinted Header */}
                          <div
                            className={`px-2.5 py-1.5 ${token.bg} border-b ${token.border} flex items-center justify-between gap-1.5 shrink-0`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${token.dot}`} />
                              <span className={`text-[11px] font-bold truncate ${token.text}`}>
                                {course.name}
                              </span>
                            </div>
                            {pendingCount > 0 && (
                              <span className="font-mono-tabular text-[10px] font-semibold text-amber-700 shrink-0">
                                과제 {pendingCount}
                              </span>
                            )}
                          </div>

                          {/* Card Body Metadata */}
                          <div className="px-2.5 py-1.5 flex-1 flex flex-col justify-between min-h-0">
                            {height >= 72 ? (
                              <>
                                <div className="space-y-0.5 text-[11px] text-slate-600">
                                  <div className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{course.room}</span>
                                  </div>
                                  {height >= 92 && (
                                    <div className="flex items-center gap-1 truncate">
                                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{course.professor}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-tabular pt-1 border-t border-slate-100">
                                  <span>{formatTimeRange(slot.startHour, slot.endHour)}</span>
                                  <span>
                                    {course.category} · {course.credits}학점
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono-tabular">
                                <span className="truncate">{course.room}</span>
                                <span className="shrink-0">
                                  {formatHour(slot.startHour)}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Weekly Day Cards Board (Each day is a column of full class cards) */}
      {calendarLayout === 'cards' && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-4 items-start ${
            weekDaysMeta.length === 6 ? 'xl:grid-cols-6 lg:grid-cols-3' : 'xl:grid-cols-5 lg:grid-cols-3'
          }`}
        >
          {weekDaysMeta.map((meta) => {
            const day = meta.day;
            const daySlots = courses
              .flatMap((c) => c.slots.filter((s) => s.day === day).map((s) => ({ course: c, slot: s })))
              .sort((a, b) => a.slot.startHour - b.slot.startHour);
            const gaps = weeklyGaps[day] || [];
            const routines = freeSlotRoutines.filter((r) => r.day === day);

            return (
              <div
                key={day}
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col ${
                  meta.isToday ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-emerald-200/80'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between ${
                    meta.isToday
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-[#F3FAF6] text-slate-900 border-emerald-100'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">{day}요일</div>
                    <div
                      className={`text-[11px] font-mono-tabular ${
                        meta.isToday ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      {meta.shortDate} · 수업 {daySlots.length}건
                    </div>
                  </div>
                  {meta.isToday && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white/20 text-white">
                      오늘
                    </span>
                  )}
                </div>

                {/* Day Academic Events / Deadlines */}
                {(meta.dayEvents.length > 0 || meta.dayAssignments.length > 0) && (
                  <div className="px-3 py-2 bg-emerald-50/40 border-b border-emerald-100 space-y-1">
                    {meta.dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[11px] font-medium text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2.5 py-1 truncate"
                      >
                        {ev.type} · {ev.title}
                      </div>
                    ))}
                    {meta.dayAssignments.map((as) => (
                      <div
                        key={as.id}
                        className="text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 truncate"
                      >
                        마감 · {as.title}
                      </div>
                    ))}
                  </div>
                )}

                {/* Class Cards Stack */}
                <div className="p-3 space-y-2.5 flex-1">
                  {daySlots.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      예정된 수업이 없습니다.
                    </div>
                  ) : (
                    daySlots.map(({ course, slot }, idx) => {
                      const token = COURSE_COLORS[course.color];
                      const dimmed =
                        highlightedCourseId !== 'ALL' && highlightedCourseId !== course.id;
                      const pendingCount = pendingAssignmentsByCourse[course.id] || 0;

                      return (
                        <button
                          key={`${course.id}-${idx}`}
                          type="button"
                          onClick={() => onSelectCourse(course)}
                          className={`w-full text-left rounded-xl bg-white border ${token.border} hover:border-emerald-400 shadow-xs hover:shadow-sm transition-all overflow-hidden ${
                            dimmed ? 'opacity-30' : 'opacity-100'
                          }`}
                        >
                          <div className={`px-3 py-2 ${token.bg} border-b ${token.border}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${token.dot}`} />
                                <span className={`text-xs font-bold truncate ${token.text}`}>
                                  {course.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono-tabular text-slate-500 shrink-0">
                                {course.code}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 space-y-1.5 text-[11px] text-slate-600">
                            <div className="font-mono-tabular font-semibold text-emerald-800 flex items-center justify-between">
                              <span>{formatTimeRange(slot.startHour, slot.endHour)}</span>
                              <span className="text-[10px] font-normal text-slate-500">
                                {course.category} · {course.credits}학점
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{course.room}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{course.professor}</span>
                              </div>
                              {pendingCount > 0 && (
                                <span className="font-mono-tabular text-[10px] font-semibold text-amber-700 shrink-0">
                                  과제 {pendingCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}

                  {/* Free Gaps & Assigned Routines */}
                  {routines.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onToggleRoutine(r.id)}
                      className={`w-full text-left rounded-xl border px-3 py-2 text-[11px] transition-colors ${
                        r.done
                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono-tabular text-[10px] text-emerald-700">
                        <span>{formatTimeRange(r.startHour, r.endHour)}</span>
                        <span>{r.done ? '완료' : '루틴'}</span>
                      </div>
                      <div className={`font-medium mt-0.5 ${r.done ? 'line-through' : ''}`}>
                        {r.title}
                      </div>
                    </button>
                  ))}

                  {gaps
                    .filter(
                      (g) =>
                        !routines.some(
                          (r) => r.startHour === g.startHour && r.endHour === g.endHour
                        )
                    )
                    .map((g, idx) => (
                      <button
                        key={`gap-card-${idx}`}
                        type="button"
                        onClick={() =>
                          onSelectGap({
                            day,
                            startHour: g.startHour,
                            endHour: g.endHour,
                            suggestion: g.suggestion,
                          })
                        }
                        className="w-full text-left rounded-xl border border-dashed border-emerald-300 bg-[#F3FAF6]/70 hover:bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 transition-colors"
                      >
                        <div className="font-mono-tabular font-semibold text-[10px]">
                          공강 {formatTimeRange(g.startHour, g.endHour)} ({g.durationHours}h)
                        </div>
                        <div className="text-emerald-700/80 truncate mt-0.5">
                          + {g.suggestion}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
