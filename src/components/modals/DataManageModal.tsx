import React, { useRef, useState } from 'react';
import { Download, Trash2, Upload, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface DataManageModalProps {
  open: boolean;
  onClose: () => void;
}

export const DataManageModal: React.FC<DataManageModalProps> = ({ open, onClose }) => {
  const {
    state,
    setSemesterName,
    startBlankSemester,
    importWorkspaceJson,
    showToast,
  } = useWorkspace();
  const [semesterInput, setSemesterInput] = useState(state.semesterName);
  const [confirmBlank, setConfirmBlank] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campusfolio_${state.semesterName}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('전체 워크스페이스 데이터가 JSON 파일로 저장되었습니다.', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const ok = importWorkspaceJson(reader.result);
        if (ok) onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[1px]">
      <div className="w-full max-w-md bg-white border border-emerald-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
          <h2 className="font-display text-base font-semibold text-slate-900">
            워크스페이스 설정 및 데이터 관리
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Semester Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              현재 학기명 설정
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={semesterInput}
                onChange={(e) => setSemesterInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-600"
                placeholder="예: 2026-2학기"
              />
              <button
                type="button"
                onClick={() => {
                  if (semesterInput.trim()) {
                    setSemesterName(semesterInput.trim());
                    showToast('학기명이 변경되었습니다.', 'success');
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 whitespace-nowrap"
              >
                적용
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* JSON Backup & Restore */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-800">백업 및 복원</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              모든 시간표, 과제, 노트, 성적 데이터는 브라우저 로컬 저장소에 자동 보관됩니다. 기기 이동이나 안전한 보관을 위해 JSON으로 내보낼 수 있습니다.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON 내보내기</span>
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>백업 불러오기</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Reset options */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-800">데이터 초기화</div>

            {!confirmBlank ? (
              <button
                type="button"
                onClick={() => setConfirmBlank(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100/70"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>전체 데이터 비우기 (직접 등록 초기화)</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <p className="text-xs text-slate-700">
                  직접 등록한 모든 과목, 과제, 노트, 성적 데이터를 비우고 빈 상태로 초기화할까요?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmBlank(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startBlankSemester();
                      setConfirmBlank(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                  >
                    확인 및 초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
