import React, { useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { QuickAddModal } from './components/modals/QuickAddModal';
import { DataManageModal } from './components/modals/DataManageModal';
import { HomeView } from './components/views/HomeView';
import { TimetableView } from './components/views/TimetableView';
import { StudyTaskView } from './components/views/StudyTaskView';
import { ArchiveView } from './components/views/ArchiveView';
import { GradesView } from './components/views/GradesView';
import { CampusLifeView } from './components/views/CampusLifeView';

const WorkspaceShell: React.FC = () => {
  const { activeTab, toast } = useWorkspace();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#E7F3EC] text-[#0F172A]">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenDataModal={() => setDataModalOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'timetable' && <TimetableView />}
          {activeTab === 'study' && <StudyTaskView />}
          {activeTab === 'archive' && <ArchiveView />}
          {activeTab === 'grades' && <GradesView />}
          {activeTab === 'campus' && <CampusLifeView />}
        </main>
      </div>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <DataManageModal open={dataModalOpen} onClose={() => setDataModalOpen(false)} />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl border text-xs font-medium shadow-md transition-opacity ${
            toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : toast.type === 'info'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-emerald-700 border-emerald-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}
