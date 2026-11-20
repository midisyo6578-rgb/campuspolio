import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
  Clock,
  Menu,
  Pause,
  Play,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { NavTabId } from '../../types/campus';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenQuickAdd: () => void;
}

const TAB_LABELS: Record<NavTabId, string> = {
  home: '홈 대시보드',
  timetable: '시간표 & 학사일정',
  study: '과제 / 학습 관리',
  archive: '전공 자료실',
  grades: '성적 & 학점 관리',
  campus: '학교생활 편의',
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
  onOpenQuickAdd,
}) => {
  const {
    state,
    activeTab,
    setActiveTab,
    setFocusedCourseId,
    urgentAssignments,
    pomodoro,
    togglePomodoroRunning,
  } = useWorkspace();

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mins = String(Math.floor(pomodoro.secondsLeft / 60)).padStart(2, '0');
  const secs = String(pomodoro.secondsLeft % 60).padStart(2, '0');
  const timerCourse = state.courses.find((c) => c.id === pomodoro.courseId);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { courses: [], assignments: [], notes: [], resources: [] };
    return {
      courses: state.courses.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.professor.toLowerCase().includes(q)
      ),
      assignments: state.assignments.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      ),
      notes: state.notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      ),
      resources: state.resources.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      ),
    };
  }, [searchQuery, state]);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#F3FAF6]/95 backdrop-blur-sm border-b border-emerald-200/80 px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Zone: Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-emerald-100/60"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-emerald-800/70 whitespace-nowrap hidden sm:inline">
              {state.semesterName}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline shrink-0" />
            <h1 className="font-display font-semibold text-slate-900 truncate text-[15px]">
              {TAB_LABELS[activeTab]}
            </h1>
          </div>
        </div>

        {/* Right Zone: Search, Live Timer (if active), Deadline Alerts, Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {(pomodoro.isRunning ||
            pomodoro.secondsLeft !==
              (pomodoro.mode === 'focus' ? pomodoro.focusMinutes : pomodoro.breakMinutes) *
                60) && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200/80 rounded-xl shadow-xs text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-slate-600 max-w-[110px] truncate">
                {timerCourse?.name || '집중 타이머'}
              </span>
              <span className="font-mono-tabular font-semibold text-slate-900">
                {mins}:{secs}
              </span>
              <button
                onClick={togglePomodoroRunning}
                className="p-0.5 text-emerald-700 hover:text-emerald-900"
                aria-label={pomodoro.isRunning ? '타이머 일시정지' : '타이머 시작'}
              >
                {pomodoro.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-emerald-200/80 rounded-xl shadow-xs hover:bg-emerald-50/50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">통합 검색</span>
          </button>

          {/* Deadline Alert Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => setAlertsOpen((v) => !v)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 ${
                urgentAssignments.length > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100/70'
                  : 'bg-white border-emerald-200/80 text-slate-700 hover:bg-emerald-50/50'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">마감 알림</span>
              <span className="font-mono-tabular font-semibold">
                {urgentAssignments.length}
              </span>
            </button>

            {alertsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAlertsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white border border-emerald-200 rounded-2xl shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-900">
                      마감 임박 알림 (24시간 · 3시간 기준)
                    </span>
                    <button
                      onClick={() => setAlertsOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {urgentAssignments.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        현재 24시간 이내 마감 임박 과제가 없습니다.
                      </div>
                    ) : (
                      urgentAssignments.map(({ assignment, info }) => {
                        const course = state.courses.find((c) => c.id === assignment.courseId);
                        return (
                          <button
                            key={assignment.id}
                            onClick={() => {
                              setActiveTab('study');
                              setAlertsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                              <span className="text-slate-500 truncate">
                                {course?.name || '미지정 과목'}
                              </span>
                              <span
                                className={`font-mono-tabular font-semibold shrink-0 ${
                                  info.urgency === 'overdue' || info.urgency === 'critical3h'
                                    ? 'text-red-600'
                                    : 'text-amber-700'
                                }`}
                              >
                                {info.timeRemainingLabel}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-slate-900 line-clamp-1">
                              {assignment.title}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl shadow-xs hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>빠른 등록</span>
          </button>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/35 backdrop-blur-[1px]">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="강의명, 과제, 마크다운 노트, #태그 검색..."
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-3 space-y-4">
              {!searchQuery.trim() ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  검색어를 입력하면 시간표 강의, 과제, 전공 노트, 자료실 파일을 즉시 찾습니다.
                </p>
              ) : (
                <>
                  {searchResults.courses.length === 0 &&
                  searchResults.assignments.length === 0 &&
                  searchResults.notes.length === 0 &&
                  searchResults.resources.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-500">
                      &ldquo;{searchQuery}&rdquo;에 해당하는 항목이 없습니다.
                    </p>
                  ) : (
                    <>
                      {searchResults.courses.length > 0 && (
                        <div>
                          <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400">
                            수강 과목
                          </div>
                          {searchResults.courses.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setFocusedCourseId(c.id);
                                setActiveTab('timetable');
                                setSearchOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 text-xs flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-900">{c.name}</span>
                              <span className="text-slate-500">
                                {c.code} · {c.professor}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.assignments.length > 0 && (
                        <div>
                          <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400">
                            과제
                          </div>
                          {searchResults.assignments.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => {
                                setActiveTab('study');
                                setSearchOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 text-xs flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-900 truncate">{a.title}</span>
                              <span className="text-slate-500 shrink-0 ml-2">{a.status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.notes.length > 0 && (
                        <div>
                          <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400">
                            전공 노트
                          </div>
                          {searchResults.notes.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                setFocusedCourseId(n.courseId);
                                setActiveTab('archive');
                                setSearchOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 text-xs flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-900 truncate">{n.title}</span>
                              <span className="text-slate-500 shrink-0 ml-2">
                                {n.tags.map((t) => `#${t}`).join(' ')}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.resources.length > 0 && (
                        <div>
                          <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400">
                            강의 자료
                          </div>
                          {searchResults.resources.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setFocusedCourseId(r.courseId);
                                setActiveTab('archive');
                                setSearchOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 text-xs flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-900 truncate">{r.title}</span>
                              <span className="text-slate-500 shrink-0 ml-2">{r.resourceType}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
