/**
 * Conversion Funnel Management
 * Tracks user journey and optimizes conversion opportunities
 */

export interface ConversionEvent {
  userId?: string;
  sessionId: string;
  event: string;
  category: 'engagement' | 'conversion' | 'monetization';
  value?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface UserJourney {
  sessionId: string;
  userId?: string;
  events: ConversionEvent[];
  currentStage: 'awareness' | 'interest' | 'consideration' | 'conversion';
  usageCount: number;
  lastActivity: Date;
  conversionScore: number;
}

class ConversionFunnelManager {
  private journeys: Map<string, UserJourney> = new Map();
  private readonly STORAGE_KEY = 'conversion_journey';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Initialize or get user journey
   */
  initializeJourney(sessionId: string, userId?: string): UserJourney {
    let journey = this.journeys.get(sessionId);
    
    if (!journey) {
      journey = {
        sessionId,
        userId,
        events: [],
        currentStage: 'awareness',
        usageCount: 0,
        lastActivity: new Date(),
        conversionScore: 0
      };
      this.journeys.set(sessionId, journey);
    }

    return journey;
  }

  /**
   * Track conversion event
   */
  trackEvent(sessionId: string, event: Omit<ConversionEvent, 'sessionId' | 'timestamp'>): void {
    const journey = this.initializeJourney(sessionId, event.userId);
    
    const conversionEvent: ConversionEvent = {
      ...event,
      sessionId,
      timestamp: new Date()
    };

    journey.events.push(conversionEvent);
    journey.lastActivity = new Date();
    
    // Update usage count for analysis events
    if (event.event === 'analysis_complete') {
      journey.usageCount++;
    }

    // Update conversion stage and score
    this.updateConversionStage(journey);
    this.calculateConversionScore(journey);
    
    this.saveToStorage();
  }

  /**
   * Get conversion opportunities for user
   */
  getConversionOpportunities(sessionId: string): {
    shouldShowUpgradePrompt: boolean;
    promptType: 'usage_limit' | 'feature_access' | 'ad_removal' | 'analysis_complete';
    urgency: 'low' | 'medium' | 'high';
    message: string;
  } {
    const journey = this.journeys.get(sessionId);
    
    if (!journey) {
      return {
        shouldShowUpgradePrompt: false,
        promptType: 'feature_access',
        urgency: 'low',
        message: ''
      };
    }

    // Usage limit reached
    if (journey.usageCount >= 5) {
      return {
        shouldShowUpgradePrompt: true,
        promptType: 'usage_limit',
        urgency: 'high',
        message: 'You\'ve reached your daily limit. Upgrade for unlimited access!'
      };
    }

    // High usage, approaching limit
    if (journey.usageCount >= 4) {
      return {
        shouldShowUpgradePrompt: true,
        promptType: 'feature_access',
        urgency: 'medium',
        message: 'Only 1 analysis left today. Upgrade for unlimited access and premium features!'
      };
    }

    // After analysis completion
    if (journey.events.some(e => e.event === 'analysis_complete') && journey.usageCount >= 2) {
      return {
        shouldShowUpgradePrompt: true,
        promptType: 'analysis_complete',
        urgency: 'low',
        message: 'Want more detailed insights? Upgrade for advanced analytics and AI recommendations!'
      };
    }

    // Ad removal opportunity
    if (journey.events.some(e => e.event === 'ad_view') && journey.conversionScore > 0.3) {
      return {
        shouldShowUpgradePrompt: true,
        promptType: 'ad_removal',
        urgency: 'low',
        message: 'Enjoy an ad-free experience with premium features!'
      };
    }

    return {
      shouldShowUpgradePrompt: false,
      promptType: 'feature_access',
      urgency: 'low',
      message: ''
    };
  }

