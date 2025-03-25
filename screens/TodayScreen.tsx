import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyRecord } from '../types/DailyRecord';
import { getChallengeProgress, saveChallengeProgress } from '../utils/storage';
import { saveDailyRecord } from '../utils/recordUtils';
import { colors, spacing, typography, shadows, borderRadius } from '../styles/theme';

const TodayScreen = () => {
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dayNumber, setDayNumber] = useState(1);
  const [isCurrentDay, setIsCurrentDay] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      setError(null); // Reset any previous errors
      const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      const progress = await getChallengeProgress();
      
      if (progress) {
        // Calculate the current day number (1-indexed)
        const currentDayNumber = progress.dailyRecords.length > 0 ? progress.currentDayIndex + 1 : 1;
        setDayNumber(currentDayNumber);
        
        // Check if we have a record for today
        const todayIndex = progress.dailyRecords.findIndex(record => record.date === today);
        
        if (todayIndex >= 0) {
          // We found a record for today
          setTodayRecord(progress.dailyRecords[todayIndex]);
          setIsCurrentDay(true);
          
          // Update currentDayIndex if it's not pointing to today
          if (progress.currentDayIndex !== todayIndex) {
            const updatedProgress = { ...progress, currentDayIndex: todayIndex };
            await saveChallengeProgress(updatedProgress);
          }
        } else {
          // No record for today, create a new one
          const newRecord: DailyRecord = {
            date: today,
            workout1Completed: false,
            workout2Completed: false,
            dietFollowed: false,
            read10PagesCompleted: false,
            drink1GallonWaterCompleted: false,
            takeProgressPhotoCompleted: false
          };
          
          // Add the new record to the progress
          const updatedProgress = { ...progress };
          updatedProgress.dailyRecords.push(newRecord);
          updatedProgress.currentDayIndex = updatedProgress.dailyRecords.length - 1;
          
          // Update day number based on the new record
          setDayNumber(updatedProgress.dailyRecords.length);
          setIsCurrentDay(true);
          
          // If this is the first day and the challenge isn't active yet, activate it
          if (!updatedProgress.isActive && updatedProgress.dailyRecords.length === 1) {
            updatedProgress.isActive = true;
            updatedProgress.startDate = today;
          }
          
          await saveChallengeProgress(updatedProgress);
          setTodayRecord(newRecord);
        }
      } else {
        // No progress data exists at all, initialize with a new record
        setDayNumber(1); // First day
        setIsCurrentDay(true);
        
        const newRecord: DailyRecord = {
          date: today,
          workout1Completed: false,
          workout2Completed: false,
          dietFollowed: false,
          read10PagesCompleted: false,
          drink1GallonWaterCompleted: false,
          takeProgressPhotoCompleted: false
        };
        
        // Create initial progress object
        const initialProgress = {
          dailyRecords: [newRecord],
          currentDayIndex: 0,
          startDate: today,
          isActive: true
        };
        
        await saveChallengeProgress(initialProgress);
        setTodayRecord(newRecord);
      }
    } catch (error) {
      console.error('Error loading today data:', error);
      setError('Failed to load today\'s data. Please try again.');
      
      // Set fallback data to prevent app from crashing
      const today = new Date().toISOString().split('T')[0];
      setTodayRecord({
        date: today,
        workout1Completed: false,
        workout2Completed: false,
        dietFollowed: false,
        read10PagesCompleted: false,
        drink1GallonWaterCompleted: false,
        takeProgressPhotoCompleted: false
      });
      setDayNumber(1);
      setIsCurrentDay(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskName: keyof Omit<DailyRecord, 'date'>) => {
    // Prevent toggling if not the current day
    if (!todayRecord || !isCurrentDay) return;
    
    try {
      setSaving(true);
      setError(null); // Reset any previous errors
      
      // Update local state immediately for responsive UI
      const updatedRecord = {
        ...todayRecord,
        [taskName]: !todayRecord[taskName]
      };
      
      setTodayRecord(updatedRecord);
      
      // Create a record object without the date field
      const { date, ...recordWithoutDate } = updatedRecord;
      
      // Update the specific task and save the entire record
      const updatedRecordWithoutDate = {
        ...recordWithoutDate,
        [taskName]: !todayRecord[taskName]
      };
      
      // Save using our utility function with timeout for network issues
      const savePromise = saveDailyRecord(updatedRecordWithoutDate, date);
      
      // Add a timeout to handle potential hanging operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out')), 5000);
      });
      
      await Promise.race([savePromise, timeoutPromise]);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to save your progress. Please try again.');
      
      // Revert the local state if saving failed
      if (todayRecord) {
        setTodayRecord({ ...todayRecord });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderTaskItem = (
    taskKey: keyof Omit<DailyRecord, 'date'>,
    label: string,
    description: string
  ) => {
    if (!todayRecord) return null;
    
    const isCompleted = todayRecord[taskKey];
    
    return (
      <TouchableOpacity 
        style={[
          styles.taskCard, 
          shadows.medium,
          !isCurrentDay && styles.disabledTaskCard
        ]} 
        onPress={() => toggleTask(taskKey)}
        activeOpacity={0.7}
        disabled={saving || !isCurrentDay}
      >
        <View style={styles.taskHeader}>
          <Text style={[
            styles.taskLabel,
            !isCurrentDay && styles.disabledText
          ]}>
            {label}
          </Text>
          <View style={[
            styles.checkbox, 
            isCompleted ? styles.checkboxChecked : {},
            !isCurrentDay && styles.disabledCheckbox
          ]}>
            {isCompleted && <Ionicons name="checkmark" size={18} color={isCurrentDay ? "#fff" : colors.textTertiary} />}
          </View>
        </View>
        <Text style={[
          styles.taskDescription,
          !isCurrentDay && styles.disabledText
        ]}>
          {description}
        </Text>
      </TouchableOpacity>
    );
  };

  // Add a function to check if all tasks are completed
  const areAllTasksCompleted = (): boolean => {
    if (!todayRecord) return false;
    
    return (
      todayRecord.workout1Completed &&
      todayRecord.workout2Completed &&
      todayRecord.dietFollowed &&
      todayRecord.read10PagesCompleted &&
      todayRecord.drink1GallonWaterCompleted &&
      todayRecord.takeProgressPhotoCompleted
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading today's tasks...</Text>
      </View>
    );
  }

  const allCompleted = areAllTasksCompleted();
  const progressPercentage = Math.min(100, Math.max(0, (dayNumber / 75) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Tasks</Text>
          <Text style={styles.date}>
            {todayRecord?.date || new Date().toISOString().split('T')[0]}
          </Text>
        </View>
        <View style={styles.dayCounter}>
          <Text style={styles.dayNumber}>Day {dayNumber}</Text>
          <Text style={styles.dayTotal}>of 75</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% complete
        </Text>
      </View>
      
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={24} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadTodayData}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
      
      {!isCurrentDay && (
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={24} color={colors.warning} />
          <Text style={styles.warningText}>
            You can only track tasks for the current day
          </Text>
        </View>
      )}
      
      {isCurrentDay && allCompleted && (
        <View style={styles.completionBanner}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.completionText}>All tasks completed for today!</Text>
        </View>
      )}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTaskItem(
          'workout1Completed',
          'First Workout',
          'Complete a 45-minute workout (one must be outdoors)'
        )}
        
        {renderTaskItem(
          'workout2Completed',
          'Second Workout',
          'Complete another 45-minute workout (one must be outdoors)'
        )}
        
        {renderTaskItem(
          'dietFollowed',
          'Follow Diet Plan',
          'Stick to your chosen diet with zero cheat meals'
        )}
        
        {renderTaskItem(
          'read10PagesCompleted',
          'Read 10 Pages',
          'Read 10 pages of a non-fiction book'
        )}
        
        {renderTaskItem(
          'drink1GallonWaterCompleted',
          'Drink Water',
          'Drink 1 gallon (3.8 liters) of water'
        )}
        
        {renderTaskItem(
          'takeProgressPhotoCompleted',
          'Progress Photo',
          'Take a progress picture'
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  dayCounter: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadows.small,
  },
  dayNumber: {
    ...typography.callout,
    fontWeight: '700',
    color: colors.card,
  },
  dayTotal: {
    ...typography.caption2,
    color: colors.card,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  title: {
    ...typography.title1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  savingText: {
    ...typography.footnote,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  taskLabel: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.text,
  },
  taskDescription: {
    ...typography.subhead,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20', // 20% opacity version of success color
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  completionText: {
    ...typography.callout,
    color: colors.success,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  disabledTaskCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  disabledCheckbox: {
    borderColor: colors.textTertiary,
    backgroundColor: isCompleted => isCompleted ? colors.textTertiary : 'transparent',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20', // 20% opacity
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  warningText: {
    ...typography.callout,
    color: colors.warning,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.progressBackground || '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.progressFill || colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption1,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});

export default TodayScreen;