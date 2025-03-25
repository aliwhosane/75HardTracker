import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChallengeProgress } from '../types/ChallengeProgress';

// Key for storing challenge progress data
const CHALLENGE_PROGRESS_KEY = '@75Hard:challengeProgress';

/**
 * Saves challenge progress to AsyncStorage
 */
export const saveChallengeProgress = async (progress: ChallengeProgress): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(progress);
    await AsyncStorage.setItem(CHALLENGE_PROGRESS_KEY, jsonValue);
    console.log('Challenge progress saved successfully');
  } catch (error) {
    console.error('Error saving challenge progress:', error);
    throw error;
  }
};

/**
 * Retrieves challenge progress from AsyncStorage
 * Returns null if no data exists
 */
export const getChallengeProgress = async (): Promise<ChallengeProgress | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CHALLENGE_PROGRESS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving challenge progress:', error);
    throw error;
  }
};

/**
 * Initializes a new challenge progress if none exists
 */
export const initializeChallengeProgressIfNeeded = async (): Promise<ChallengeProgress> => {
  const existingProgress = await getChallengeProgress();
  
  if (existingProgress) {
    return existingProgress;
  }
  
  // Create a new empty challenge progress
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const newProgress: ChallengeProgress = {
    dailyRecords: [],
    currentDayIndex: -1, // No days started yet
    startDate: today,
    isActive: false, // Not active until user explicitly starts
    endDate: undefined
  };
  
  await saveChallengeProgress(newProgress);
  return newProgress;
};

/**
 * Updates a specific day's record
 */
export const updateDailyRecord = async (
  dayIndex: number, 
  updatedRecord: any
): Promise<ChallengeProgress> => {
  const progress = await getChallengeProgress();
  
  if (!progress) {
    throw new Error('No challenge progress found');
  }
  
  // Update the specific day's record
  if (dayIndex >= 0 && dayIndex < progress.dailyRecords.length) {
    progress.dailyRecords[dayIndex] = {
      ...progress.dailyRecords[dayIndex],
      ...updatedRecord
    };
    
    await saveChallengeProgress(progress);
  }
  
  return progress;
};