  /**
   * Update conversion stage based on user behavior
   */
  private updateConversionStage(journey: UserJourney): void {
    const events = journey.events;
    const recentEvents = events.filter(e => 
      Date.now() - e.timestamp.getTime() < 30 * 60 * 1000 // Last 30 minutes
    );

    if (recentEvents.some(e => e.event === 'upgrade_click')) {
      journey.currentStage = 'conversion';
    } else if (recentEvents.some(e => e.event === 'pricing_view' || e.event === 'feature_comparison')) {
      journey.currentStage = 'consideration';
    } else if (journey.usageCount >= 2 || recentEvents.some(e => e.event === 'analysis_complete')) {
      journey.currentStage = 'interest';
    } else {
      journey.currentStage = 'awareness';
    }
  }

  /**
   * Calculate conversion score (0-1)
   */
  private calculateConversionScore(journey: UserJourney): void {
    let score = 0;

    // Usage-based scoring
    score += Math.min(journey.usageCount / 5, 0.4); // Max 0.4 for usage

    // Engagement scoring
    const engagementEvents = journey.events.filter(e => 
      ['analysis_complete', 'feature_view', 'help_view'].includes(e.event)
    );
    score += Math.min(engagementEvents.length / 10, 0.3); // Max 0.3 for engagement

    // Intent scoring
    const intentEvents = journey.events.filter(e => 
      ['pricing_view', 'upgrade_prompt_view', 'feature_comparison'].includes(e.event)
    );
    score += Math.min(intentEvents.length / 5, 0.3); // Max 0.3 for intent

    journey.conversionScore = Math.min(score, 1);
  }

  /**
   * Get user journey analytics
   */
  getJourneyAnalytics(sessionId: string): {
    stage: string;
    score: number;
    usageCount: number;
    eventCount: number;
    timeSpent: number;
    conversionProbability: number;
  } | null {
    const journey = this.journeys.get(sessionId);
    
    if (!journey) return null;

    const timeSpent = journey.events.length > 0 
      ? Date.now() - journey.events[0].timestamp.getTime()
      : 0;

    return {
      stage: journey.currentStage,
      score: journey.conversionScore,
      usageCount: journey.usageCount,
      eventCount: journey.events.length,
      timeSpent,
      conversionProbability: this.calculateConversionProbability(journey)
    };
  }

  /**
   * Calculate conversion probability based on journey data
   */
  private calculateConversionProbability(journey: UserJourney): number {
    let probability = journey.conversionScore;

    // Boost probability based on usage patterns
    if (journey.usageCount >= 4) probability += 0.2;
    if (journey.usageCount >= 5) probability += 0.3;

    // Boost probability based on engagement time
    const sessionDuration = Date.now() - journey.events[0]?.timestamp.getTime() || 0;
    if (sessionDuration > 10 * 60 * 1000) probability += 0.1; // 10+ minutes
    if (sessionDuration > 30 * 60 * 1000) probability += 0.2; // 30+ minutes

    return Math.min(probability, 1);
  }

  /**
   * Save journey data to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.journeys.entries()).map(([sessionId, journey]) => ({
        sessionId,
        ...journey,
        events: journey.events.slice(-50) // Keep only last 50 events
      }));
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversion journey data:', error);
    }
  }

  /**
   * Load journey data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const journeys = JSON.parse(data);
        journeys.forEach((journey: any) => {
          // Convert timestamp strings back to Date objects
          journey.events = journey.events.map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp)
          }));
          journey.lastActivity = new Date(journey.lastActivity);
          
          this.journeys.set(journey.sessionId, journey);
        });
      }
    } catch (error) {
      console.error('Failed to load conversion journey data:', error);
    }
  }

  /**
   * Clean up old journey data
   */
  cleanup(): void {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    
    for (const [sessionId, journey] of this.journeys.entries()) {
      if (journey.lastActivity.getTime() < cutoffTime) {
        this.journeys.delete(sessionId);
      }
    }
    
    this.saveToStorage();
  }
}

// Singleton instance
export const conversionFunnelManager = new ConversionFunnelManager();

// Clean up old data on initialization
if (typeof window !== 'undefined') {
  conversionFunnelManager.cleanup();
}