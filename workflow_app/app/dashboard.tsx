import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { BRAND_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStats } from '../types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  console.log('🏠 Dashboard screen loaded, user:', user?.email);
  
  useEffect(() => {
    console.log('🏠 Dashboard useEffect triggered');
  }, []);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingReports: 0,
    activeTeams: 0,
    totalFiles: 0,
    totalFolders: 0,
    activityScore: 0,
    weeklyProgress: 0,
    recentActivity: [],
    upcomingDeadlines: [],
    notifications: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    // TODO: Implement actual data loading from Firebase
    // For now, using mock data
    setStats({
      totalTasks: 24,
      completedTasks: 18,
      pendingReports: 3,
      activeTeams: 5,
      totalFiles: 156,
      totalFolders: 23,
      activityScore: 85,
      weeklyProgress: 75,
      recentActivity: [
        {
          id: '1',
          type: 'task_completed',
          title: 'Task Completed',
          description: 'Project proposal finalized',
          timestamp: new Date(),
          userId: user?.id || '',
          workspaceId: user?.workspaceId || '',
        },
        {
          id: '2',
          type: 'expense_submitted',
          title: 'Expense Submitted',
          description: 'Travel expenses for client meeting',
          timestamp: new Date(Date.now() - 3600000),
          userId: user?.id || '',
          workspaceId: user?.workspaceId || '',
        },
      ],
      upcomingDeadlines: [
        {
          id: '1',
          title: 'Q4 Budget Review',
          dueDate: new Date(Date.now() + 86400000),
          type: 'task',
          priority: 'high',
        },
        {
          id: '2',
          title: 'Team Meeting',
          dueDate: new Date(Date.now() + 7200000),
          type: 'task',
          priority: 'medium',
        },
      ],
      notifications: [
        {
          id: '1',
          title: 'New Team Member',
          message: 'John Doe joined your team',
          type: 'info',
          read: false,
          timestamp: new Date(),
        },
      ],
    });
  }, [user?.id, user?.workspaceId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-task':
        Alert.alert('Coming Soon', 'Tasks feature will be implemented soon.');
        break;
      case 'submit-expense':
        Alert.alert('Coming Soon', 'Financial management will be implemented soon.');
        break;
      case 'schedule-meeting':
        Alert.alert('Coming Soon', 'Calendar feature will be implemented soon.');
        break;
      case 'ai-assistant':
        Alert.alert('Coming Soon', 'AI Assistant will be implemented soon.');
        break;
      default:
        break;
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, icon, color, onPress }: {
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#ffffff" />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle" size={40} color={BRAND_COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon="checkmark-circle"
          color={BRAND_COLORS.emerald}
          onPress={() => Alert.alert('Coming Soon', 'Tasks feature will be implemented soon.')}
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          icon="checkmark-done-circle"
          color={BRAND_COLORS.cyan}
        />
        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          icon="document-text"
          color={BRAND_COLORS.orange}
        />
        <StatCard
          title="Active Teams"
          value={stats.activeTeams}
          icon="people"
          color={BRAND_COLORS.indigo}
          onPress={() => Alert.alert('Coming Soon', 'Teams feature will be implemented soon.')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            title="Create Task"
            icon="add-circle"
            color={BRAND_COLORS.primary}
            onPress={() => handleQuickAction('create-task')}
          />
          <QuickActionCard
            title="Submit Expense"
            icon="receipt"
            color={BRAND_COLORS.emerald}
            onPress={() => handleQuickAction('submit-expense')}
          />
          <QuickActionCard
            title="Schedule Meeting"
            icon="calendar"
            color={BRAND_COLORS.cyan}
            onPress={() => handleQuickAction('schedule-meeting')}
          />
          <QuickActionCard
            title="AI Assistant"
            icon="flash"
            color={BRAND_COLORS.orange}
            onPress={() => handleQuickAction('ai-assistant')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats.recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons 
                name={activity.type === 'task_completed' ? 'checkmark-circle' : 'receipt'} 
                size={20} 
                color={BRAND_COLORS.primary} 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTime}>
                {activity.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
        {stats.upcomingDeadlines.map((deadline) => (
          <View key={deadline.id} style={styles.deadlineItem}>
            <View style={styles.deadlineIcon}>
              <Ionicons name="time" size={20} color={BRAND_COLORS.rose} />
            </View>
            <View style={styles.deadlineContent}>
              <Text style={styles.deadlineTitle}>{deadline.title}</Text>
              <Text style={styles.deadlineTime}>
                {deadline.dueDate.toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: deadline.priority === 'high' ? BRAND_COLORS.rose : BRAND_COLORS.orange }]}>
              <Text style={styles.priorityText}>{deadline.priority}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1e293b',
  },
  profileButton: {
    padding: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1e293b',
  },
  statTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#1e293b',
    marginBottom: SPACING.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#374151',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#1e293b',
    marginBottom: SPACING.xs,
  },
  activityDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
    marginBottom: SPACING.xs,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#9ca3af',
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  deadlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#1e293b',
    marginBottom: SPACING.xs,
  },
  deadlineTime: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
});
