import { WorkspaceState } from '../types/campus';

export function createEmptyWorkspaceState(): WorkspaceState {
  return {
    semesterName: '2026-2학기',
    courses: [],
    academicEvents: [],
    freeSlotRoutines: [],
    assignments: [],
    teamProjects: [],
    pomodoroSessions: [],
    notes: [],
    resources: [],
    pastSemesters: [],
    graduationGoal: {
      requiredTotalCredits: 130,
      requiredMajorCredits: 66,
      requiredGeneralCredits: 36,
      targetOverallGpa: 4.0,
    },
    campusLinks: [],
    libraryRooms: [],
    cafeteriaMenus: [],
    campusActivities: [],
    personalMemos: [],
  };
}
