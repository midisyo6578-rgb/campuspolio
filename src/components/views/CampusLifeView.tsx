import React, { useState } from 'react';
import {
  Bookmark,
  BookOpenCheck,
  CalendarPlus,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Utensils,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ActivityCategory, PersonalMemoCategory } from '../../types/campus';
import { addDaysISO, formatDateISO, getDeadlineInfo } from '../../utils/calculations';

export const CampusLifeView: React.FC = () => {
  const {
    state,
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
    showToast,
  } = useWorkspace();

  const [linkName, setLinkName] = useState('');
  const [linkCat, setLinkCat] = useState('학사행정');
  const [linkUrl, setLinkUrl] = useState('');

  const [libName, setLibName] = useState('');
  const [libTotalSeats, setLibTotalSeats] = useState(120);
  const [libOccupiedSeats, setLibOccupiedSeats] = useState(40);

  const [cafHall, setCafHall] = useState('');
  const [cafMeal, setCafMeal] = useState<'중식' | '석식'>('중식');
  const [cafItems, setCafItems] = useState('');
  const [cafPrice, setCafPrice] = useState('6,000원');

  const [actFilter, setActFilter] = useState<'전체' | ActivityCategory | '스크랩'>('전체');
  const [actTitle, setActTitle] = useState('');
  const [actCat, setActCat] = useState<ActivityCategory>('장학금');
  const [actOrg, setActOrg] = useState('');
  const [actDeadline, setActDeadline] = useState(() =>
    addDaysISO(formatDateISO(new Date()), 7)
  );
  const [actMemo, setActMemo] = useState('');

  const [memoTab, setMemoTab] = useState<'전체' | PersonalMemoCategory>('전체');
  const [memoCat, setMemoCat] = useState<PersonalMemoCategory>('동아리');
  const [memoTitle, setMemoTitle] = useState('');
  const [memoDate, setMemoDate] = useState('');
  const [memoContent, setMemoContent] = useState('');

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName.trim() || !linkUrl.trim()) return;
    addCampusLink({
      id: `lk-${Date.now()}`,
      name: linkName.trim(),
      category: linkCat.trim() || '기타',
      url: linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`,
      description: '사용자 등록 바로가기',
    });
    setLinkName('');
    setLinkUrl('');
    showToast('캠퍼스 Quick 링크가 추가되었습니다.', 'success');
  };

  const handleAddLibraryRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!libName.trim() || libTotalSeats <= 0) return;
    const occupied = Math.max(0, Math.min(libTotalSeats, libOccupiedSeats));
    addLibraryRoom({
      id: `lib-${Date.now()}`,
      name: libName.trim(),
      totalSeats: libTotalSeats,
      occupiedSeats: occupied,
      updatedAt: '방금 전',
    });
    setLibName('');
    showToast('열람실이 등록되었습니다.', 'success');
  };

  const handleRefreshLibrary = () => {
    if (state.libraryRooms.length === 0) return;
    state.libraryRooms.forEach((room) => {
      const delta = Math.floor(Math.random() * 11) - 5;
      const nextOccupied = Math.max(
        0,
        Math.min(room.totalSeats, room.occupiedSeats + delta)
      );
      updateLibraryRoom({
        ...room,
        occupiedSeats: nextOccupied,
        updatedAt: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    });
    showToast('열람실 잔여 좌석 현황을 갱신했습니다.', 'info');
  };

  const handleAddCafeteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafHall.trim() || !cafItems.trim()) return;
    addCafeteriaMenu({
      id: `caf-${Date.now()}`,
      hall: cafHall.trim(),
      mealType: cafMeal,
      menu: cafItems
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      price: cafPrice.trim() || '6,000원',
    });
    setCafHall('');
    setCafItems('');
    showToast('학식 메뉴가 추가되었습니다.', 'success');
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim()) return;
    addCampusActivity({
      id: `act-${Date.now()}`,
      title: actTitle.trim(),
      category: actCat,
      deadline: actDeadline,
      organization: actOrg.trim() || '교내 기관',
      bookmarked: true,
      applied: false,
      memo: actMemo.trim(),
    });
    setActTitle('');
    setActOrg('');
    setActMemo('');
    showToast('대외활동/장학금 일정이 스크랩되었습니다.', 'success');
  };

  const handleAddPersonalMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoTitle.trim()) return;
    addPersonalMemo({
      id: `pm-${Date.now()}`,
      category: memoCat,
      title: memoTitle.trim(),
      date: memoDate || undefined,
      content: memoContent.trim(),
      done: false,
    });
    setMemoTitle('');
    setMemoContent('');
    showToast('개인 일정 메모가 저장되었습니다.', 'success');
  };

  const filteredActivities = state.campusActivities
    .filter((a) => {
      if (actFilter === '전체') return true;
      if (actFilter === '스크랩') return a.bookmarked;
      return a.category === actFilter;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const filteredMemos = state.personalMemos.filter(
    (m) => memoTab === '전체' || m.category === memoTab
  );

  return (
    <div className="space-y-8">
      {/* Row 1: Campus Quick Link Cards */}
      <section className="space-y-3">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            캠퍼스 Quick 링크
          </h3>
          <p className="text-xs text-emerald-900/70 mt-0.5">
            학교 포털, LMS, 중앙도서관, 학사공지 바로가기 카드
          </p>
        </div>

        {state.campusLinks.length === 0 ? (
          <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-6 text-center text-xs text-slate-500">
            등록된 캠퍼스 바로가기 링크가 없습니다. 아래에서 자주 사용하는 링크를 직접 등록하세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {state.campusLinks.map((lk) => (
              <div
                key={lk.id}
                className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 flex flex-col justify-between hover:border-emerald-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1.5">
                    <span className="font-medium text-emerald-700">{lk.category}</span>
                    <button
                      onClick={() => deleteCampusLink(lk.id)}
                      className="text-slate-300 hover:text-red-600"
                      aria-label="링크 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <a
                    href={lk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-slate-900 hover:text-emerald-700 inline-flex items-center gap-1"
                  >
                    <span>{lk.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <p className="text-xs text-slate-500 mt-1">{lk.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleAddLink}
          className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
        >
          <input
            type="text"
            required
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="사이트명 (예: 총학생회 공지)"
            className="sm:col-span-3 px-3 py-2 text-xs border border-slate-200 rounded-xl"
          />
          <input
            type="text"
            value={linkCat}
            onChange={(e) => setLinkCat(e.target.value)}
            placeholder="분류"
            className="sm:col-span-2 px-3 py-2 text-xs border border-slate-200 rounded-xl"
          />
          <input
            type="text"
            required
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URL (https://...)"
            className="sm:col-span-5 px-3 py-2 text-xs border border-slate-200 rounded-xl"
          />
          <button
            type="submit"
            className="sm:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
          >
            링크 추가
          </button>
        </form>
      </section>

      {/* Row 2: Library Seat Cards & Cafeteria Menu Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Library Seats */}
        <section className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="font-display text-base font-semibold text-slate-900">
                중앙도서관 열람실 좌석 현황
              </h3>
            </div>
            <button
              onClick={handleRefreshLibrary}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-white border border-emerald-200/80 rounded-xl shadow-xs hover:bg-emerald-50"
            >
              <RefreshCw className="w-3 h-3" />
              <span>좌석 새로고침</span>
            </button>
          </div>

          <div className="space-y-3">
            {state.libraryRooms.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-6 text-center text-xs text-slate-500">
                등록된 열람실이 없습니다. 아래에서 열람실을 직접 추가하세요.
              </div>
            ) : (
              state.libraryRooms.map((room) => {
                const available = room.totalSeats - room.occupiedSeats;
                const pct = Math.round((room.occupiedSeats / room.totalSeats) * 100);
                const color =
                  pct >= 85 ? '#DC2626' : pct >= 65 ? '#D97706' : '#059669';
                return (
                  <div
                    key={room.id}
                    className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900">{room.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular">
                          <span className="font-semibold text-emerald-800">잔여 {available}석</span>
                          <span className="text-slate-400">
                            {' '}
                            ({room.occupiedSeats}/{room.totalSeats} · {pct}%)
                          </span>
                        </span>
                        <button
                          onClick={() => deleteLibraryRoom(room.id)}
                          className="text-slate-300 hover:text-red-600"
                          aria-label="열람실 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleAddLibraryRoom}
            className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 grid grid-cols-12 gap-2 text-xs"
          >
            <input
              type="text"
              required
              value={libName}
              onChange={(e) => setLibName(e.target.value)}
              placeholder="열람실명 (예: 제1열람실)"
              className="col-span-5 px-2.5 py-2 border border-slate-200 rounded-xl"
            />
            <input
              type="number"
              min={1}
              value={libTotalSeats}
              onChange={(e) => setLibTotalSeats(Number(e.target.value))}
              placeholder="총 좌석"
              className="col-span-2 px-2 py-2 border border-slate-200 rounded-xl font-mono-tabular"
            />
            <input
              type="number"
              min={0}
              value={libOccupiedSeats}
              onChange={(e) => setLibOccupiedSeats(Number(e.target.value))}
              placeholder="사용 중"
              className="col-span-2 px-2 py-2 border border-slate-200 rounded-xl font-mono-tabular"
            />
            <button
              type="submit"
              className="col-span-3 py-2 font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
            >
              열람실 추가
            </button>
          </form>
        </section>

        {/* Cafeteria Menus */}
        <section className="lg:col-span-6 space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-700" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              오늘의 학식 메뉴
            </h3>
          </div>

          <div className="space-y-3">
            {state.cafeteriaMenus.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-6 text-center text-xs text-slate-500">
                등록된 학식 식단이 없습니다.
              </div>
            ) : (
              state.cafeteriaMenus.map((caf) => (
                <div
                  key={caf.id}
                  className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">
                      {caf.hall} · {caf.mealType}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular font-semibold text-emerald-700">
                        {caf.price}
                      </span>
                      <button
                        onClick={() => deleteCafeteriaMenu(caf.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-600">{caf.menu.join(' · ')}</div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleAddCafeteria}
            className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 grid grid-cols-12 gap-2 text-xs"
          >
            <input
              type="text"
              value={cafHall}
              onChange={(e) => setCafHall(e.target.value)}
              placeholder="식당명"
              className="col-span-4 px-2.5 py-1.5 border border-slate-200 rounded-xl"
            />
            <select
              value={cafMeal}
              onChange={(e) => setCafMeal(e.target.value as '중식' | '석식')}
              className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-xl bg-white"
            >
              <option value="중식">중식</option>
              <option value="석식">석식</option>
            </select>
            <input
              type="text"
              value={cafPrice}
              onChange={(e) => setCafPrice(e.target.value)}
              placeholder="가격"
              className="col-span-3 px-2.5 py-1.5 border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              className="col-span-3 px-2.5 py-1.5 font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
            >
              식단 추가
            </button>
            <input
              type="text"
              value={cafItems}
              onChange={(e) => setCafItems(e.target.value)}
              placeholder="메뉴 (쉼표로 구분: 치즈돈까스, 우동, 샐러드)"
              className="col-span-12 px-2.5 py-1.5 border border-slate-200 rounded-xl"
            />
          </form>
        </section>
      </div>

      {/* Row 3: Scholarship/Extracurricular Calendar Cards & Personal Memo Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-emerald-700" />
              <h3 className="font-display text-base font-semibold text-slate-900">
                대외활동 · 장학금 · 비교과 스크랩
              </h3>
            </div>
            <div className="flex items-center gap-1 p-1 bg-white border border-emerald-200/80 rounded-xl shadow-xs flex-wrap">
              {(['전체', '스크랩', '장학금', '비교과', '대외활동'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActFilter(f)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg ${
                    actFilter === f
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleAddActivity}
            className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs"
          >
            <input
              type="text"
              required
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
              placeholder="장학금/공모전/비교과 프로그램명"
              className="sm:col-span-5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
            />
            <select
              value={actCat}
              onChange={(e) => setActCat(e.target.value as ActivityCategory)}
              className="sm:col-span-2 px-2 py-1.5 bg-white border border-slate-200 rounded-xl"
            >
              <option value="장학금">장학금</option>
              <option value="비교과">비교과</option>
              <option value="대외활동">대외활동</option>
              <option value="교내공지">교내공지</option>
            </select>
            <input
              type="date"
              value={actDeadline}
              onChange={(e) => setActDeadline(e.target.value)}
              className="sm:col-span-3 px-2 py-1.5 font-mono-tabular bg-white border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-3 py-1.5 font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
            >
              스크랩
            </button>
            <input
              type="text"
              value={actOrg}
              onChange={(e) => setActOrg(e.target.value)}
              placeholder="주관 기관"
              className="sm:col-span-4 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              value={actMemo}
              onChange={(e) => setActMemo(e.target.value)}
              placeholder="지원 자격 및 준비 서류 메모"
              className="sm:col-span-8 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
            />
          </form>

          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm py-8 text-center text-xs text-slate-500">
                등록된 일정이 없습니다.
              </div>
            ) : (
              filteredActivities.map((act) => {
                const info = getDeadlineInfo(`${act.deadline}T23:59`);
                return (
                  <div
                    key={act.id}
                    className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 flex items-start justify-between gap-3 text-xs hover:border-emerald-300"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono-tabular font-semibold text-emerald-700">
                          {info.dDayLabel}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-slate-700">{act.category}</span>
                        <span>·</span>
                        <span>{act.organization}</span>
                        <span>·</span>
                        <span className="font-mono-tabular">{act.deadline}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">
                        {act.title}
                      </div>
                      {act.memo && (
                        <p className="text-xs text-slate-500 mt-1">{act.memo}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          updateCampusActivity({ ...act, applied: !act.applied })
                        }
                        className={`px-2.5 py-1 rounded-lg border font-medium ${
                          act.applied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {act.applied ? '지원완료' : '미지원'}
                      </button>
                      <button
                        onClick={() =>
                          updateCampusActivity({ ...act, bookmarked: !act.bookmarked })
                        }
                        className={`p-1.5 rounded-lg border ${
                          act.bookmarked
                            ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
                            : 'text-slate-400 border-slate-200'
                        }`}
                        title="스크랩 토글"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCampusActivity(act.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Personal Memo Pad Cards */}
        <section className="lg:col-span-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-slate-900">
              개인 메모장 (동아리 · 알바 · 약속)
            </h3>
            <div className="flex items-center gap-1 p-0.5 bg-white border border-emerald-200/80 rounded-xl shadow-xs">
              {(['전체', '동아리', '아르바이트', '개인약속'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMemoTab(t)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-lg ${
                    memoTab === t
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleAddPersonalMemo}
            className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-4 space-y-2 text-xs"
          >
            <div className="grid grid-cols-12 gap-2">
              <select
                value={memoCat}
                onChange={(e) => setMemoCat(e.target.value as PersonalMemoCategory)}
                className="col-span-4 px-2 py-1.5 border border-slate-200 rounded-xl bg-white"
              >
                <option value="동아리">동아리</option>
                <option value="아르바이트">아르바이트</option>
                <option value="개인약속">개인약속</option>
              </select>
              <input
                type="date"
                value={memoDate}
                onChange={(e) => setMemoDate(e.target.value)}
                className="col-span-5 px-2 py-1.5 font-mono-tabular border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                className="col-span-3 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
              placeholder="일정/메모 제목"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="세부 내용 (장소, 시간 등)"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
            />
          </form>

          <div className="space-y-2.5">
            {filteredMemos.length === 0 ? (
              <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm py-6 text-center text-xs text-slate-400">
                등록된 개인 메모가 없습니다.
              </div>
            ) : (
              filteredMemos.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-3.5 flex items-start justify-between gap-2 text-xs"
                >
                  <label className="flex items-start gap-2.5 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={m.done}
                      onChange={() => updatePersonalMemo({ ...m, done: !m.done })}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-emerald-700">{m.category}</span>
                        {m.date && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span className="font-mono-tabular">{m.date}</span>
                          </>
                        )}
                      </div>
                      <div
                        className={`font-semibold mt-0.5 ${
                          m.done ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {m.title}
                      </div>
                      {m.content && (
                        <div className="text-slate-500 mt-0.5">{m.content}</div>
                      )}
                    </div>
                  </label>
                  <button
                    onClick={() => deletePersonalMemo(m.id)}
                    className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
