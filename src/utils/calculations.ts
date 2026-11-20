import katex from 'katex';
import {
  Assignment,
  Course,
  CourseColorKey,
  GradeConfig,
  PastSemester,
  TimeSlot,
  Weekday,
} from '../types/campus';

export const COURSE_COLORS: Record<
  CourseColorKey,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
    bar: string;
  }
> = {
  indigo: {
    label: '인디고',
    bg: 'bg-indigo-50/90',
    border: 'border-indigo-200',
    text: 'text-indigo-950',
    dot: 'bg-indigo-600',
    bar: '#4F46E5',
  },
  sky: {
    label: '스카이',
    bg: 'bg-sky-50/90',
    border: 'border-sky-200',
    text: 'text-sky-950',
    dot: 'bg-sky-600',
    bar: '#0284C7',
  },
  emerald: {
    label: '에메랄드',
    bg: 'bg-emerald-50/90',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    dot: 'bg-emerald-600',
    bar: '#059669',
  },
  amber: {
    label: '앰버',
    bg: 'bg-amber-50/90',
    border: 'border-amber-200',
    text: 'text-amber-950',
    dot: 'bg-amber-600',
    bar: '#D97706',
  },
  rose: {
    label: '로즈',
    bg: 'bg-rose-50/90',
    border: 'border-rose-200',
    text: 'text-rose-950',
    dot: 'bg-rose-600',
    bar: '#E11D48',
  },
  violet: {
    label: '바이올렛',
    bg: 'bg-violet-50/90',
    border: 'border-violet-200',
    text: 'text-violet-950',
    dot: 'bg-violet-600',
    bar: '#7C3AED',
  },
  slate: {
    label: '슬레이트',
    bg: 'bg-slate-100/90',
    border: 'border-slate-300',
    text: 'text-slate-900',
    dot: 'bg-slate-600',
    bar: '#475569',
  },
};

export const WEEKDAYS: Weekday[] = ['월', '화', '수', '목', '금'];

export function getTodayWeekday(): Weekday {
  const dayIdx = new Date().getDay();
  const map: Record<number, Weekday> = {
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
    6: '토',
    0: '월',
  };
  return map[dayIdx] ?? '월';
}

