import React, { useMemo, useRef, useState } from 'react';
import {
  Code,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Folder,
  Paperclip,
  Plus,
  Search,
  Sigma,
  SplitSquareHorizontal,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ResourceType, StudyNote } from '../../types/campus';
import { formatDateISO, renderMarkdownToHtml } from '../../utils/calculations';

export const ArchiveView: React.FC = () => {
  const {
    state,
    focusedCourseId,
    addNote,
    updateNote,
    deleteNote,
    addResource,
    deleteResource,
    showToast,
  } = useWorkspace();

  const [selectedFolder, setSelectedFolder] = useState<string>(focusedCourseId || 'all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveTab, setArchiveTab] = useState<'notes' | 'files'>('notes');

  const [activeNoteId, setActiveNoteId] = useState<string>(state.notes[0]?.id || '');
  const [editorLayout, setEditorLayout] = useState<'split' | 'edit' | 'preview'>('split');

  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<ResourceType>('PDF');
  const [resCourseId, setResCourseId] = useState(state.courses[0]?.id || '');
  const [resUrl, setResUrl] = useState('');
  const [resTags, setResTags] = useState('강의안');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    state.notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    state.resources.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [state.notes, state.resources]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.notes.filter((n) => {
      if (selectedFolder !== 'all' && n.courseId !== selectedFolder) return false;
      if (selectedTag !== 'all' && !n.tags.includes(selectedTag)) return false;
      if (
        q &&
        !n.title.toLowerCase().includes(q) &&
        !n.content.toLowerCase().includes(q) &&
        !n.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [state.notes, selectedFolder, selectedTag, searchQuery]);

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.resources.filter((r) => {
      if (selectedFolder !== 'all' && r.courseId !== selectedFolder) return false;
      if (selectedTag !== 'all' && !r.tags.includes(selectedTag)) return false;
      if (
        q &&
        !r.title.toLowerCase().includes(q) &&
        !r.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [state.resources, selectedFolder, selectedTag, searchQuery]);

  const activeNote: StudyNote | null =
    filteredNotes.find((n) => n.id === activeNoteId) || filteredNotes[0] || null;

  const renderedHtml = useMemo(
    () => (activeNote ? renderMarkdownToHtml(activeNote.content) : ''),
    [activeNote?.content]
  );

  const handleCreateNote = () => {
    const courseId =
      selectedFolder !== 'all' ? selectedFolder : state.courses[0]?.id || '';
    const newNote: StudyNote = {
      id: `nt-${Date.now()}`,
      courseId,
      title: '새 전공 필기 노트',
      tags: ['핵심개념'],
      updatedAt: formatDateISO(new Date()),
      content: `# 새 강의 노트\n\n## 핵심 정리\n- 내용을 입력하세요.\n\n$$E = mc^2$$`,
    };
    addNote(newNote);
    setActiveNoteId(newNote.id);
    setArchiveTab('notes');
    showToast('새 마크다운 노트가 생성되었습니다.', 'success');
  };

  const insertSnippet = (snippet: string) => {
    if (!activeNote) return;
    updateNote({
      ...activeNote,
      content: `${activeNote.content}\n${snippet}`,
      updatedAt: formatDateISO(new Date()),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl =
        typeof reader.result === 'string' && file.size < 1024 * 1024 * 1.5
          ? reader.result
          : undefined;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const inferredType: ResourceType = ext.includes('ppt')
        ? 'PPT'
        : ext.includes('pdf')
        ? 'PDF'
        : '기타';
      addResource({
        id: `rs-${Date.now()}`,
        courseId:
          selectedFolder !== 'all'
            ? selectedFolder
            : resCourseId || state.courses[0]?.id || '',
        title: file.name,
        resourceType: inferredType,
        fileName: file.name,
        fileSize: `${sizeMB} MB`,
        dataUrl,
        tags: resTags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean),
        createdAt: formatDateISO(new Date()),
      });
      showToast(`${file.name} 파일이 자료실에 등록되었습니다.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAddLinkResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim()) return;
    addResource({
      id: `rs-${Date.now()}`,
      courseId:
        selectedFolder !== 'all'
          ? selectedFolder
          : resCourseId || state.courses[0]?.id || '',
      title: resTitle.trim(),
      resourceType: resType,
      url: resUrl.trim() || undefined,
      tags: resTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      createdAt: formatDateISO(new Date()),
    });
    setResTitle('');
    setResUrl('');
    showToast('강의 자료/링크가 아카이브에 추가되었습니다.', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Top Search & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="노트 제목, 본문, 파일명, #태그 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-emerald-200/80 rounded-xl shadow-xs focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-emerald-200/80 rounded-xl shadow-xs">
            <button
              onClick={() => setArchiveTab('notes')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                archiveTab === 'notes'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              마크다운 노트 ({filteredNotes.length})
            </button>
            <button
              onClick={() => setArchiveTab('files')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                archiveTab === 'files'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              강의안 · 링크 ({filteredResources.length})
            </button>
          </div>
          <button
            onClick={handleCreateNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl shadow-xs hover:bg-emerald-800 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 노트</span>
          </button>
        </div>
      </div>

      {/* Main 3-Zone Card Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Folder & Tag Card */}
        <aside className="lg:col-span-3 border border-emerald-200/80 rounded-2xl shadow-sm bg-white p-4 space-y-5">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-2 px-1">
              과목별 아카이브 폴더
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedFolder === 'all'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-3.5 h-3.5" />
                  <span>전체 과목</span>
                </span>
                <span className="font-mono-tabular text-[11px] opacity-75">
                  {state.notes.length + state.resources.length}
                </span>
              </button>
              {state.courses.map((c) => {
                const count =
                  state.notes.filter((n) => n.courseId === c.id).length +
                  state.resources.filter((r) => r.courseId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedFolder(c.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedFolder === c.id
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-mono-tabular text-[11px] opacity-75 shrink-0 ml-1">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 px-1">
              태그 필터
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2 py-1 text-[11px] font-medium rounded-lg border ${
                  selectedTag === 'all'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                전체
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-lg border ${
                    selectedTag === tag
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Workspace */}
        <div className="lg:col-span-9 space-y-4">
          {archiveTab === 'notes' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* Note Cards Stack */}
              <div className="xl:col-span-4 space-y-2.5 max-h-[680px] overflow-y-auto pr-0.5">
                {filteredNotes.length === 0 ? (
                  <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm py-12 px-4 text-center text-xs text-slate-500">
                    조건에 맞는 노트가 없습니다.
                  </div>
                ) : (
                  filteredNotes.map((n) => {
                    const course = state.courses.find((c) => c.id === n.courseId);
                    const isSelected = activeNote?.id === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => setActiveNoteId(n.id)}
                        className={`w-full text-left p-4 rounded-2xl border shadow-sm transition-colors ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white border-emerald-200/80 hover:border-emerald-300'
                        }`}
                      >
                        <div
                          className={`text-[11px] flex items-center justify-between gap-2 mb-1 ${
                            isSelected ? 'text-emerald-100' : 'text-slate-500'
                          }`}
                        >
                          <span className="truncate">{course?.name || '미분류'}</span>
                          <span className="font-mono-tabular shrink-0">{n.updatedAt}</span>
                        </div>
                        <div
                          className={`text-xs font-semibold line-clamp-2 ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {n.title}
                        </div>
                        {n.tags.length > 0 && (
                          <div
                            className={`text-[11px] mt-1.5 truncate ${
                              isSelected ? 'text-emerald-100' : 'text-emerald-700'
                            }`}
                          >
                            {n.tags.map((t) => `#${t}`).join(' ')}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Note Markdown + LaTeX Split Editor Card */}
              <div className="xl:col-span-8 border border-emerald-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
                {!activeNote ? (
                  <div className="py-20 text-center space-y-3">
                    <p className="text-sm text-slate-500">선택된 노트가 없습니다.</p>
                    <button
                      onClick={handleCreateNote}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
                    >
                      첫 마크다운 노트 만들기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-slate-100 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={activeNote.title}
                          onChange={(e) =>
                            updateNote({
                              ...activeNote,
                              title: e.target.value,
                              updatedAt: formatDateISO(new Date()),
                            })
                          }
                          className="flex-1 font-display text-base font-bold text-slate-900 focus:outline-none focus:bg-slate-50 px-1.5 py-1 rounded-lg"
                        />
                        <button
                          onClick={() => {
                            deleteNote(activeNote.id);
                            showToast('노트가 삭제되었습니다.', 'info');
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          title="노트 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={activeNote.courseId}
                            onChange={(e) =>
                              updateNote({ ...activeNote, courseId: e.target.value })
                            }
                            className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-slate-700"
                          >
                            {state.courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={activeNote.tags.join(', ')}
                            onChange={(e) =>
                              updateNote({
                                ...activeNote,
                                tags: e.target.value
                                  .split(',')
                                  .map((t) => t.trim().replace(/^#/, ''))
                                  .filter(Boolean),
                              })
                            }
                            placeholder="태그 (쉼표 구분)"
                            className="px-2.5 py-1 border border-slate-200 rounded-lg text-emerald-800 w-48"
                          />
                        </div>

                        <div className="flex items-center gap-1 p-0.5 bg-emerald-50 border border-emerald-200/70 rounded-xl">
                          {[
                            { id: 'split' as const, label: '분할', icon: SplitSquareHorizontal },
                            { id: 'edit' as const, label: '작성', icon: FileText },
                            { id: 'preview' as const, label: '미리보기', icon: Eye },
                          ].map((m) => {
                            const Icon = m.icon;
                            return (
                              <button
                                key={m.id}
                                onClick={() => setEditorLayout(m.id)}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg ${
                                  editorLayout === m.id
                                    ? 'bg-white text-emerald-900 shadow-xs'
                                    : 'text-slate-600'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                <span>{m.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {editorLayout !== 'preview' && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => insertSnippet('$$\\sum_{i=1}^{n} x_i$$')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F3FAF6] border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-900"
                          >
                            <Sigma className="w-3 h-3" />
                            <span>수식 블록</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              insertSnippet('```python\ndef solve():\n    pass\n```')
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F3FAF6] border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-900"
                          >
                            <Code className="w-3 h-3" />
                            <span>코드 블록</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertSnippet('- [ ] 복습 체크 항목')}
                            className="px-2.5 py-1 bg-[#F3FAF6] border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-900"
                          >
                            체크리스트
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              insertSnippet('| 항목 | 설명 |\n| --- | --- |\n| 내용 | 요약 |')
                            }
                            className="px-2.5 py-1 bg-[#F3FAF6] border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-900"
                          >
                            표 삽입
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className={`grid ${
                        editorLayout === 'split'
                          ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200'
                          : 'grid-cols-1'
                      }`}
                    >
                      {editorLayout !== 'preview' && (
                        <textarea
                          value={activeNote.content}
                          onChange={(e) =>
                            updateNote({
                              ...activeNote,
                              content: e.target.value,
                              updatedAt: formatDateISO(new Date()),
                            })
                          }
                          className="w-full min-h-[480px] p-4 text-xs font-mono leading-relaxed text-slate-800 bg-[#F8FCFA] focus:outline-none resize-none"
                          placeholder="마크다운, $수식$, ```코드```를 입력하세요..."
                        />
                      )}
                      {editorLayout !== 'edit' && (
                        <div
                          className="p-5 min-h-[480px] max-h-[600px] overflow-y-auto editorial-prose"
                          dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Resources & Files Card Grid */
            <div className="space-y-4">
              <form
                onSubmit={handleAddLinkResource}
                className="border border-emerald-200/80 rounded-2xl shadow-sm bg-white p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    강의안(PDF · PPT) 업로드 또는 참고 논문 · 링크 아카이빙
                  </span>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>로컬 파일 첨부</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <select
                    value={selectedFolder !== 'all' ? selectedFolder : resCourseId}
                    onChange={(e) => setResCourseId(e.target.value)}
                    disabled={selectedFolder !== 'all'}
                    className="sm:col-span-3 px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl disabled:bg-slate-50"
                  >
                    {state.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as ResourceType)}
                    className="sm:col-span-2 px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PPT">PPT</option>
                    <option value="논문/링크">논문/링크</option>
                    <option value="기타">기타</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="자료 제목 (예: Attention Is All You Need 논문)"
                    className="sm:col-span-4 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                  <input
                    type="text"
                    value={resTags}
                    onChange={(e) => setResTags(e.target.value)}
                    placeholder="태그 (쉼표 구분)"
                    className="sm:col-span-3 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                  <input
                    type="url"
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    placeholder="참고 URL (https://...)"
                    className="sm:col-span-10 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
                  >
                    링크 저장
                  </button>
                </div>
              </form>

              {filteredResources.length === 0 ? (
                <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm py-12 text-center text-xs text-slate-500">
                  등록된 강의안이나 참고 링크가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResources.map((r) => {
                    const course = state.courses.find((c) => c.id === r.courseId);
                    return (
                      <div
                        key={r.id}
                        className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 flex flex-col justify-between gap-3 hover:border-emerald-300 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span className="font-semibold text-emerald-700">
                              {r.resourceType}
                            </span>
                            <span>·</span>
                            <span>{course?.name || '미분류'}</span>
                            {r.fileSize && (
                              <>
                                <span>·</span>
                                <span className="font-mono-tabular">{r.fileSize}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="font-mono-tabular">{r.createdAt}</span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900 truncate mt-1">
                            {r.title}
                          </div>
                          {r.tags.length > 0 && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              {r.tags.map((t) => `#${t}`).join(' ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          {r.dataUrl && (
                            <a
                              href={r.dataUrl}
                              download={r.fileName || r.title}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>다운로드</span>
                            </a>
                          )}
                          {r.url && (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>열기</span>
                            </a>
                          )}
                          <button
                            onClick={() => deleteResource(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                            aria-label="자료 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
