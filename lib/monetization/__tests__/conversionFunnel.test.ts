import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { conversionFunnelManager } from '../conversionFunnel';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('ConversionFunnelManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the manager's internal state
    conversionFunnelManager['journeys'].clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeJourney', () => {
    it('creates new journey for new session', () => {
      const journey = conversionFunnelManager.initializeJourney('session123', 'user456');

      expect(journey).toEqual({
        sessionId: 'session123',
        userId: 'user456',
        events: [],
        currentStage: 'awareness',
        usageCount: 0,
        lastActivity: expect.any(Date),
        conversionScore: 0
      });
    });

    it('returns existing journey for existing session', () => {
      const journey1 = conversionFunnelManager.initializeJourney('session123');
      const journey2 = conversionFunnelManager.initializeJourney('session123');

      expect(journey1).toBe(journey2);
    });
  });

  describe('trackEvent', () => {
    it('tracks events and updates journey', () => {
      conversionFunnelManager.trackEvent('session123', {
        event: 'analysis_complete',
        category: 'engagement',
        userId: 'user456'
      });

      const journey = conversionFunnelManager['journeys'].get('session123');
      expect(journey).toBeDefined();
      expect(journey!.events).toHaveLength(1);
      expect(journey!.events[0]).toEqual({
        userId: 'user456',
        sessionId: 'session123',
        event: 'analysis_complete',
        category: 'engagement',
        timestamp: expect.any(Date)
      });
      expect(journey!.usageCount).toBe(1);
    });

    it('updates usage count for analysis events', () => {
      conversionFunnelManager.trackEvent('session123', {
        event: 'analysis_complete',
        category: 'engagement'
      });

      conversionFunnelManager.trackEvent('session123', {
        event: 'analysis_complete',
        category: 'engagement'
      });

      const journey = conversionFunnelManager['journeys'].get('session123');
      expect(journey!.usageCount).toBe(2);
    });

    it('does not update usage count for non-analysis events', () => {
      conversionFunnelManager.trackEvent('session123', {
        event: 'page_view',
        category: 'engagement'
      });

      const journey = conversionFunnelManager['journeys'].get('session123');
      expect(journey!.usageCount).toBe(0);
    });
  });

  describe('getConversionOpportunities', () => {
    it('returns usage limit prompt when limit reached', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.usageCount = 5;

      const opportunity = conversionFunnelManager.getConversionOpportunities('session123');

      expect(opportunity).toEqual({
        shouldShowUpgradePrompt: true,
        promptType: 'usage_limit',
        urgency: 'high',
        message: 'You\'ve reached your daily limit. Upgrade for unlimited access!'
      });
    });

    it('returns feature access prompt when approaching limit', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.usageCount = 4;

      const opportunity = conversionFunnelManager.getConversionOpportunities('session123');

      expect(opportunity).toEqual({
        shouldShowUpgradePrompt: true,
        promptType: 'feature_access',
        urgency: 'medium',
        message: 'Only 1 analysis left today. Upgrade for unlimited access and premium features!'
      });
    });

    it('returns analysis complete prompt after analysis', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.usageCount = 2;
      journey.events.push({
        sessionId: 'session123',
        event: 'analysis_complete',
        category: 'engagement',
        timestamp: new Date()
      });

      const opportunity = conversionFunnelManager.getConversionOpportunities('session123');

      expect(opportunity).toEqual({
        shouldShowUpgradePrompt: true,
        promptType: 'analysis_complete',
        urgency: 'low',
        message: 'Want more detailed insights? Upgrade for advanced analytics and AI recommendations!'
      });
    });

    it('returns ad removal prompt for engaged users', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.conversionScore = 0.4;
      journey.events.push({
        sessionId: 'session123',
        event: 'ad_view',
        category: 'monetization',
        timestamp: new Date()
      });

      const opportunity = conversionFunnelManager.getConversionOpportunities('session123');

      expect(opportunity).toEqual({
        shouldShowUpgradePrompt: true,
        promptType: 'ad_removal',
        urgency: 'low',
        message: 'Enjoy an ad-free experience with premium features!'
      });
    });

    it('returns no prompt for new users', () => {
      const opportunity = conversionFunnelManager.getConversionOpportunities('new_session');

      expect(opportunity).toEqual({
        shouldShowUpgradePrompt: false,
        promptType: 'feature_access',
        urgency: 'low',
        message: ''
      });
    });
  });

  describe('getJourneyAnalytics', () => {
    it('returns analytics for existing journey', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.usageCount = 3;
      journey.conversionScore = 0.5;
      journey.currentStage = 'interest';
      journey.events.push(
        {
          sessionId: 'session123',
          event: 'analysis_complete',
          category: 'engagement',
          timestamp: new Date(Date.now() - 10000) // 10 seconds ago
        },
        {
          sessionId: 'session123',
          event: 'pricing_view',
          category: 'engagement',
          timestamp: new Date()
        }
      );

      const analytics = conversionFunnelManager.getJourneyAnalytics('session123');

      expect(analytics).toEqual({
        stage: 'interest',
        score: 0.5,
        usageCount: 3,
        eventCount: 2,
        timeSpent: expect.any(Number),
        conversionProbability: expect.any(Number)
      });
    });

    it('returns null for non-existent journey', () => {
      const analytics = conversionFunnelManager.getJourneyAnalytics('non_existent');
      expect(analytics).toBeNull();
    });
  });

  describe('conversion stage updates', () => {
    it('updates stage to conversion on upgrade click', () => {
      conversionFunnelManager.trackEvent('session123', {
        event: 'upgrade_click',
        category: 'conversion'
      });

      const journey = conversionFunnelManager['journeys'].get('session123');
      expect(journey!.currentStage).toBe('conversion');
    });

    it('updates stage to consideration on pricing view', () => {
      conversionFunnelManager.trackEvent('session123', {
        event: 'pricing_view',
        category: 'engagement'
      });

      const journey = conversionFunnelManager['journeys'].get('session123');
      expect(journey!.currentStage).toBe('consideration');
    });

    it('updates stage to interest after analyses', () => {
      conversionFunnelManager.trackEvent('session123', {
        event: 'analysis_complete',
        category: 'engagement'
      });
      conversionFunnelManager.trackEvent('session123', {
        event: 'analysis_complete',
        category: 'engagement'
      });

      const journey = conversionFunnelManager['journeys'].get('session123');
      expect(journey!.currentStage).toBe('interest');
    });
  });

  describe('conversion score calculation', () => {
    it('calculates score based on usage', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.usageCount = 3;
      conversionFunnelManager['calculateConversionScore'](journey);

      expect(journey.conversionScore).toBeGreaterThan(0);
      expect(journey.conversionScore).toBeLessThanOrEqual(1);
    });

    it('increases score with engagement events', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.events = [
        { sessionId: 'session123', event: 'analysis_complete', category: 'engagement', timestamp: new Date() },
        { sessionId: 'session123', event: 'feature_view', category: 'engagement', timestamp: new Date() },
        { sessionId: 'session123', event: 'help_view', category: 'engagement', timestamp: new Date() }
      ];
      conversionFunnelManager['calculateConversionScore'](journey);

      expect(journey.conversionScore).toBeGreaterThan(0);
    });

    it('increases score with intent events', () => {
      const journey = conversionFunnelManager.initializeJourney('session123');
      journey.events = [
        { sessionId: 'session123', event: 'pricing_view', category: 'engagement', timestamp: new Date() },
        { sessionId: 'session123', event: 'upgrade_prompt_view', category: 'engagement', timestamp: new Date() }
      ];
      conversionFunnelManager['calculateConversionScore'](journey);

      expect(journey.conversionScore).toBeGreaterThan(0);
    });
  });

  describe('localStorage integration', () => {
    it('saves journey data to localStorage', () => {
      conversionFunnelManager.trackEvent('session123', {
        event: 'test_event',
        category: 'engagement'
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'conversion_journey',
        expect.any(String)
      );
    });

    it('loads journey data from localStorage', () => {
      const mockData = JSON.stringify([
        {
          sessionId: 'session123',
          userId: 'user456',
          events: [
            {
              sessionId: 'session123',
              event: 'test_event',
              category: 'engagement',
              timestamp: new Date().toISOString()
            }
          ],
          currentStage: 'awareness',
          usageCount: 1,
          lastActivity: new Date().toISOString(),
          conversionScore: 0.1
        }
      ]);

      localStorageMock.getItem.mockReturnValue(mockData);

      // Create new instance to test loading
      const testManager = new (conversionFunnelManager.constructor as any)();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('conversion_journey');
    });
  });
});