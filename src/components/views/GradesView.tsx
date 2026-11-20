import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  calculateCourseWeightedScore,
  calculateSemesterGpaSummary,
  scoreToGrade,
} from '../../utils/calculations';

export const GradesView: React.FC = () => {
  const {
    state,
    updateCourse,
    addPastSemester,
    deletePastSemester,
    updateGraduationGoal,
    showToast,
  } = useWorkspace();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    state.courses[0]?.id || ''
  );

  const [termInput, setTermInput] = useState('2024-2학기');
  const [majorCredInput, setMajorCredInput] = useState(9);
  const [genCredInput, setGenCredInput] = useState(9);
  const [gpaInput, setGpaInput] = useState(3.85);
  const [majorGpaInput, setMajorGpaInput] = useState(3.9);

  const summary = useMemo(
    () => calculateSemesterGpaSummary(state.courses, state.pastSemesters),
    [state.courses, state.pastSemesters]
  );

  const selectedCourse =
    state.courses.find((c) => c.id === selectedCourseId) || state.courses[0] || null;

  const currentMajorReq = state.courses
    .filter((c) => c.category === '전필')
    .reduce((acc, c) => acc + c.credits, 0);
  const currentMajorElec = state.courses
    .filter((c) => c.category === '전선')
    .reduce((acc, c) => acc + c.credits, 0);
  const currentGen = state.courses
    .filter((c) => c.category === '교양')
    .reduce((acc, c) => acc + c.credits, 0);

  const remainingCredits = Math.max(
    0,
    state.graduationGoal.requiredTotalCredits - summary.combinedTotalCredits
  );
  const currentTotalPoints = summary.combinedOverallGpa * summary.combinedTotalCredits;
  const targetTotalPoints =
    state.graduationGoal.targetOverallGpa * state.graduationGoal.requiredTotalCredits;
  const neededAvgGpa =
    remainingCredits > 0 ? (targetTotalPoints - currentTotalPoints) / remainingCredits : 0;

  const trendPoints = useMemo(() => {
    return [
      ...state.pastSemesters.map((s) => ({
        label: s.term,
        overall: s.gpa,
        major: s.majorGpa,
      })),
      ...(state.courses.length > 0
        ? [
            {
              label: `${state.semesterName}(예상)`,
              overall: summary.currentProjectedGpa,
              major: summary.currentProjectedGpa,
            },
          ]
        : []),
    ];
  }, [state.pastSemesters, state.courses.length, state.semesterName, summary]);

  const handleAddPastSemester = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;
    addPastSemester({
      id: `sem-${Date.now()}`,
      term: termInput.trim(),
      majorCredits: majorCredInput,
      generalCredits: genCredInput,
      gpa: gpaInput,
      majorGpa: majorGpaInput,
    });
    showToast('이전 학기 성적이 추가되었습니다.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Individual KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
          <div className="text-xs text-slate-500 mb-1">누적 전체 평점</div>
          <div className="font-mono-tabular text-2xl font-bold text-slate-900">
            {summary.combinedOverallGpa.toFixed(2)}
            <span className="text-sm font-normal text-slate-400 ml-1">/ 4.50</span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            이전 학기 평균 {summary.pastAvgGpa.toFixed(2)}
          </div>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
          <div className="text-xs text-slate-500 mb-1">누적 전공 평점</div>
          <div className="font-mono-tabular text-2xl font-bold text-emerald-700">
            {summary.combinedMajorGpa.toFixed(2)}
            <span className="text-sm font-normal text-slate-400 ml-1">/ 4.50</span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            전공 이수 {summary.combinedMajorCredits}학점
          </div>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
          <div className="text-xs text-slate-500 mb-1">이수 학점 (이번 학기 포함)</div>
          <div className="font-mono-tabular text-2xl font-bold text-slate-900">
            {summary.combinedTotalCredits}
            <span className="text-sm font-normal text-slate-400 ml-1">
              / {state.graduationGoal.requiredTotalCredits}학점
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            졸업까지 {remainingCredits}학점 남음
          </div>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5">
          <div className="text-xs text-slate-500 mb-1">이번 학기 예상 평점</div>
          <div className="font-mono-tabular text-2xl font-bold text-slate-900">
            {summary.currentProjectedGpa.toFixed(2)}
            <span className="text-sm font-normal text-slate-400 ml-1">/ 4.50</span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            수강 {summary.currentCredits}학점 기준
          </div>
        </div>
      </section>

      {/* Charts & Target Simulator Card Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                학기별 평점 추이 (전체 · 전공)
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
                  전체 평점
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                  전공 평점
                </span>
              </div>
            </div>

            {trendPoints.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                성적 데이터를 추가하면 학기별 평점 추이 그래프가 표시됩니다.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 560 190" className="w-full h-48 min-w-[420px]">
                  {[2.5, 3.0, 3.5, 4.0, 4.5].map((val) => {
                    const y = 155 - ((val - 2.0) / 2.5) * 130;
                    return (
                      <g key={val}>
                        <line
                          x1={42}
                          y1={y}
                          x2={535}
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={34}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-400 text-[10px] font-mono"
                        >
                          {val.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {trendPoints.length > 1 && (
                    <>
                      <polyline
                        fill="none"
                        stroke="#047857"
                        strokeWidth={2.5}
                        points={trendPoints
                          .map((pt, idx) => {
                            const x =
                              65 +
                              (idx * (505 - 65)) / Math.max(1, trendPoints.length - 1);
                            const y =
                              155 -
                              ((Math.max(2.0, Math.min(4.5, pt.overall)) - 2.0) / 2.5) *
                                130;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                      <polyline
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        points={trendPoints
                          .map((pt, idx) => {
                            const x =
                              65 +
                              (idx * (505 - 65)) / Math.max(1, trendPoints.length - 1);
                            const y =
                              155 -
                              ((Math.max(2.0, Math.min(4.5, pt.major)) - 2.0) / 2.5) *
                                130;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                    </>
                  )}

                  {trendPoints.map((pt, idx) => {
                    const x =
                      trendPoints.length === 1
                        ? 280
                        : 65 + (idx * (505 - 65)) / (trendPoints.length - 1);
                    const yOverall =
                      155 -
                      ((Math.max(2.0, Math.min(4.5, pt.overall)) - 2.0) / 2.5) * 130;
                    const yMajor =
                      155 -
                      ((Math.max(2.0, Math.min(4.5, pt.major)) - 2.0) / 2.5) * 130;
                    return (
                      <g key={pt.label}>
                        <circle cx={x} cy={yMajor} r={3.5} fill="#0284C7" />
                        <circle cx={x} cy={yOverall} r={4.5} fill="#047857" />
                        <text
                          x={x}
                          y={yOverall - 9}
                          textAnchor="middle"
                          className="fill-slate-800 text-[10px] font-mono font-semibold"
                        >
                          {pt.overall.toFixed(2)}
                        </text>
                        <text
                          x={x}
                          y={178}
                          textAnchor="middle"
                          className="fill-slate-500 text-[10px]"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Credit Progress Bars */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              이수 구분별 학점 현황 (졸업 요건 대비)
            </div>
            {[
              {
                label: '전체 졸업 학점',
                earned: summary.combinedTotalCredits,
                req: state.graduationGoal.requiredTotalCredits,
                detail: `이번 학기 ${summary.currentCredits}학점 포함`,
                color: '#047857',
              },
              {
                label: '전공 (전필 + 전선)',
                earned: summary.combinedMajorCredits,
                req: state.graduationGoal.requiredMajorCredits,
                detail: `이번 학기 전필 ${currentMajorReq} · 전선 ${currentMajorElec}`,
                color: '#0284C7',
              },
              {
                label: '교양 이수 학점',
                earned: summary.combinedGeneralCredits,
                req: state.graduationGoal.requiredGeneralCredits,
                detail: `이번 학기 교양 ${currentGen}학점`,
                color: '#10B981',
              },
            ].map((bar) => {
              const pct = Math.min(100, Math.round((bar.earned / Math.max(1, bar.req)) * 100));
              return (
                <div key={bar.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {bar.label}{' '}
                      <span className="text-slate-400 font-normal">({bar.detail})</span>
                    </span>
                    <span className="font-mono-tabular font-semibold text-slate-900">
                      {bar.earned} / {bar.req}학점 ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: bar.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Target GPA Simulator Card */}
        <section className="lg:col-span-5 bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            목표 학점 &amp; 졸업 평점 시뮬레이터
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">졸업 기준 총학점</label>
              <input
                type="number"
                min={60}
                max={200}
                value={state.graduationGoal.requiredTotalCredits}
                onChange={(e) =>
                  updateGraduationGoal({
                    ...state.graduationGoal,
                    requiredTotalCredits: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 font-mono-tabular border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">졸업 전공 필수기준</label>
              <input
                type="number"
                min={20}
                max={120}
                value={state.graduationGoal.requiredMajorCredits}
                onChange={(e) =>
                  updateGraduationGoal({
                    ...state.graduationGoal,
                    requiredMajorCredits: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 font-mono-tabular border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">졸업 교양 기준</label>
              <input
                type="number"
                min={10}
                max={80}
                value={state.graduationGoal.requiredGeneralCredits}
                onChange={(e) =>
                  updateGraduationGoal({
                    ...state.graduationGoal,
                    requiredGeneralCredits: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 font-mono-tabular border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">목표 졸업 평점 (4.5)</label>
              <input
                type="number"
                min={1.0}
                max={4.5}
                step={0.05}
                value={state.graduationGoal.targetOverallGpa}
                onChange={(e) =>
                  updateGraduationGoal({
                    ...state.graduationGoal,
                    targetOverallGpa: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 font-mono-tabular font-semibold text-emerald-800 border border-emerald-200 rounded-xl bg-emerald-50/50"
              />
            </div>
          </div>

          <div className="p-4 bg-[#F3FAF6] border border-emerald-200/70 rounded-xl space-y-2">
            {remainingCredits <= 0 ? (
              <div className="flex items-start gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  졸업 기준 총학점({state.graduationGoal.requiredTotalCredits}학점)을 이미 모두 충족했습니다.
                </span>
              </div>
            ) : neededAvgGpa > 4.5 ? (
              <div className="flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">
                    남은 {remainingCredits}학점에서 평균 {neededAvgGpa.toFixed(2)} 이상 필요 (달성 불가)
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    최대 가능 평점(4.50)을 초과합니다. 목표 평점을 조정하거나 재수강/추가 이수 계획을 고려하세요.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-600">
                  남은 <span className="font-mono-tabular font-semibold">{remainingCredits}학점</span>에서
                  목표 평점{' '}
                  <span className="font-mono-tabular font-semibold">
                    {state.graduationGoal.targetOverallGpa.toFixed(2)}
                  </span>
                  을 달성하려면
                </div>
                <div className="font-mono-tabular text-2xl font-bold text-emerald-700">
                  평균 {Math.max(0, neededAvgGpa).toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-500">이상 필요</span>
                </div>
                <div className="text-xs text-slate-500">
                  {neededAvgGpa <= summary.combinedOverallGpa
                    ? '현재 학점 추세를 유지하면 여유롭게 목표를 달성할 수 있습니다.'
                    : '남은 학기에서 A0~A+ 비중을 높이는 전략이 필요합니다.'}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Course-by-Course Weighted Grade Calculator Card */}
      <section className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              과목별 성적 산출기 (출석 · 과제 · 중간 · 기말 반영 비율)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              각 항목의 반영 비율과 예상 점수를 조절하면 실시간 예상 등급과 학점이 계산됩니다.
            </p>
          </div>
          <select
            value={selectedCourse?.id || ''}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white"
          >
            {state.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.credits}학점)
              </option>
            ))}
          </select>
        </div>

        {selectedCourse ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  { key: 'attendance', label: '출석' },
                  { key: 'assignment', label: '과제' },
                  { key: 'midterm', label: '중간고사' },
                  { key: 'final', label: '기말고사' },
                ] as const
              ).map((item) => {
                const weightKey = `${item.key}Weight` as keyof typeof selectedCourse.gradeConfig;
                const scoreKey = `${item.key}Score` as keyof typeof selectedCourse.gradeConfig;
                return (
                  <div
                    key={item.key}
                    className="p-3.5 border border-emerald-200/70 rounded-xl bg-[#F3FAF6] space-y-2.5 text-xs"
                  >
                    <div className="font-semibold text-slate-900">{item.label}</div>
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>반영 비율</span>
                        <span className="font-mono-tabular">
                          {selectedCourse.gradeConfig[weightKey]}%
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selectedCourse.gradeConfig[weightKey]}
                        onChange={(e) =>
                          updateCourse({
                            ...selectedCourse,
                            gradeConfig: {
                              ...selectedCourse.gradeConfig,
                              [weightKey]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 font-mono-tabular bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>예상 점수 (100점)</span>
                        <span className="font-mono-tabular font-semibold text-emerald-700">
                          {selectedCourse.gradeConfig[scoreKey]}점
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={selectedCourse.gradeConfig[scoreKey]}
                        onChange={(e) =>
                          updateCourse({
                            ...selectedCourse,
                            gradeConfig: {
                              ...selectedCourse.gradeConfig,
                              [scoreKey]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-emerald-700"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const gc = selectedCourse.gradeConfig;
              const weightSum =
                gc.attendanceWeight +
                gc.assignmentWeight +
                gc.midtermWeight +
                gc.finalWeight;
              const weightedScore = calculateCourseWeightedScore(gc);
              const { letter, point } = scoreToGrade(weightedScore);
              return (
                <div className="lg:col-span-3 p-5 border border-emerald-300 bg-emerald-50/70 rounded-2xl text-center space-y-1.5">
                  <div className="text-xs text-slate-600">예상 환산 점수 · 등급</div>
                  <div className="font-mono-tabular text-3xl font-bold text-emerald-700">
                    {letter}
                  </div>
                  <div className="font-mono-tabular text-sm font-semibold text-slate-900">
                    {weightedScore.toFixed(1)}점 · {point.toFixed(1)}
                  </div>
                  {weightSum !== 100 && (
                    <div className="text-[11px] text-amber-700 font-medium pt-1">
                      비율 합계가 {weightSum}%입니다 (100% 권장)
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <p className="text-xs text-slate-500">과목을 먼저 등록하세요.</p>
        )}

        {state.courses.length > 0 && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 px-3 font-medium">과목명</th>
                  <th className="py-2 px-3 font-medium">구분</th>
                  <th className="py-2 px-3 font-medium">학점</th>
                  <th className="py-2 px-3 font-medium text-right">환산 점수</th>
                  <th className="py-2 px-3 font-medium text-right">예상 등급</th>
                  <th className="py-2 px-3 font-medium text-right">평점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.courses.map((c) => {
                  const score = calculateCourseWeightedScore(c.gradeConfig);
                  const { letter, point } = scoreToGrade(score);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCourseId(c.id)}
                      className={`cursor-pointer hover:bg-emerald-50/40 ${
                        selectedCourse?.id === c.id ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.category}</td>
                      <td className="py-2.5 px-3 font-mono-tabular">{c.credits}</td>
                      <td className="py-2.5 px-3 font-mono-tabular text-right">
                        {score.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular font-semibold text-emerald-700 text-right">
                        {letter}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-right">
                        {point.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Past Semesters History Card */}
      <section className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-display text-sm font-semibold text-slate-900">
          이전 학기 이수 성적 이력
        </h3>

        <form
          onSubmit={handleAddPastSemester}
          className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-end text-xs"
        >
          <div className="sm:col-span-3">
            <label className="block text-slate-500 mb-1">학기명</label>
            <input
              type="text"
              required
              value={termInput}
              onChange={(e) => setTermInput(e.target.value)}
              placeholder="2024-2학기"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 mb-1">전공학점</label>
            <input
              type="number"
              min={0}
              max={24}
              value={majorCredInput}
              onChange={(e) => setMajorCredInput(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 font-mono-tabular border border-slate-200 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 mb-1">교양학점</label>
            <input
              type="number"
              min={0}
              max={24}
              value={genCredInput}
              onChange={(e) => setGenCredInput(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 font-mono-tabular border border-slate-200 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 mb-1">전체평점</label>
            <input
              type="number"
              step={0.01}
              min={0}
              max={4.5}
              value={gpaInput}
              onChange={(e) => setGpaInput(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 font-mono-tabular border border-slate-200 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-500 mb-1">전공평점</label>
            <input
              type="number"
              step={0.01}
              min={0}
              max={4.5}
              value={majorGpaInput}
              onChange={(e) => setMajorGpaInput(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 font-mono-tabular border border-slate-200 rounded-xl"
            />
          </div>
          <button
            type="submit"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 px-3 font-medium">학기</th>
                <th className="py-2 px-3 font-medium text-right">전공 학점</th>
                <th className="py-2 px-3 font-medium text-right">교양 학점</th>
                <th className="py-2 px-3 font-medium text-right">전체 평점</th>
                <th className="py-2 px-3 font-medium text-right">전공 평점</th>
                <th className="py-2 px-3 font-medium text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.pastSemesters.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{s.term}</td>
                  <td className="py-2.5 px-3 font-mono-tabular text-right">{s.majorCredits}</td>
                  <td className="py-2.5 px-3 font-mono-tabular text-right">
                    {s.generalCredits}
                  </td>
                  <td className="py-2.5 px-3 font-mono-tabular font-semibold text-right">
                    {s.gpa.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono-tabular text-emerald-700 text-right">
                    {s.majorGpa.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => deletePastSemester(s.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
