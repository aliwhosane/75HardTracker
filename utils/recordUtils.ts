import { DailyRecord } from '../types/DailyRecord';
import { ChallengeProgress } from '../types/ChallengeProgress';
import { getChallengeProgress, saveChallengeProgress } from './storage';

/**
 * Saves the current day's record to the challenge progress
 * Updates only the current day's data without overwriting other days
 * 
 * @param dailyRecord The daily record to save
 * @param date The date for this record (YYYY-MM-DD format)
 * @returns Promise that resolves to the updated challenge progress
 */
export const saveDailyRecord = async (
  dailyRecord: Omit<DailyRecord, 'date'>, 
  date: string
): Promise<ChallengeProgress> => {
  try {
    // Get existing progress data
    const progress = await getChallengeProgress();
    
    if (!progress) {
      throw new Error('No challenge progress found');
    }
    
    // Create the complete daily record with date
    const completeRecord: DailyRecord = {
      date,
      ...dailyRecord
    };
    
    // Check if we already have a record for this date
    const existingRecordIndex = progress.dailyRecords.findIndex(
      record => record.date === date
    );
    
    const updatedProgress = { ...progress };
    
    if (existingRecordIndex >= 0) {
      // Update existing record
      updatedProgress.dailyRecords[existingRecordIndex] = completeRecord;
      
      // If this is the current day, make sure currentDayIndex points to it
      if (existingRecordIndex !== progress.currentDayIndex) {
        updatedProgress.currentDayIndex = existingRecordIndex;
      }
    } else {
      // Add new record
      updatedProgress.dailyRecords.push(completeRecord);
      updatedProgress.currentDayIndex = updatedProgress.dailyRecords.length - 1;
      
      // If this is the first day and the challenge isn't active yet, activate it
      if (!updatedProgress.isActive && updatedProgress.dailyRecords.length === 1) {
        updatedProgress.isActive = true;
        updatedProgress.startDate = date;
      }
    }
    
    // Save the updated progress
    await saveChallengeProgress(updatedProgress);
    
    return updatedProgress;
  } catch (error) {
    console.error('Error saving daily record:', error);
    throw error;
  }
};

/**
 * Checks if all tasks for a day are completed
 */
export const isAllTasksCompleted = (record: DailyRecord): boolean => {
  return (
    record.workout1Completed &&
    record.workout2Completed &&
    record.dietFollowed &&
    record.read10PagesCompleted &&
    record.drink1GallonWaterCompleted &&
    record.takeProgressPhotoCompleted
  );
};