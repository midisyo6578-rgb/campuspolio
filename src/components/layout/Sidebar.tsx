import React from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Database,
  FolderArchive,
  GraduationCap,
  Home,
  Building2,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { NavTabId } from '../../types/campus';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenDataModal: () => void;
}

const NAV_ITEMS: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: '홈 대시보드', icon: Home },
  { id: 'timetable', label: '시간표 & 학사일정', icon: CalendarDays },
  { id: 'study', label: '과제 / 학습 관리', icon: CheckSquare },
  { id: 'archive', label: '전공 자료실', icon: FolderArchive },
  { id: 'grades', label: '성적 & 학점 관리', icon: GraduationCap },
  { id: 'campus', label: '학교생활 편의', icon: Building2 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  onOpenDataModal,
}) => {
  const { state, activeTab, setActiveTab, setFocusedCourseId, urgentAssignments } = useWorkspace();

  const totalCredits = state.courses.reduce((acc, c) => acc + c.credits, 0);
  const pendingCount = state.assignments.filter((a) => a.status !== '제출완료').length;

  const handleSelect = (id: NavTabId) => {
    setActiveTab(id);
    if (id !== 'archive' && id !== 'study') {
      setFocusedCourseId(null);
    }
    onCloseMobile();
  };

  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#F3FAF6] border-r border-emerald-200/80 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-emerald-200/80">
        <button
          onClick={() => handleSelect('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[15px] font-bold tracking-tight text-slate-900 whitespace-nowrap">
              CampusFolio
            </div>
            <div className="text-[11px] text-emerald-800/75 whitespace-nowrap">
              캠퍼스폴리오 워크스페이스
            </div>
          </div>
        </button>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
          aria-label="메뉴 닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Semester Summary Card */}
      <div className="px-3.5 pt-3.5">
        <div className="px-3.5 py-2.5 bg-white border border-emerald-200/80 rounded-xl shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-emerald-700 truncate">
            휴먼서비스대학 · 치매재활학과
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{state.semesterName} (1-2)</span>
            <span className="font-mono-tabular text-emerald-700 font-medium">
              {state.courses.length}과목 · {totalCredits}학점
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="주 메뉴">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-emerald-100/60 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-700/75'}`} />
                <span>{item.label}</span>
              </span>
              {item.id === 'study' && pendingCount > 0 && (
                <span
                  className={`font-mono-tabular text-[11px] ${
                    isActive
                      ? 'text-emerald-100'
                      : urgentAssignments.length > 0
                      ? 'text-amber-700 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Data Persistence & Utilities */}
      <div className="p-3 border-t border-emerald-200/80 space-y-2">
        <div className="px-2 py-1 text-[11px] text-emerald-900/65 leading-relaxed">
          브라우저에 자동 저장됩니다
        </div>
        <button
          onClick={onOpenDataModal}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 bg-white border border-emerald-200/80 rounded-xl shadow-xs hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors whitespace-nowrap"
        >
          <Database className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>데이터 백업 · 초기화</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[248px] shrink-0 h-screen sticky top-0">
        {sidebarBody}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <aside className="relative w-[264px] max-w-[85vw] h-full z-10 shadow-xl">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
};
