import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  FolderArchive,
  GraduationCap,
  MapPin,
  Plus,
  User,
} from 'lucide-react';
import {
  Assignment,
  Course,
  CourseCategory,
  CourseResource,
  StudyNote,
} from '../../types/campus';
import {
  COURSE_COLORS,
  calculateCourseWeightedScore,
  formatTimeRange,
  scoreToGrade,
} from '../../utils/calculations';

interface EnrolledCourseCardsProps {
  semesterName: string;
  courses: Course[];
  assignments: Assignment[];
  notes: StudyNote[];
  resources: CourseResource[];
  onSelectCourse: (course: Course) => void;
  onCreateCourse: () => void;
  onOpenArchive: (courseId: string) => void;
  onOpenStudy: (courseId: string) => void;
}

export const EnrolledCourseCards: React.FC<EnrolledCourseCardsProps> = ({
  semesterName,
  courses,
  assignments,
  notes,
  resources,
  onSelectCourse,
  onCreateCourse,
  onOpenArchive,
  onOpenStudy,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'전체' | CourseCategory>('전체');

  const summary = useMemo(() => {
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const reqCredits = courses
      .filter((c) => c.category === '전필')
      .reduce((sum, c) => sum + c.credits, 0);
    const elecCredits = courses
      .filter((c) => c.category === '전선')
      .reduce((sum, c) => sum + c.credits, 0);
    const genCredits = courses
      .filter((c) => c.category === '교양')
      .reduce((sum, c) => sum + c.credits, 0);
    const weeklyHours = courses.reduce(
      (sum, c) =>
        sum + c.slots.reduce((s, slot) => s + Math.max(0, slot.endHour - slot.startHour), 0),
      0
    );

    return {
      totalCredits,
      reqCredits,
      elecCredits,
      genCredits,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (categoryFilter === '전체') return courses;
    return courses.filter((c) => c.category === categoryFilter);
  }, [courses, categoryFilter]);

  return (
    <section className="space-y-4">
      {/* Department & Semester Summary Header Card */}
      <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-700">
                휴먼서비스대학 · 치매재활학과 · 1학년 2학기
              </div>
              <h2 className="font-display text-base font-bold text-slate-900 mt-0.5">
                {semesterName} 수강과목 카드 보드
              </h2>
              <div className="text-xs text-slate-500 font-mono-tabular mt-1">
                총 {courses.length}과목 · {summary.totalCredits}학점
                <span className="mx-1.5 text-slate-300">·</span>
                전필 {summary.reqCredits} · 전선 {summary.elecCredits} · 교양 {summary.genCredits}
                <span className="mx-1.5 text-slate-300">·</span>
                주 {summary.weeklyHours}시간 수업
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 bg-[#F3FAF6] border border-emerald-200/80 rounded-xl">
              {(['전체', '전필', '전선', '교양'] as const).map((cat) => {
                const count =
                  cat === '전체'
                    ? courses.length
                    : courses.filter((c) => c.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onCreateCourse}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>과목 추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm py-12 px-6 text-center space-y-3">
          <p className="text-sm text-slate-500">
            {courses.length === 0
              ? '등록된 수강과목이 없습니다. 직접 수강과목을 등록해 주세요.'
              : `'${categoryFilter}' 이수구분에 해당하는 과목이 없습니다.`}
          </p>
          {courses.length === 0 && (
            <button
              type="button"
              onClick={onCreateCourse}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>수강과목 직접 등록하기</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const token = COURSE_COLORS[course.color];
            const completedWeeks = course.weeklyProgress.filter((w) => w.completed).length;
            const totalWeeks = Math.max(1, course.weeklyProgress.length);
            const progressPct = Math.round((completedWeeks / totalWeeks) * 100);
            const weightedScore = calculateCourseWeightedScore(course.gradeConfig);
            const grade = scoreToGrade(weightedScore);

            const pendingAssignments = assignments.filter(
              (a) => a.courseId === course.id && a.status !== '제출완료'
            ).length;
            const archiveCount =
              notes.filter((n) => n.courseId === course.id).length +
              resources.filter((r) => r.courseId === course.id).length;

            return (
              <article
                key={course.id}
                className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header */}
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course)}
                    className={`w-full text-left px-5 py-4 ${token.bg} border-b ${token.border} hover:brightness-[0.98] transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 font-mono-tabular font-semibold text-slate-600">
                        <span className={`w-2.5 h-2.5 rounded-full ${token.dot}`} />
                        <span>{course.code}</span>
                      </span>
                      <span className={`font-semibold ${token.text}`}>
                        {course.category} · {course.credits}학점
                      </span>
                    </div>
                    <h3 className={`font-display text-base font-bold mt-1.5 ${token.text}`}>
                      {course.name}
                    </h3>
                  </button>

                  {/* Card Body */}
                  <div className="p-5 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-2.5 text-slate-600">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-emerald-700/75 shrink-0" />
                        <span className="truncate font-medium text-slate-800">
                          {course.professor}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700/75 shrink-0" />
                        <span className="truncate">{course.room}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-emerald-700/75 shrink-0 mt-0.5" />
                      <div className="font-mono-tabular text-slate-700 leading-relaxed">
                        {course.slots.length > 0
                          ? course.slots
                              .map((s) => `${s.day} ${formatTimeRange(s.startHour, s.endHour)}`)
                              .join(' · ')
                          : '강의 시간 미지정'}
                      </div>
                    </div>

                    {/* Weekly Syllabus Progress */}
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">16주차 진도율</span>
                        <span className="font-mono-tabular font-semibold text-emerald-700">
                          {completedWeeks}/{totalWeeks}주 ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-emerald-50 border border-emerald-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Course Status Summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono-tabular">
                      <span>
                        진행 과제{' '}
                        <strong className={pendingAssignments > 0 ? 'text-amber-700' : 'text-slate-700'}>
                          {pendingAssignments}건
                        </strong>
                        <span className="mx-1.5 text-slate-300">·</span>
                        자료/노트 <strong className="text-slate-700">{archiveCount}건</strong>
                      </span>
                      <span className="font-semibold text-emerald-800">
                        예상 {grade.letter} ({weightedScore}점)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-[#F3FAF6] border-t border-emerald-100 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course)}
                    className="py-1.5 px-2 text-[11px] font-semibold text-slate-700 bg-white border border-emerald-200/80 rounded-lg hover:border-emerald-400 hover:text-emerald-900 transition-colors"
                  >
                    상세 · 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenArchive(course.id)}
                    className="inline-flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold text-emerald-800 bg-white border border-emerald-200/80 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <FolderArchive className="w-3 h-3" />
                    <span>자료실</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenStudy(course.id)}
                    className="inline-flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>진도 · 과제</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
