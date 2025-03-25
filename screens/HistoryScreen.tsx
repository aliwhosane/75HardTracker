import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getChallengeProgress, saveChallengeProgress } from '../utils/storage';
import { DailyRecord } from '../types/DailyRecord';
import { ChallengeProgress } from '../types/ChallengeProgress';
import { colors, spacing, typography, shadows, borderRadius } from '../styles/theme';

const HistoryScreen = () => {
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const data = await getChallengeProgress();
      setProgress(data);
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAllTasksCompleted = (record: DailyRecord): boolean => {
    return (
      record.workout1Completed &&
      record.workout2Completed &&
      record.dietFollowed &&
      record.read10PagesCompleted &&
      record.drink1GallonWaterCompleted &&
      record.takeProgressPhotoCompleted
    );
  };

  const calculateCompletedTasks = (record: DailyRecord): number => {
    let count = 0;
    if (record.workout1Completed) count++;
    if (record.workout2Completed) count++;
    if (record.dietFollowed) count++;
    if (record.read10PagesCompleted) count++;
    if (record.drink1GallonWaterCompleted) count++;
    if (record.takeProgressPhotoCompleted) count++;
    return count;
  };

  const calculateCurrentStreak = (): number => {
    if (!progress || !progress.dailyRecords.length) return 0;
    
    let streak = 0;
    // Count consecutive completed days from the most recent day
    for (let i = progress.dailyRecords.length - 1; i >= 0; i--) {
      if (isAllTasksCompleted(progress.dailyRecords[i])) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateAttempts = (): number => {
    if (!progress) return 0;
    
    // An attempt is counted when there's a break in the streak
    let attempts = 0;
    let inStreak = false;
    
    for (let i = 0; i < progress.dailyRecords.length; i++) {
      const isCompleted = isAllTasksCompleted(progress.dailyRecords[i]);
      
      if (isCompleted && !inStreak) {
        // Starting a new streak
        attempts++;
        inStreak = true;
      } else if (!isCompleted) {
        // Broke the streak
        inStreak = false;
      }
    }
    
    return attempts;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderDayItem = ({ item, index }: { item: DailyRecord; index: number }) => {
    const allCompleted = isAllTasksCompleted(item);
    const tasksCompleted = calculateCompletedTasks(item);
    const totalTasks = 6; // Total number of tasks in the challenge
    
    return (
      <TouchableOpacity 
        style={[styles.dayCard, shadows.medium]} 
        activeOpacity={0.7}
      >
        <View style={styles.dayHeader}>
          <Text style={styles.dayDate}>{formatDate(item.date)}</Text>
          <View style={[
            styles.statusBadge,
            allCompleted ? styles.completedBadge : styles.incompleteBadge
          ]}>
            <Text style={[
              styles.statusText,
              allCompleted ? styles.completedText : styles.incompleteText
            ]}>
              {allCompleted ? 'Completed' : 'Incomplete'}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(tasksCompleted / totalTasks) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {tasksCompleted}/{totalTasks} tasks
          </Text>
        </View>
        
        <View style={styles.dayNumber}>
          <Text style={styles.dayNumberText}>Day {index + 1}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Add reset function
  const resetHistory = async () => {
    Alert.alert(
      "Reset Challenge History",
      "Are you sure you want to reset all your challenge data? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              setResetting(true);
              // Create empty progress object
              const emptyProgress = {
                dailyRecords: [],
                currentDayIndex: -1,
                startDate: "",
                isActive: false
              };
              
              // Save empty progress to storage
              await saveChallengeProgress(emptyProgress);
              
              // Update state
              setProgress(emptyProgress);
            } catch (error) {
              console.error('Error resetting history:', error);
              Alert.alert(
                "Error",
                "Failed to reset challenge history. Please try again."
              );
            } finally {
              setResetting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  const currentStreak = calculateCurrentStreak();
  const attempts = calculateAttempts();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Challenge History</Text>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetHistory}
          disabled={resetting || !progress || progress.dailyRecords.length === 0}
        >
          {resetting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Reset</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, shadows.small]}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        
        <View style={[styles.statCard, shadows.small]}>
          <Text style={styles.statValue}>
            {progress?.currentDayIndex !== undefined ? progress.currentDayIndex + 1 : 0}
          </Text>
          <Text style={styles.statLabel}>Current Day</Text>
        </View>
        
        <View style={[styles.statCard, shadows.small]}>
          <Text style={styles.statValue}>{attempts}</Text>
          <Text style={styles.statLabel}>Attempts</Text>
        </View>
      </View>
      
      {progress && progress.dailyRecords.length > 0 ? (
        <FlatList
          data={progress.dailyRecords}
          renderItem={renderDayItem}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyStateText}>No history data yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Complete your first day to see your progress here
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title1,
    color: colors.text,
    marginBottom: 0, // Remove bottom margin since it's in headerContainer
  },
  resetButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  resetButtonText: {
    ...typography.footnote,
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    ...typography.title2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption1,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayDate: {
    ...typography.callout,
    color: colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  completedBadge: {
    backgroundColor: colors.completedBadge,
  },
  incompleteBadge: {
    backgroundColor: colors.incompleteBadge,
  },
  statusText: {
    ...typography.caption1,
    fontWeight: '500',
  },
  completedText: {
    color: colors.primary,
  },
  incompleteText: {
    color: colors.error,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.progressBackground,
    borderRadius: 3,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.progressFill,
    borderRadius: 3,
  },
  progressText: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  dayNumber: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  dayNumberText: {
    ...typography.caption2,
    color: colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.title3,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.subhead,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: '80%',
  },
});

export default HistoryScreen;