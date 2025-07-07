import { RealAIDataService } from '../ai-data-service-real';
import type {
  PersonalMetrics,
  ReportInsights
} from '../ai-types/ai-interfaces';
import { MockDataService } from './mock-data-service';

// =============================================================================
// PERSONAL & REPORT SERVICE (Personal metrics and report insights)
// =============================================================================

export class PersonalReportService {
  // Get personal metrics with real Firestore data
  static async getPersonalMetrics(workspaceId: string, userId: string): Promise<PersonalMetrics> {
    try {
      console.log('🔍 Fetching real personal metrics from Firestore...');
      const realMetrics = await RealAIDataService.getPersonalMetrics(workspaceId, userId);
      console.log('✅ Successfully fetched real personal metrics:', realMetrics);
      return realMetrics;
    } catch (error) {
      console.error('❌ Error getting real personal metrics, falling back to mock:', error);
      return MockDataService.getMockPersonalMetrics();
    }
  }

  // Get report insights with real Firestore data
  static async getReportInsights(workspaceId: string, userId: string): Promise<ReportInsights> {
    try {
      console.log('🔍 Fetching real report insights from Firestore...');
      const realInsights = await RealAIDataService.getReportInsights(workspaceId, userId);
      console.log('✅ Successfully fetched real report insights:', realInsights);
      return realInsights;
    } catch (error) {
      console.error('❌ Error getting real report insights, falling back to mock:', error);
      return MockDataService.getMockReportInsights();
    }
  }
}
