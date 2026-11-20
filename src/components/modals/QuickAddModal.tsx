import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AcademicEventType, PriorityLevel } from '../../types/campus';
import { addDaysISO, formatDateISO } from '../../utils/calculations';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ open, onClose }) => {
  const {
    state,
    addAssignment,
    addNote,
    addAcademicEvent,
    setActiveTab,
    setFocusedCourseId,
    showToast,
  } = useWorkspace();

  const [mode, setMode] = useState<'assignment' | 'note' | 'event'>('assignment');
  const todayStr = formatDateISO(new Date());

  // Assignment form
  const [asCourseId, setAsCourseId] = useState(state.courses[0]?.id || '');
  const [asTitle, setAsTitle] = useState('');
  const [asDesc, setAsDesc] = useState('');
  const [asDue, setAsDue] = useState(`${addDaysISO(todayStr, 2)}T23:59`);
  const [asPriority, setAsPriority] = useState<PriorityLevel>('보통');

  // Note form
  const [ntCourseId, setNtCourseId] = useState(state.courses[0]?.id || '');
  const [ntTitle, setNtTitle] = useState('');
  const [ntTags, setNtTags] = useState('핵심개념');
  const [ntContent, setNtContent] = useState('# 강의 요약\n\n- 핵심 개념 정리\n\n$$f(x) = \\sum_{i=1}^{n} x_i$$');

  // Event form
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState(addDaysISO(todayStr, 3));
  const [evType, setEvType] = useState<AcademicEventType>('학사일정');
  const [evCourseId, setEvCourseId] = useState('');
  const [evMemo, setEvMemo] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'assignment') {
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
      showToast('새 과제가 등록되었습니다.', 'success');
      setAsTitle('');
      setAsDesc('');
      onClose();
    } else if (mode === 'note') {
      if (!ntTitle.trim()) return;
      const cid = ntCourseId || state.courses[0]?.id || '';
      addNote({
        id: `nt-${Date.now()}`,
        courseId: cid,
        title: ntTitle.trim(),
        content: ntContent,
        tags: ntTags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
        updatedAt: todayStr,
      });
      showToast('새 전공 노트가 자료실에 저장되었습니다.', 'success');
      setFocusedCourseId(cid);
      setActiveTab('archive');
      setNtTitle('');
      onClose();
    } else {
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
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[1px]">
      <div className="w-full max-w-lg bg-white border border-emerald-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
          <h2 className="font-display text-base font-semibold text-slate-900">빠른 등록</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Segmented Control */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 bg-emerald-50/80 border border-emerald-100 rounded-xl">
            {[
              { id: 'assignment' as const, label: '과제 등록' },
              { id: 'note' as const, label: '전공 노트' },
              { id: 'event' as const, label: '학사 일정' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'assignment' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">과목</label>
                <select
                  value={asCourseId}
                  onChange={(e) => setAsCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
                >
                  {state.courses.length === 0 && <option value="">등록된 과목 없음</option>}
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">과제 제목</label>
                <input
                  type="text"
                  required
                  value={asTitle}
                  onChange={(e) => setAsTitle(e.target.value)}
                  placeholder="예: 5주차 실습 보고서 제출"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">마감 일시</label>
                  <input
                    type="datetime-local"
                    value={asDue}
                    onChange={(e) => setAsDue(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">우선순위</label>
                  <select
                    value={asPriority}
                    onChange={(e) => setAsPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="높음">높음</option>
                    <option value="보통">보통</option>
                    <option value="낮음">낮음</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">세부 내용</label>
                <textarea
                  rows={2}
                  value={asDesc}
                  onChange={(e) => setAsDesc(e.target.value)}
                  placeholder="제출 양식, 분량 등 메모"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </>
          )}

          {mode === 'note' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">과목 폴더</label>
                <select
                  value={ntCourseId}
                  onChange={(e) => setNtCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
                >
                  {state.courses.length === 0 && <option value="">미분류</option>}
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">노트 제목</label>
                <input
                  type="text"
                  required
                  value={ntTitle}
                  onChange={(e) => setNtTitle(e.target.value)}
                  placeholder="예: B+ 트리 삽입/삭제 규칙 정리"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={ntTags}
                  onChange={(e) => setNtTags(e.target.value)}
                  placeholder="중간고사, 핵심개념, 레퍼런스"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  마크다운 초안
                </label>
                <textarea
                  rows={4}
                  value={ntContent}
                  onChange={(e) => setNtContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </>
          )}

          {mode === 'event' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">일정명</label>
                <input
                  type="text"
                  required
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="예: 중간고사 기간 / 운영체제 휴강"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">날짜</label>
                  <input
                    type="date"
                    value={evDate}
                    onChange={(e) => setEvDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">구분</label>
                  <select
                    value={evType}
                    onChange={(e) => setEvType(e.target.value as AcademicEventType)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="학사일정">학사일정</option>
                    <option value="수강신청">수강신청</option>
                    <option value="중간고사">중간고사</option>
                    <option value="기말고사">기말고사</option>
                    <option value="휴강">휴강</option>
                    <option value="보강">보강</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  연결 과목 (선택)
                </label>
                <select
                  value={evCourseId}
                  onChange={(e) => setEvCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="">전체 학사 일정</option>
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">메모</label>
                <input
                  type="text"
                  value={evMemo}
                  onChange={(e) => setEvMemo(e.target.value)}
                  placeholder="장소, 시간 등 안내 사항"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
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
  );
};
