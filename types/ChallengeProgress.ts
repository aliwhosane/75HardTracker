import { DailyRecord } from './DailyRecord';

export interface ChallengeProgress {
  // Array of all daily records
  dailyRecords: DailyRecord[];
  
  // Index of the current day in the dailyRecords array
  currentDayIndex: number;
  
  // Start date of the challenge in YYYY-MM-DD format
  startDate: string;
  
  // Whether the challenge is currently active
  isActive: boolean;
  
  // Optional end date if the challenge has been completed or abandoned
  endDate?: string;
}

// Helper function to get the current day's record
export function getCurrentDayRecord(progress: ChallengeProgress): DailyRecord | null {
  if (progress.currentDayIndex >= 0 && progress.currentDayIndex < progress.dailyRecords.length) {
    return progress.dailyRecords[progress.currentDayIndex];
  }
  return null;
}