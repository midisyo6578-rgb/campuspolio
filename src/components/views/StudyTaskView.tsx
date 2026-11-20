import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookCheck,
  Check,
  Columns,
  List,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AssignmentStatus, PriorityLevel } from '../../types/campus';
import {
  COURSE_COLORS,
  addDaysISO,
  formatDateISO,
  getDeadlineInfo,
} from '../../utils/calculations';

type SubTab = 'assignments' | 'projects' | 'planner' | 'exam';

export const StudyTaskView: React.FC = () => {
  const {
    state,
    focusedCourseId,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addTeamProject,
    updateTeamProject,
    deleteTeamProject,
    updateCourse,
    logPomodoroManual,
    showToast,
  } = useWorkspace();

  const [subTab, setSubTab] = useState<SubTab>('assignments');

  // Assignments state
  const [asLayout, setAsLayout] = useState<'kanban' | 'list'>('kanban');
  const [asCourseFilter, setAsCourseFilter] = useState<string>(focusedCourseId || 'all');
  const [newAsOpen, setNewAsOpen] = useState(false);
  const [asTitle, setAsTitle] = useState('');
  const [asCourseId, setAsCourseId] = useState(state.courses[0]?.id || '');
  const [asDue, setAsDue] = useState(
    `${addDaysISO(formatDateISO(new Date()), 2)}T23:59`
  );
  const [asPriority, setAsPriority] = useState<PriorityLevel>('보통');
  const [asDesc, setAsDesc] = useState('');

  // Team Project state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    state.teamProjects[0]?.id || ''
  );
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projCourseId, setProjCourseId] = useState(state.courses[0]?.id || '');
  const [projDesc, setProjDesc] = useState('');
  const [projDue, setProjDue] = useState(addDaysISO(formatDateISO(new Date()), 14));

  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [msTitle, setMsTitle] = useState('');
  const [msAssignee, setMsAssignee] = useState('');
  const [msDue, setMsDue] = useState(addDaysISO(formatDateISO(new Date()), 5));
  const [meetTitle, setMeetTitle] = useState('');
  const [meetSummary, setMeetSummary] = useState('');

  // Planner & Exam Course Selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    focusedCourseId || state.courses[0]?.id || ''
  );
  const [newExamItem, setNewExamItem] = useState('');
  const [manualLogMins, setManualLogMins] = useState(25);

  const selectedCourse =
    state.courses.find((c) => c.id === selectedCourseId) || state.courses[0] || null;
  const activeProject =
    state.teamProjects.find((p) => p.id === selectedProjectId) ||
    state.teamProjects[0] ||
    null;

  const filteredAssignments = useMemo(() => {
    return state.assignments
      .filter((a) => asCourseFilter === 'all' || a.courseId === asCourseFilter)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [state.assignments, asCourseFilter]);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asTitle.trim()) return;
    addAssignment({
      id: `as-${Date.now()}`,
      courseId: asCourseId || state.courses[0]?.id || '',
      title: asTitle.trim(),
      description: asDesc.trim(),
      dueDate: asDue,
      status: '예정',
      priority: asPriority,
      remind24h: true,
      remind3h: true,
    });
    setAsTitle('');
    setAsDesc('');
    setNewAsOpen(false);
    showToast('새 과제가 추가되었습니다.', 'success');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    const id = `tp-${Date.now()}`;
    addTeamProject({
      id,
      courseId: projCourseId || state.courses[0]?.id || '',
      title: projTitle.trim(),
      description: projDesc.trim(),
      dueDate: projDue,
      members: [{ id: `m-${Date.now()}`, name: '본인', role: '팀장' }],
      milestones: [],
      meetings: [],
    });
    setSelectedProjectId(id);
    setProjTitle('');
    setProjDesc('');
    setNewProjOpen(false);
    showToast('새 팀 프로젝트 보드가 생성되었습니다.', 'success');
  };

  // Study statistics per course
  const courseStudyTotals = useMemo(() => {
    return state.courses.map((c) => {
      const mins = state.pomodoroSessions
        .filter((s) => s.courseId === c.id)
        .reduce((acc, s) => acc + s.minutes, 0);
      return { course: c, minutes: mins };
    });
  }, [state.courses, state.pomodoroSessions]);

  const maxStudyMins = Math.max(60, ...courseStudyTotals.map((x) => x.minutes));

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-white border border-emerald-200/80 rounded-xl shadow-xs overflow-x-auto">
          {[
            { id: 'assignments' as const, label: '과제 트래커', icon: Columns },
            { id: 'projects' as const, label: '팀 프로젝트 보드', icon: Users },
            { id: 'planner' as const, label: '주차별 진도 & 복습', icon: BookCheck },
            { id: 'exam' as const, label: '시험 대비 & 학습 통계', icon: BarChart3 },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  subTab === t.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {subTab === 'assignments' && (
          <button
            onClick={() => setNewAsOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl shadow-xs hover:bg-emerald-800 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>과제 등록</span>
          </button>
        )}
        {subTab === 'projects' && (
          <button
            onClick={() => setNewProjOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl shadow-xs hover:bg-emerald-800 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 팀 프로젝트</span>
          </button>
        )}
      </div>

      {/* 1. Assignment Tracker */}
      {subTab === 'assignments' && (
        <div className="space-y-5">
          {newAsOpen && (
            <form
              onSubmit={handleCreateAssignment}
              className="border border-emerald-200 bg-white rounded-2xl shadow-sm p-4 grid grid-cols-1 sm:grid-cols-12 gap-3"
            >
              <select
                value={asCourseId}
                onChange={(e) => setAsCourseId(e.target.value)}
                className="sm:col-span-3 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={asTitle}
                onChange={(e) => setAsTitle(e.target.value)}
                placeholder="과제 제목을 입력하세요"
                className="sm:col-span-4 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="datetime-local"
                value={asDue}
                onChange={(e) => setAsDue(e.target.value)}
                className="sm:col-span-3 px-2.5 py-2 text-xs font-mono-tabular bg-white border border-slate-200 rounded-xl"
              />
              <select
                value={asPriority}
                onChange={(e) => setAsPriority(e.target.value as PriorityLevel)}
                className="sm:col-span-2 px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="높음">우선순위: 높음</option>
                <option value="보통">우선순위: 보통</option>
                <option value="낮음">우선순위: 낮음</option>
              </select>
              <input
                type="text"
                value={asDesc}
                onChange={(e) => setAsDesc(e.target.value)}
                placeholder="세부 요구사항 및 제출 방식 메모"
                className="sm:col-span-10 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                className="sm:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
              >
                저장
              </button>
            </form>
          )}

          {/* Filter & View Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={asCourseFilter}
                onChange={(e) => setAsCourseFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-emerald-200/80 rounded-xl shadow-xs"
              >
                <option value="all">전체 과목 ({state.assignments.length})</option>
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 p-1 bg-white border border-emerald-200/80 rounded-xl shadow-xs">
              <button
                onClick={() => setAsLayout('kanban')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg ${
                  asLayout === 'kanban'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>칸반</span>
              </button>
              <button
                onClick={() => setAsLayout('list')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg ${
                  asLayout === 'list' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>리스트</span>
              </button>
            </div>
          </div>

          {asLayout === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(['예정', '진행중', '제출완료'] as AssignmentStatus[]).map((statusCol) => {
                const items = filteredAssignments.filter((a) => a.status === statusCol);
                return (
                  <div key={statusCol} className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 bg-[#F3FAF6] border border-emerald-200/80 rounded-xl">
                      <span className="text-xs font-semibold text-slate-800">{statusCol}</span>
                      <span className="font-mono-tabular text-xs font-semibold text-emerald-700">
                        {items.length}
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <div className="bg-white/80 border border-dashed border-emerald-200 rounded-2xl py-8 text-center text-xs text-slate-400">
                        해당 상태의 과제가 없습니다.
                      </div>
                    ) : (
                      items.map((a) => {
                        const course = state.courses.find((c) => c.id === a.courseId);
                        const info = getDeadlineInfo(a.dueDate);
                        return (
                          <div
                            key={a.id}
                            className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 space-y-2.5 hover:border-emerald-300 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                              <span className="font-medium text-slate-700 truncate">
                                {course?.name || '미지정'} · {a.priority}
                              </span>
                              {a.status !== '제출완료' ? (
                                <span
                                  className={`font-mono-tabular font-semibold inline-flex items-center gap-1 shrink-0 ${
                                    info.urgency === 'overdue' || info.urgency === 'critical3h'
                                      ? 'text-red-600'
                                      : info.urgency === 'soon24h'
                                      ? 'text-amber-700'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {(info.urgency === 'critical3h' ||
                                    info.urgency === 'soon24h') && (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  {info.dDayLabel}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-medium">완료</span>
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-slate-900 leading-snug">
                                {a.title}
                              </div>
                              {a.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {a.description}
                                </p>
                              )}
                            </div>

                            <div className="text-[11px] font-mono-tabular text-slate-400">
                              마감: {a.dueDate.replace('T', ' ')}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <select
                                value={a.status}
                                onChange={(e) =>
                                  updateAssignment({
                                    ...a,
                                    status: e.target.value as AssignmentStatus,
                                  })
                                }
                                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                              >
                                <option value="예정">예정</option>
                                <option value="진행중">진행중</option>
                                <option value="제출완료">제출완료</option>
                              </select>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={a.remind24h}
                                    onChange={(e) =>
                                      updateAssignment({ ...a, remind24h: e.target.checked })
                                    }
                                    className="rounded border-slate-300 text-emerald-700"
                                  />
                                  <span>24h</span>
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={a.remind3h}
                                    onChange={(e) =>
                                      updateAssignment({ ...a, remind3h: e.target.checked })
                                    }
                                    className="rounded border-slate-300 text-emerald-700"
                                  />
                                  <span>3h</span>
                                </label>
                                <button
                                  onClick={() => deleteAssignment(a.id)}
                                  className="text-slate-400 hover:text-red-600 p-0.5"
                                  aria-label="과제 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl bg-white overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
                    <th className="py-3 px-4 font-medium">과목</th>
                    <th className="py-3 px-4 font-medium">과제명</th>
                    <th className="py-3 px-4 font-medium">마감 일시</th>
                    <th className="py-3 px-4 font-medium">D-Day</th>
                    <th className="py-3 px-4 font-medium">상태</th>
                    <th className="py-3 px-4 font-medium text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAssignments.map((a) => {
                    const course = state.courses.find((c) => c.id === a.courseId);
                    const info = getDeadlineInfo(a.dueDate);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                          {course?.name || '미지정'}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium">{a.title}</td>
                        <td className="py-3 px-4 font-mono-tabular text-slate-500 whitespace-nowrap">
                          {a.dueDate.replace('T', ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono-tabular font-semibold whitespace-nowrap">
                          {a.status === '제출완료' ? (
                            <span className="text-emerald-700">완료</span>
                          ) : (
                            <span
                              className={
                                info.urgency === 'overdue' || info.urgency === 'critical3h'
                                  ? 'text-red-600'
                                  : info.urgency === 'soon24h'
                                  ? 'text-amber-700'
                                  : 'text-slate-600'
                              }
                            >
                              {info.dDayLabel}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={a.status}
                            onChange={(e) =>
                              updateAssignment({
                                ...a,
                                status: e.target.value as AssignmentStatus,
                              })
                            }
                            className="px-2 py-1 border border-slate-200 rounded bg-white"
                          >
                            <option value="예정">예정</option>
                            <option value="진행중">진행중</option>
                            <option value="제출완료">제출완료</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteAssignment(a.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Team Project Board */}
      {subTab === 'projects' && (
        <div className="space-y-5">
          {newProjOpen && (
            <form
              onSubmit={handleCreateProject}
              className="border border-emerald-200 bg-white rounded-2xl shadow-sm p-4 grid grid-cols-1 sm:grid-cols-12 gap-3"
            >
              <select
                value={projCourseId}
                onChange={(e) => setProjCourseId(e.target.value)}
                className="sm:col-span-3 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                placeholder="팀 프로젝트 제목"
                className="sm:col-span-5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="date"
                value={projDue}
                onChange={(e) => setProjDue(e.target.value)}
                className="sm:col-span-2 px-2.5 py-2 text-xs font-mono-tabular bg-white border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                className="sm:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
              >
                생성
              </button>
              <input
                type="text"
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="프로젝트 목표 및 산출물 요약"
                className="sm:col-span-12 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </form>
          )}

          {state.teamProjects.length === 0 ? (
            <div className="border border-emerald-200/80 rounded-2xl shadow-sm bg-white py-12 text-center text-sm text-slate-500">
              등록된 팀 프로젝트가 없습니다. 상단에서 새 프로젝트를 생성하세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Project Selector */}
              <div className="lg:col-span-4 space-y-3">
                {state.teamProjects.map((p) => {
                  const course = state.courses.find((c) => c.id === p.courseId);
                  const doneMs = p.milestones.filter((m) => m.done).length;
                  const active = activeProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`w-full text-left p-4 rounded-2xl border shadow-sm transition-colors ${
                        active
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white border-emerald-200/80 hover:border-emerald-300'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between text-xs mb-1 ${
                          active ? 'text-emerald-100' : 'text-slate-500'
                        }`}
                      >
                        <span>{course?.name || '팀 프로젝트'}</span>
                        <span className="font-mono-tabular">마감 {p.dueDate}</span>
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          active ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {p.title}
                      </div>
                      <div
                        className={`text-xs mt-1.5 font-mono-tabular ${
                          active ? 'text-emerald-100' : 'text-slate-500'
                        }`}
                      >
                        팀원 {p.members.length}명 · 마일스톤 {doneMs}/{p.milestones.length}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Project Detail Board */}
              {activeProject && (
                <div className="lg:col-span-8 space-y-5">
                  <div className="border border-emerald-200/80 rounded-2xl shadow-sm bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          {state.courses.find((c) => c.id === activeProject.courseId)?.name} ·
                          마감 {activeProject.dueDate}
                        </div>
                        <h3 className="font-display text-lg font-bold text-slate-900">
                          {activeProject.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          {activeProject.description}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          deleteTeamProject(activeProject.id);
                          showToast('팀 프로젝트가 삭제되었습니다.', 'info');
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                        title="프로젝트 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Members & Roles */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-800 mb-2.5">
                        팀원 역할 분담
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {activeProject.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between px-3 py-2 bg-[#F3FAF6] border border-emerald-200/70 rounded-xl text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-900">{m.name}</span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span className="text-slate-600">{m.role}</span>
                            </div>
                            <button
                              onClick={() =>
                                updateTeamProject({
                                  ...activeProject,
                                  members: activeProject.members.filter((x) => x.id !== m.id),
                                })
                              }
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          placeholder="팀원 이름"
                          className="w-28 px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
                        />
                        <input
                          type="text"
                          value={memberRole}
                          onChange={(e) => setMemberRole(e.target.value)}
                          placeholder="담당 역할 (예: 프론트엔드 구현)"
                          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!memberName.trim()) return;
                            updateTeamProject({
                              ...activeProject,
                              members: [
                                ...activeProject.members,
                                {
                                  id: `m-${Date.now()}`,
                                  name: memberName.trim(),
                                  role: memberRole.trim() || '팀원',
                                },
                              ],
                            });
                            setMemberName('');
                            setMemberRole('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 whitespace-nowrap"
                        >
                          팀원 추가
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="border border-emerald-200/80 rounded-2xl shadow-sm bg-white p-5 space-y-3">
                    <div className="text-xs font-semibold text-slate-800">
                      마일스톤 체크리스트
                    </div>
                    <div className="space-y-2">
                      {activeProject.milestones.map((ms) => (
                        <div
                          key={ms.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                            <input
                              type="checkbox"
                              checked={ms.done}
                              onChange={() =>
                                updateTeamProject({
                                  ...activeProject,
                                  milestones: activeProject.milestones.map((x) =>
                                    x.id === ms.id ? { ...x, done: !x.done } : x
                                  ),
                                })
                              }
                              className="rounded border-slate-300 text-emerald-600"
                            />
                            <span
                              className={
                                ms.done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                              }
                            >
                              {ms.title}
                            </span>
                          </label>
                          <div className="flex items-center gap-2 shrink-0 text-slate-500">
                            <span>{ms.assignee}</span>
                            <span>·</span>
                            <span className="font-mono-tabular">{ms.dueDate}</span>
                            <button
                              onClick={() =>
                                updateTeamProject({
                                  ...activeProject,
                                  milestones: activeProject.milestones.filter(
                                    (x) => x.id !== ms.id
                                  ),
                                })
                              }
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                      <input
                        type="text"
                        value={msTitle}
                        onChange={(e) => setMsTitle(e.target.value)}
                        placeholder="새 마일스톤 항목"
                        className="sm:col-span-6 px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
                      />
                      <input
                        type="text"
                        value={msAssignee}
                        onChange={(e) => setMsAssignee(e.target.value)}
                        placeholder="담당자"
                        className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl"
                      />
                      <input
                        type="date"
                        value={msDue}
                        onChange={(e) => setMsDue(e.target.value)}
                        className="sm:col-span-2 px-2 py-1.5 text-xs font-mono-tabular border border-slate-200 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!msTitle.trim()) return;
                          updateTeamProject({
                            ...activeProject,
                            milestones: [
                              ...activeProject.milestones,
                              {
                                id: `ms-${Date.now()}`,
                                title: msTitle.trim(),
                                assignee: msAssignee.trim() || '전체',
                                dueDate: msDue,
                                done: false,
                              },
                            ],
                          });
                          setMsTitle('');
                        }}
                        className="sm:col-span-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
                      >
                        추가
                      </button>
                    </div>
                  </div>

                  {/* Meeting Notes */}
                  <div className="border border-emerald-200/80 rounded-2xl shadow-sm bg-white p-5 space-y-3">
                    <div className="text-xs font-semibold text-slate-800">회의록 아카이브</div>
                    {activeProject.meetings.map((mt) => (
                      <div
                        key={mt.id}
                        className="p-3.5 bg-[#F3FAF6] border border-emerald-200/70 rounded-xl space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{mt.title}</span>
                          <span className="font-mono-tabular text-slate-500">{mt.date}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{mt.summary}</p>
                        {mt.actionItems.length > 0 && (
                          <ul className="list-disc pl-4 text-slate-600 pt-1">
                            {mt.actionItems.map((ai, i) => (
                              <li key={i}>{ai}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        value={meetTitle}
                        onChange={(e) => setMeetTitle(e.target.value)}
                        placeholder="새 회의록 제목 (예: 3차 회의: 발표 데모 점검)"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={meetSummary}
                          onChange={(e) => setMeetSummary(e.target.value)}
                          placeholder="결정 사항 및 회의 요약 내용"
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!meetTitle.trim()) return;
                            updateTeamProject({
                              ...activeProject,
                              meetings: [
                                {
                                  id: `mt-${Date.now()}`,
                                  date: formatDateISO(new Date()),
                                  title: meetTitle.trim(),
                                  summary: meetSummary.trim(),
                                  actionItems: [],
                                },
                                ...activeProject.meetings,
                              ],
                            });
                            setMeetTitle('');
                            setMeetSummary('');
                            showToast('회의록이 저장되었습니다.', 'success');
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 whitespace-nowrap"
                        >
                          회의록 등록
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Weekly Progress & Ebbinghaus Planner */}
      {subTab === 'planner' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {state.courses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-3.5 py-2 text-xs font-medium rounded-xl border shadow-xs whitespace-nowrap transition-colors ${
                  selectedCourse?.id === c.id
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-emerald-200/80 hover:bg-emerald-50/50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {!selectedCourse ? (
            <div className="border border-emerald-200/80 rounded-2xl shadow-sm bg-white py-12 text-center text-sm text-slate-500">
              시간표에서 과목을 먼저 등록하세요.
            </div>
          ) : (
            <div className="border border-emerald-200/80 rounded-2xl shadow-sm bg-white overflow-x-auto">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900">
                    {selectedCourse.name} — 16주차 강의 진도 및 에빙하우스 복습 주기
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    수강 완료를 체크하면 학습일 기준 +1일 · +3일 · +7일 · +14일 복습 일정이 자동 계산됩니다.
                  </p>
                </div>
                <span className="font-mono-tabular text-xs font-semibold text-emerald-700">
                  진도 {selectedCourse.weeklyProgress.filter((w) => w.completed).length} / 16주
                </span>
              </div>

              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F3FAF6] text-xs text-slate-600">
                    <th className="py-2.5 px-4 font-medium w-16">주차</th>
                    <th className="py-2.5 px-4 font-medium w-20 text-center">수강 완료</th>
                    <th className="py-2.5 px-4 font-medium">강의 주제</th>
                    <th className="py-2.5 px-4 font-medium text-center">+1일 복습</th>
                    <th className="py-2.5 px-4 font-medium text-center">+3일 복습</th>
                    <th className="py-2.5 px-4 font-medium text-center">+7일 복습</th>
                    <th className="py-2.5 px-4 font-medium text-center">+14일 복습</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {selectedCourse.weeklyProgress.map((w) => (
                    <tr key={w.week} className="hover:bg-emerald-50/30">
                      <td className="py-2.5 px-4 font-mono-tabular font-semibold text-slate-700">
                        {w.week}주
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={w.completed}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            updateCourse({
                              ...selectedCourse,
                              weeklyProgress: selectedCourse.weeklyProgress.map((item) =>
                                item.week === w.week
                                  ? {
                                      ...item,
                                      completed: checked,
                                      studiedAt: checked
                                        ? item.studiedAt || formatDateISO(new Date())
                                        : undefined,
                                    }
                                  : item
                              ),
                            });
                          }}
                          className="rounded border-slate-300 text-emerald-600"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={w.topic}
                          onChange={(e) =>
                            updateCourse({
                              ...selectedCourse,
                              weeklyProgress: selectedCourse.weeklyProgress.map((item) =>
                                item.week === w.week
                                  ? { ...item, topic: e.target.value }
                                  : item
                              ),
                            })
                          }
                          className="w-full bg-transparent text-slate-800 focus:outline-none focus:bg-slate-50 px-1.5 py-0.5 rounded"
                        />
                      </td>
                      {(
                        [
                          { key: 'day1', days: 1 },
                          { key: 'day3', days: 3 },
                          { key: 'day7', days: 7 },
                          { key: 'day14', days: 14 },
                        ] as const
                      ).map((cycle) => {
                        const checked = w.reviewChecks[cycle.key];
                        const dateStr = w.studiedAt
                          ? addDaysISO(w.studiedAt, cycle.days).slice(5)
                          : '-';
                        return (
                          <td key={cycle.key} className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={!w.completed}
                              onClick={() =>
                                updateCourse({
                                  ...selectedCourse,
                                  weeklyProgress: selectedCourse.weeklyProgress.map((item) =>
                                    item.week === w.week
                                      ? {
                                          ...item,
                                          reviewChecks: {
                                            ...item.reviewChecks,
                                            [cycle.key]: !checked,
                                          },
                                        }
                                      : item
                                  ),
                                })
                              }
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-mono-tabular text-[11px] disabled:opacity-35 ${
                                checked
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                              <span>{dateStr}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Exam Prep Mode & Study Timer Statistics */}
      {subTab === 'exam' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Exam Prep Panel */}
          <section className="lg:col-span-7 border border-emerald-200/80 rounded-2xl shadow-sm bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                시험 대비 집중 모드
              </h3>
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F3FAF6] border border-emerald-200/70 rounded-xl">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">시험 구분</label>
                    <select
                      value={selectedCourse.examPrep.examType}
                      onChange={(e) =>
                        updateCourse({
                          ...selectedCourse,
                          examPrep: {
                            ...selectedCourse.examPrep,
                            examType: e.target.value as '중간고사' | '기말고사',
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="중간고사">중간고사</option>
                      <option value="기말고사">기말고사</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">시험 날짜</label>
                    <input
                      type="date"
                      value={selectedCourse.examPrep.examDate}
                      onChange={(e) =>
                        updateCourse({
                          ...selectedCourse,
                          examPrep: {
                            ...selectedCourse.examPrep,
                            examDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col justify-center sm:items-end">
                    <span className="text-[11px] text-slate-500">시험 카운트다운</span>
                    <span className="font-mono-tabular text-xl font-bold text-emerald-700">
                      {getDeadlineInfo(`${selectedCourse.examPrep.examDate}T09:00`).dDayLabel}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    시험 범위 설정
                  </label>
                  <textarea
                    rows={2}
                    value={selectedCourse.examPrep.scope}
                    onChange={(e) =>
                      updateCourse({
                        ...selectedCourse,
                        examPrep: { ...selectedCourse.examPrep, scope: e.target.value },
                      })
                    }
                    placeholder="시험에 포함되는 주차, 챕터, 참고 논문을 기록하세요"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-700">
                    예상 문제 및 핵심 개념 체크리스트
                  </div>
                  {selectedCourse.examPrep.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() =>
                            updateCourse({
                              ...selectedCourse,
                              examPrep: {
                                ...selectedCourse.examPrep,
                                checklist: selectedCourse.examPrep.checklist.map((x) =>
                                  x.id === item.id ? { ...x, done: !x.done } : x
                                ),
                              },
                            })
                          }
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        <span className={item.done ? 'line-through text-slate-400' : 'text-slate-800'}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        onClick={() =>
                          updateCourse({
                            ...selectedCourse,
                            examPrep: {
                              ...selectedCourse.examPrep,
                              checklist: selectedCourse.examPrep.checklist.filter(
                                (x) => x.id !== item.id
                              ),
                            },
                          })
                        }
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newExamItem}
                      onChange={(e) => setNewExamItem(e.target.value)}
                      placeholder="예: 기출문제 2024-2학기 서술형 3번 풀이"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newExamItem.trim()) return;
                        updateCourse({
                          ...selectedCourse,
                          examPrep: {
                            ...selectedCourse.examPrep,
                            checklist: [
                              ...selectedCourse.examPrep.checklist,
                              { id: `ec-${Date.now()}`, text: newExamItem.trim(), done: false },
                            ],
                          },
                        });
                        setNewExamItem('');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">과목을 먼저 등록하세요.</p>
            )}
          </section>

          {/* Study Time Statistics */}
          <section className="lg:col-span-5 border border-emerald-200/80 rounded-2xl shadow-sm bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                과목별 누적 학습 시간 통계
              </h3>
              <span className="font-mono-tabular text-xs font-semibold text-emerald-700">
                총{' '}
                {state.pomodoroSessions.reduce((acc, s) => acc + s.minutes, 0)}분
              </span>
            </div>

            <div className="space-y-3">
              {courseStudyTotals.map(({ course, minutes }) => {
                const token = COURSE_COLORS[course.color];
                const pct = Math.round((minutes / maxStudyMins) * 100);
                return (
                  <div key={course.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{course.name}</span>
                      <span className="font-mono-tabular text-slate-600">
                        {Math.floor(minutes / 60)}시간 {minutes % 60}분 ({minutes}분)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: token.bar }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-medium text-slate-700">집중 시간 수동 추가</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={5}
                  max={300}
                  step={5}
                  value={manualLogMins}
                  onChange={(e) => setManualLogMins(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 text-xs font-mono-tabular border border-slate-200 rounded-xl"
                />
                <button
                  type="button"
                  disabled={!selectedCourse}
                  onClick={() =>
                    selectedCourse && logPomodoroManual(selectedCourse.id, manualLogMins)
                  }
                  className="flex-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 disabled:opacity-40"
                >
                  {selectedCourse ? `${selectedCourse.name} +${manualLogMins}분 기록` : '과목 없음'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