export function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)}–${formatHour(endHour)}`;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseDateStr: string, days: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}

export function getDeadlineInfo(dueDateISO: string, now: Date = new Date()) {
  const target = new Date(dueDateISO);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );

  let dDayLabel = '';
  if (dayDiff === 0) dDayLabel = 'D-Day';
  else if (dayDiff > 0) dDayLabel = `D-${dayDiff}`;
  else dDayLabel = `D+${Math.abs(dayDiff)}`;

  let urgency: 'overdue' | 'critical3h' | 'soon24h' | 'upcoming' | 'normal' = 'normal';
  if (diffMs < 0) urgency = 'overdue';
  else if (diffHours <= 3) urgency = 'critical3h';
  else if (diffHours <= 24) urgency = 'soon24h';
  else if (dayDiff <= 3) urgency = 'upcoming';

  const hoursRemaining = Math.max(0, Math.floor(diffHours));
  const minsRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  return {
    diffMs,
    diffHours,
    dayDiff,
    dDayLabel,
    urgency,
    timeRemainingLabel:
      diffMs < 0
        ? '기한 초과'
        : diffHours < 24
        ? `${hoursRemaining}시간 ${minsRemaining}분 남음`
        : `${dayDiff}일 남음`,
  };
}

export function getUrgentAssignments(assignments: Assignment[], now: Date = new Date()) {
  return assignments
    .filter((a) => a.status !== '제출완료')
    .map((a) => ({ assignment: a, info: getDeadlineInfo(a.dueDate, now) }))
    .filter(
      ({ assignment, info }) =>
        info.urgency === 'overdue' ||
        (info.urgency === 'critical3h' && assignment.remind3h) ||
        (info.urgency === 'soon24h' && assignment.remind24h)
    )
    .sort((a, b) => a.info.diffMs - b.info.diffMs);
}

export interface DetectedGap {
  day: Weekday;
  startHour: number;
  endHour: number;
  durationHours: number;
  suggestion: string;
}

export function detectFreeGapsForDay(courses: Course[], day: Weekday): DetectedGap[] {
  const slots: TimeSlot[] = [];
  for (const c of courses) {
    for (const s of c.slots) {
      if (s.day === day) slots.push(s);
    }
  }
  if (slots.length < 2) return [];
  slots.sort((a, b) => a.startHour - b.startHour);

  const gaps: DetectedGap[] = [];
  for (let i = 0; i < slots.length - 1; i++) {
    const endCurr = slots[i].endHour;
    const startNext = slots[i + 1].startHour;
    const duration = startNext - endCurr;
    if (duration >= 1) {
      let suggestion = '직전 강의 핵심 개념 복습 및 노트 정리';
      if (duration >= 2) {
        suggestion = '집중 뽀모도로 50분 세션 + 과제 초안 작성';
      } else if (duration >= 1.5) {
        suggestion = '도서관 이동 및 에빙하우스 망각곡선 복습';
      }
      gaps.push({
        day,
        startHour: endCurr,
        endHour: startNext,
        durationHours: duration,
        suggestion,
      });
    }
  }
  return gaps;
}

export function calculateCourseWeightedScore(config: GradeConfig): number {
  const totalWeight =
    config.attendanceWeight +
    config.assignmentWeight +
    config.midtermWeight +
    config.finalWeight;
  if (totalWeight <= 0) return 0;

  const raw =
    config.attendanceScore * config.attendanceWeight +
    config.assignmentScore * config.assignmentWeight +
    config.midtermScore * config.midtermWeight +
    config.finalScore * config.finalWeight;
  return Number((raw / totalWeight).toFixed(1));
}

export function scoreToGrade(score: number): { letter: string; point: number } {
  if (score >= 95) return { letter: 'A+', point: 4.5 };
  if (score >= 90) return { letter: 'A0', point: 4.0 };
  if (score >= 85) return { letter: 'B+', point: 3.5 };
  if (score >= 80) return { letter: 'B0', point: 3.0 };
  if (score >= 75) return { letter: 'C+', point: 2.5 };
  if (score >= 70) return { letter: 'C0', point: 2.0 };
  if (score >= 65) return { letter: 'D+', point: 1.5 };
  if (score >= 60) return { letter: 'D0', point: 1.0 };
  return { letter: 'F', point: 0.0 };
}

export function calculateSemesterGpaSummary(
  courses: Course[],
  pastSemesters: PastSemester[]
) {
  let pastTotalCredits = 0;
  let pastMajorCredits = 0;
  let pastGeneralCredits = 0;
  let pastWeightedPoints = 0;
  let pastMajorWeightedPoints = 0;

  for (const sem of pastSemesters) {
    const semCredits = sem.majorCredits + sem.generalCredits;
    pastTotalCredits += semCredits;
    pastMajorCredits += sem.majorCredits;
    pastGeneralCredits += sem.generalCredits;
    pastWeightedPoints += sem.gpa * semCredits;
    pastMajorWeightedPoints += sem.majorGpa * sem.majorCredits;
  }

  let currentCredits = 0;
  let currentMajorCredits = 0;
  let currentGeneralCredits = 0;
  let currentPoints = 0;
  let currentMajorPoints = 0;

  for (const c of courses) {
    const score = calculateCourseWeightedScore(c.gradeConfig);
    const { point } = scoreToGrade(score);
    currentCredits += c.credits;
    currentPoints += point * c.credits;
    if (c.category === '전필' || c.category === '전선') {
      currentMajorCredits += c.credits;
      currentMajorPoints += point * c.credits;
    } else {
      currentGeneralCredits += c.credits;
    }
  }

  const pastAvgGpa = pastTotalCredits > 0 ? pastWeightedPoints / pastTotalCredits : 0;
  const currentProjectedGpa = currentCredits > 0 ? currentPoints / currentCredits : 0;

  const combinedTotalCredits = pastTotalCredits + currentCredits;
  const combinedMajorCredits = pastMajorCredits + currentMajorCredits;
  const combinedGeneralCredits = pastGeneralCredits + currentGeneralCredits;

  const combinedOverallGpa =
    combinedTotalCredits > 0
      ? (pastWeightedPoints + currentPoints) / combinedTotalCredits
      : 0;
  const combinedMajorGpa =
    combinedMajorCredits > 0
      ? (pastMajorWeightedPoints + currentMajorPoints) / combinedMajorCredits
      : 0;

  return {
    pastTotalCredits,
    pastMajorCredits,
    pastAvgGpa: Number(pastAvgGpa.toFixed(2)),
    currentCredits,
    currentMajorCredits,
    currentGeneralCredits,
    currentProjectedGpa: Number(currentProjectedGpa.toFixed(2)),
    combinedTotalCredits,
    combinedMajorCredits,
    combinedGeneralCredits,
    combinedOverallGpa: Number(combinedOverallGpa.toFixed(2)),
    combinedMajorGpa: Number(combinedMajorGpa.toFixed(2)),
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInlineMarkdown(text: string): string {
  // Extract inline math $...$ first
  const mathTokens: string[] = [];
  let tokenized = text.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    try {
      const rendered = katex.renderToString(tex.trim(), {
        throwOnError: false,
        displayMode: false,
      });
      mathTokens.push(rendered);
      return `%%INLINEMATH_${mathTokens.length - 1}%%`;
    } catch {
      mathTokens.push(`<code>${escapeHtml(tex)}</code>`);
      return `%%INLINEMATH_${mathTokens.length - 1}%%`;
    }
  });

  // Extract inline code `...`
  const codeTokens: string[] = [];
  tokenized = tokenized.replace(/`([^`]+?)`/g, (_, code) => {
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return `%%INLINECODE_${codeTokens.length - 1}%%`;
  });

  tokenized = escapeHtml(tokenized);

  // Bold, Italic, Links
  tokenized = tokenized
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline underline-offset-2 hover:text-emerald-900">$1</a>'
    );

  // Restore tokens
  tokenized = tokenized.replace(/%%INLINECODE_(\d+)%%/g, (_, idx) => codeTokens[Number(idx)] || '');
  tokenized = tokenized.replace(/%%INLINEMATH_(\d+)%%/g, (_, idx) => mathTokens[Number(idx)] || '');

  return tokenized;
}

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown.trim()) {
    return '<p class="text-slate-400">작성된 내용이 없습니다. 왼쪽 에디터에서 마크다운, 수식($...$), 코드 블록(```)을 입력해 보세요.</p>';
  }

  // Extract display math $$...$$
  const blockMathTokens: string[] = [];
  let src = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      const rendered = katex.renderToString(tex.trim(), {
        throwOnError: false,
        displayMode: true,
      });
      blockMathTokens.push(rendered);
    } catch {
      blockMathTokens.push(`<pre><code>${escapeHtml(tex)}</code></pre>`);
    }
    return `\n%%BLOCKMATH_${blockMathTokens.length - 1}%%\n`;
  });

  // Extract fenced code blocks ```lang ... ```
  const codeBlockTokens: string[] = [];
  src = src.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang
      ? `<div class="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">${escapeHtml(
          lang
        )}</div>`
      : '';
    codeBlockTokens.push(
      `<pre>${langLabel}<code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`
    );
    return `\n%%CODEBLOCK_${codeBlockTokens.length - 1}%%\n`;
  });

  const lines = src.split('\n');
  const htmlParts: string[] = [];
  let inUl = false;
  let inOl = false;
  let tableRows: string[] = [];

  const flushLists = () => {
    if (inUl) {
      htmlParts.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      htmlParts.push('</ol>');
      inOl = false;
    }
  };

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const rows = tableRows.map((row) =>
      row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
    );
    const hasSeparator =
      rows.length >= 2 && rows[1].every((cell) => /^:?-{2,}:?$/.test(cell));
    let html = '<table>';
    if (hasSeparator) {
      html +=
        '<thead><tr>' +
        rows[0].map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('') +
        '</tr></thead><tbody>';
      for (let i = 2; i < rows.length; i++) {
        html +=
          '<tr>' +
          rows[i].map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('') +
          '</tr>';
      }
      html += '</tbody>';
    } else {
      html += '<tbody>';
      for (const r of rows) {
        html +=
          '<tr>' +
          r.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('') +
          '</tr>';
      }
      html += '</tbody>';
    }
    html += '</table>';
    htmlParts.push(html);
    tableRows = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^\|.*\|$/.test(line.trim())) {
      flushLists();
      tableRows.push(line.trim());
      continue;
    } else {
      flushTable();
    }

    const blockMathMatch = line.trim().match(/^%%BLOCKMATH_(\d+)%%$/);
    if (blockMathMatch) {
      flushLists();
      htmlParts.push(blockMathTokens[Number(blockMathMatch[1])] || '');
      continue;
    }

    const codeMatch = line.trim().match(/^%%CODEBLOCK_(\d+)%%$/);
    if (codeMatch) {
      flushLists();
      htmlParts.push(codeBlockTokens[Number(codeMatch[1])] || '');
      continue;
    }

    if (line.trim() === '') {
      flushLists();
      continue;
    }

    if (/^###\s+/.test(line)) {
      flushLists();
      htmlParts.push(`<h3>${renderInlineMarkdown(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushLists();
      htmlParts.push(`<h2>${renderInlineMarkdown(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (/^#\s+/.test(line)) {
      flushLists();
      htmlParts.push(`<h1>${renderInlineMarkdown(line.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushLists();
      htmlParts.push('<hr class="my-4 border-slate-200" />');
      continue;
    }
    if (/^>\s*/.test(line)) {
      flushLists();
      htmlParts.push(`<blockquote>${renderInlineMarkdown(line.replace(/^>\s*/, ''))}</blockquote>`);
      continue;
    }

    // Task list item - [ ] or - [x]
    const taskMatch = line.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
    if (taskMatch) {
      if (inOl) {
        htmlParts.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        htmlParts.push('<ul class="list-none pl-0 space-y-1">');
        inUl = true;
      }
      const checked = taskMatch[1].toLowerCase() === 'x';
      htmlParts.push(
        `<li class="flex items-start gap-2 list-none"><span class="inline-flex items-center justify-center w-4 h-4 mt-1 rounded border ${
          checked
            ? 'bg-emerald-700 border-emerald-700 text-white'
            : 'border-slate-300 bg-white'
        } text-[10px]">${checked ? '✓' : ''}</span><span class="${
          checked ? 'line-through text-slate-400' : ''
        }">${renderInlineMarkdown(taskMatch[2])}</span></li>`
      );
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inOl) {
        htmlParts.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        htmlParts.push('<ul>');
        inUl = true;
      }
      htmlParts.push(`<li>${renderInlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) {
        htmlParts.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        htmlParts.push('<ol>');
        inOl = true;
      }
      htmlParts.push(`<li>${renderInlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    flushLists();
    htmlParts.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  flushTable();
  flushLists();
  return htmlParts.join('\n');
}
