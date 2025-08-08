import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { BRAND_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { WorkspaceService } from '../services/workspaceService';

type OnboardingStep = 'welcome' | 'workspace-choice' | 'create-workspace' | 'complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, isNewUser, clearNewUserFlag } = useAuthStore();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
    type: 'company' as 'company' | 'nonprofit' | 'government' | 'education' | 'other',
  });

  const checkExistingWorkspaces = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.id);
      setWorkspaces(userWorkspaces);
      
      if (userWorkspaces.length === 0) {
        // User has no workspaces, show workspace creation options
        setStep('workspace-choice');
      } else {
        // User already has workspaces, clear new user flag and redirect
        clearNewUserFlag();
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Error checking workspaces:', error);
      setStep('workspace-choice');
    } finally {
      setLoading(false);
    }
  }, [user, router, clearNewUserFlag]);

  useEffect(() => {
    checkExistingWorkspaces();
  }, [checkExistingWorkspaces]);

  const handleCreateWorkspace = async () => {
    if (!user || !workspaceForm.name) return;

    try {
      setLoading(true);
      
      const workspaceData = {
        name: workspaceForm.name,
        description: workspaceForm.description,
        type: workspaceForm.type,
        ownerId: user.id,
      };
      
      const workspaceId = await WorkspaceService.createWorkspace(workspaceData, user.id);
      
      setStep('complete');
      
      Alert.alert(
        'Workspace Created',
        `${workspaceForm.name} has been created successfully!`,
        [{ text: 'OK' }]
      );
      
      // Clear new user flag before redirecting
      clearNewUserFlag();
      
      // Redirect to dashboard
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating workspace:', error);
      Alert.alert(
        'Error',
        'Failed to create workspace. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="sparkles" size={40} color="#ffffff" />
        </View>
        <Text style={styles.title}>Welcome to SPT Teams!</Text>
        <Text style={styles.subtitle}>
          Let's get your workspace set up in just a few steps
        </Text>
        
        <Card variant="elevated" padding="lg" style={styles.card}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
              <Text style={styles.loadingText}>Preparing your workspace...</Text>
            </View>
          ) : (
            <Button
              title="Get Started"
              variant="primary"
              size="lg"
              onPress={() => setStep('workspace-choice')}
              style={styles.fullWidthButton}
            />
          )}
        </Card>
      </View>
    </View>
  );

  const renderWorkspaceChoiceStep = () => (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Path</Text>
        <Text style={styles.subtitle}>
          How would you like to get started?
        </Text>
        
        <Card variant="elevated" padding="lg" style={styles.card}>
          <TouchableOpacity
            style={styles.choiceButton}
            onPress={() => setStep('create-workspace')}
          >
            <View style={styles.choiceIcon}>
              <Ionicons name="add-circle" size={28} color={BRAND_COLORS.primary} />
            </View>
            <View style={styles.choiceContent}>
              <Text style={styles.choiceTitle}>Create New Workspace</Text>
              <Text style={styles.choiceDescription}>
                Start fresh and build your organization from scratch
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.invitationSection}>
            <View style={styles.invitationHeader}>
              <Ionicons name="link" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.invitationTitle}>Have an invitation?</Text>
            </View>
            <Text style={styles.invitationDescription}>
              Use your invitation link to join an existing workspace
            </Text>
            <Button
              title="Join with Invitation Link"
              variant="secondary"
              onPress={() => {
                Alert.alert(
                  'Coming Soon',
                  'Invitation flow will be implemented soon.',
                  [{ text: 'OK' }]
                );
              }}
              style={styles.fullWidthButton}
            />
          </View>
        </Card>
      </View>
    </View>
  );

  const renderCreateWorkspaceStep = () => (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Workspace</Text>
        <Text style={styles.subtitle}>
          Set up your organization's digital headquarters
        </Text>
        
        <Card variant="elevated" padding="lg" style={styles.card}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Workspace Name <Text style={styles.required}>*</Text>
              </Text>
              <Input
                placeholder="e.g., Standard Pensions Trust"
                value={workspaceForm.name}
                onChangeText={(text) => setWorkspaceForm({ ...workspaceForm, name: text })}
                style={styles.input}
              />
              <Text style={styles.helperText}>
                This is your organization's name
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <Input
                placeholder="Brief description of your organization"
                value={workspaceForm.description}
                onChangeText={(text) => setWorkspaceForm({ ...workspaceForm, description: text })}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Type</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  Alert.alert(
                    'Organization Type',
                    'Select organization type',
                    [
                      { text: 'Company', onPress: () => setWorkspaceForm({ ...workspaceForm, type: 'company' }) },
                      { text: 'Non-Profit', onPress: () => setWorkspaceForm({ ...workspaceForm, type: 'nonprofit' }) },
                      { text: 'Government', onPress: () => setWorkspaceForm({ ...workspaceForm, type: 'government' }) },
                      { text: 'Education', onPress: () => setWorkspaceForm({ ...workspaceForm, type: 'education' }) },
                      { text: 'Other', onPress: () => setWorkspaceForm({ ...workspaceForm, type: 'other' }) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.selectText}>
                  {workspaceForm.type.charAt(0).toUpperCase() + workspaceForm.type.slice(1)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                title="Back"
                variant="outline"
                onPress={() => setStep('workspace-choice')}
                disabled={loading}
                style={styles.halfWidthButton}
              />
              <Button
                title={loading ? 'Creating...' : 'Create Workspace'}
                variant="primary"
                onPress={handleCreateWorkspace}
                disabled={loading || !workspaceForm.name}
                style={styles.halfWidthButton}
              />
            </View>
          </View>
        </Card>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card variant="elevated" padding="lg" style={styles.card}>
          <View style={styles.completeContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={styles.completeTitle}>All Set!</Text>
            <Text style={styles.completeDescription}>
              Your workspace "{workspaceForm.name}" is ready!
            </Text>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
              <Text style={styles.loadingText}>Redirecting you to your dashboard...</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      {step === 'welcome' && renderWelcomeStep()}
      {step === 'workspace-choice' && renderWorkspaceChoiceStep()}
      {step === 'create-workspace' && renderCreateWorkspaceStep()}
      {step === 'complete' && renderCompleteStep()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  card: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
    marginTop: SPACING.md,
  },
  fullWidthButton: {
    width: '100%',
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${BRAND_COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  choiceContent: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#1e293b',
    marginBottom: SPACING.xs,
  },
  choiceDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#6b7280',
    marginHorizontal: SPACING.md,
    textTransform: 'uppercase',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  invitationSection: {
    padding: SPACING.md,
    backgroundColor: '#f8fafc',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  invitationTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.primary,
    marginLeft: SPACING.xs,
  },
  invitationDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
    marginBottom: SPACING.md,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#1e293b',
    marginBottom: SPACING.xs,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    marginBottom: SPACING.xs,
  },
  helperText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#6b7280',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
  },
  selectText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#1e293b',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  halfWidthButton: {
    flex: 1,
  },
  completeContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  completeTitle: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1e293b',
    marginBottom: SPACING.sm,
  },
  completeDescription: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
