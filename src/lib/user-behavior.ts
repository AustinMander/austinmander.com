// User behavior tracking for CTA optimization and personalization

import { updateUserContext, calculateLeadScore, type UserContext } from './cta-optimization';
import { logger } from './logger';

// Re-export UserContext type
export type { UserContext } from './cta-optimization';

export interface BehaviorEvent {
  sessionId: string;
  userId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  page: string;
  url: string;
}

export interface PageView {
  sessionId: string;
  page: string;
  url: string;
  timestamp: Date;
  timeOnPage?: number;
  scrollDepth?: number;
  exitPage?: boolean;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: PageView[];
  events: BehaviorEvent[];
  source?: string;
  utmParams?: Record<string, string>;
  device: 'mobile' | 'tablet' | 'desktop';
  location?: string;
  leadScore: number;
}

// In-memory storage for development (replace with database/analytics service in production)
const userSessions: Map<string, UserSession> = new Map();
const behaviorEvents: BehaviorEvent[] = [];

/**
 * Initialize user session tracking
 */
export function initializeSession(sessionId: string, options: {
  userId?: string;
  source?: string;
  utmParams?: Record<string, string>;
  device?: 'mobile' | 'tablet' | 'desktop';
  location?: string;
}): void {
  const session: UserSession = {
    sessionId,
    userId: options.userId,
    startTime: new Date(),
    lastActivity: new Date(),
    pageViews: [],
    events: [],
    source: options.source,
    utmParams: options.utmParams,
    device: options.device || 'desktop',
    location: options.location,
    leadScore: 0
  };

  userSessions.set(sessionId, session);
  
  logger.info('User session initialized', {
    sessionId,
    userId: options.userId,
    source: options.source,
    device: options.device
  });
}

/**
 * Track page view
 */
export function trackPageView(sessionId: string, page: string, url: string): void {
  const session = userSessions.get(sessionId);
  if (!session) {
    // Initialize session if it doesn't exist
    initializeSession(sessionId, { device: getDeviceType() });
  }

  const pageView: PageView = {
    sessionId,
    page,
    url,
    timestamp: new Date()
  };

  const updatedSession = userSessions.get(sessionId)!;
  
  // Mark previous page view as not the exit page and calculate time on page
  if (updatedSession.pageViews.length > 0) {
    const previousView = updatedSession.pageViews[updatedSession.pageViews.length - 1];
    previousView.exitPage = false;
    previousView.timeOnPage = pageView.timestamp.getTime() - previousView.timestamp.getTime();
  }

  updatedSession.pageViews.push(pageView);
  updatedSession.lastActivity = new Date();

  // Update user context for CTA optimization
  updateUserContext(sessionId, {
    sessionId,
    pageViews: updatedSession.pageViews.length,
    timeOnSite: calculateTotalTimeOnSite(updatedSession),
    previousPages: updatedSession.pageViews.map(pv => pv.page),
    source: updatedSession.source,
    utmParams: updatedSession.utmParams,
    device: updatedSession.device,
    location: updatedSession.location,
    leadScore: calculateLeadScore(getUserContext(sessionId))
  });

  logger.info('Page view tracked', {
    sessionId,
    page,
    totalPageViews: updatedSession.pageViews.length
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(sessionId: string, scrollDepth: number): void {
  const session = userSessions.get(sessionId);
  if (!session || session.pageViews.length === 0) return;

  const currentPageView = session.pageViews[session.pageViews.length - 1];
  currentPageView.scrollDepth = Math.max(currentPageView.scrollDepth || 0, scrollDepth);

  // Track significant scroll milestones
  if (scrollDepth >= 25 && scrollDepth < 50) {
    trackEvent(sessionId, 'scroll_25', { scroll_depth: scrollDepth });
  } else if (scrollDepth >= 50 && scrollDepth < 75) {
    trackEvent(sessionId, 'scroll_50', { scroll_depth: scrollDepth });
  } else if (scrollDepth >= 75 && scrollDepth < 90) {
    trackEvent(sessionId, 'scroll_75', { scroll_depth: scrollDepth });
  } else if (scrollDepth >= 90) {
    trackEvent(sessionId, 'scroll_90', { scroll_depth: scrollDepth });
  }

  // Update user context
  updateUserContext(sessionId, {
    scrollDepth: currentPageView.scrollDepth || 0,
    leadScore: calculateLeadScore(getUserContext(sessionId))
  });
}

/**
 * Track user event
 */
export function trackEvent(sessionId: string, event: string, properties: Record<string, any> = {}): void {
  const session = userSessions.get(sessionId);
  if (!session) return;

  const behaviorEvent: BehaviorEvent = {
    sessionId,
    userId: session.userId,
    event,
    properties,
    timestamp: new Date(),
    page: session.pageViews[session.pageViews.length - 1]?.page || 'unknown',
    url: session.pageViews[session.pageViews.length - 1]?.url || 'unknown'
  };

  session.events.push(behaviorEvent);
  behaviorEvents.push(behaviorEvent);
  session.lastActivity = new Date();

  // Update interactions based on event
  const userContext = getUserContext(sessionId);
  const newInteractions = [...userContext.interactions];

  // Map events to interaction types
  if (event === 'cta_click' && properties.cta_type) {
    newInteractions.push(properties.cta_type);
  }
  if (event === 'resource_download') {
    newInteractions.push('resource_download');
    updateUserContext(sessionId, { hasDownloadedResource: true });
  }
  if (event === 'calculator_used') {
    newInteractions.push('calculator_used');
    updateUserContext(sessionId, { hasUsedCalculator: true });
  }
  if (event === 'email_signup') {
    updateUserContext(sessionId, { emailSubscriber: true });
  }
  if (event === 'quickwin_inquiry') {
    newInteractions.push('quickwin');
  }
  if (event === 'demo_request') {
    newInteractions.push('demo');
  }

  // Update user context with new interactions
  updateUserContext(sessionId, {
    interactions: newInteractions,
    leadScore: calculateLeadScore(getUserContext(sessionId))
  });

  logger.info('User event tracked', {
    sessionId,
    event,
    page: behaviorEvent.page,
    properties
  });
}

/**
 * Track time-based milestones
 */
export function trackTimeOnSite(sessionId: string): void {
  const session = userSessions.get(sessionId);
  if (!session) return;

  const timeOnSite = calculateTotalTimeOnSite(session);
  const minutes = Math.floor(timeOnSite / 60000);

  // Track time milestones
  if (minutes === 1) {
    trackEvent(sessionId, 'time_1_minute', { time_on_site: timeOnSite });
  } else if (minutes === 3) {
    trackEvent(sessionId, 'time_3_minutes', { time_on_site: timeOnSite });
  } else if (minutes === 5) {
    trackEvent(sessionId, 'time_5_minutes', { time_on_site: timeOnSite });
  } else if (minutes === 10) {
    trackEvent(sessionId, 'time_10_minutes', { time_on_site: timeOnSite });
  }

  updateUserContext(sessionId, {
    timeOnSite,
    leadScore: calculateLeadScore(getUserContext(sessionId))
  });
}

/**
 * Track exit intent
 */
export function trackExitIntent(sessionId: string): void {
  const session = userSessions.get(sessionId);
  trackEvent(sessionId, 'exit_intent', {
    time_on_site: session ? calculateTotalTimeOnSite(session) : 0,
    page_views: session?.pageViews.length || 0
  });
}

/**
 * Update user profile information
 */
export function updateUserProfile(sessionId: string, profile: {
  email?: string;
  name?: string;
  company?: string;
  role?: string;
  industry?: string;
  companySize?: 'startup' | 'scaleup' | 'midmarket' | 'enterprise';
}): void {
  const session = userSessions.get(sessionId);
  if (!session) return;

  updateUserContext(sessionId, {
    email: profile.email,
    company: profile.company,
    role: profile.role,
    industry: profile.industry,
    companySize: profile.companySize,
    leadScore: calculateLeadScore(getUserContext(sessionId))
  });

  trackEvent(sessionId, 'profile_updated', profile);
}

/**
 * Get user context for CTA optimization
 */
export function getUserContext(sessionId: string): UserContext {
  const session = userSessions.get(sessionId);
  if (!session) {
    return {
      sessionId,
      pageViews: 0,
      timeOnSite: 0,
      scrollDepth: 0,
      previousPages: [],
      leadScore: 0,
      interactions: [],
      emailSubscriber: false,
      hasDownloadedResource: false,
      hasUsedCalculator: false,
      device: 'desktop'
    };
  }

  const currentPageView = session.pageViews[session.pageViews.length - 1];
  
  return {
    sessionId,
    userId: session.userId,
    pageViews: session.pageViews.length,
    timeOnSite: calculateTotalTimeOnSite(session),
    scrollDepth: currentPageView?.scrollDepth || 0,
    previousPages: session.pageViews.map(pv => pv.page),
    source: session.source,
    utmParams: session.utmParams,
    leadScore: session.leadScore,
    interactions: session.events.map(e => e.event),
    emailSubscriber: session.events.some(e => e.event === 'email_signup'),
    hasDownloadedResource: session.events.some(e => e.event === 'resource_download'),
    hasUsedCalculator: session.events.some(e => e.event === 'calculator_used'),
    device: session.device,
    location: session.location
  };
}

/**
 * Get user session analytics
 */
export function getSessionAnalytics(sessionId: string): {
  session: UserSession | null;
  userContext: UserContext;
  leadScore: number;
  keyEvents: BehaviorEvent[];
  recommendations: {
    nextAction: string;
    confidence: number;
    reasoning: string[];
  };
} {
  const session = userSessions.get(sessionId);
  const userContext = getUserContext(sessionId);
  const leadScore = calculateLeadScore(userContext);

  // Get key events (high-value actions)
  const keyEvents = session?.events.filter(e => 
    ['cta_click', 'resource_download', 'calculator_used', 'email_signup', 'demo_request', 'quickwin_inquiry'].includes(e.event)
  ) || [];

  // Generate recommendations
  let nextAction = 'Continue browsing';
  let confidence = 0.5;
  const reasoning: string[] = [];

  if (leadScore >= 70) {
    nextAction = 'QuickWin consultation booking';
    confidence = 0.9;
    reasoning.push('High lead score indicates ready for high-value engagement');
  } else if (leadScore >= 50) {
    nextAction = 'Demo booking or resource download';
    confidence = 0.7;
    reasoning.push('Medium engagement suggests product interest');
  } else if (userContext.timeOnSite > 180 && userContext.pageViews >= 3) {
    nextAction = 'Email signup for nurturing';
    confidence = 0.6;
    reasoning.push('Extended engagement suggests serious interest');
  } else if (userContext.pageViews === 1 && userContext.timeOnSite < 60) {
    nextAction = 'Engage with valuable content';
    confidence = 0.8;
    reasoning.push('New visitor needs value demonstration');
  }

  return {
    session: session || null,
    userContext,
    leadScore,
    keyEvents,
    recommendations: {
      nextAction,
      confidence,
      reasoning
    }
  };
}

/**
 * Get behavior analytics across all sessions
 */
export function getBehaviorAnalytics(): {
  totalSessions: number;
  totalPageViews: number;
  avgTimeOnSite: number;
  avgPageViews: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ event: string; count: number }>;
  conversionFunnel: {
    visitors: number;
    emailSignups: number;
    resourceDownloads: number;
    calculatorUsers: number;
    demoRequests: number;
    quickWinInquiries: number;
  };
  leadScoreDistribution: Array<{ range: string; count: number }>;
} {
  const sessions = Array.from(userSessions.values());
  const totalSessions = sessions.length;
  const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews.length, 0);
  const avgTimeOnSite = sessions.reduce((sum, s) => sum + calculateTotalTimeOnSite(s), 0) / totalSessions;
  const avgPageViews = totalPageViews / totalSessions;

  // Top pages
  const pageViewCounts = new Map<string, number>();
  sessions.forEach(session => {
    session.pageViews.forEach(pv => {
      pageViewCounts.set(pv.page, (pageViewCounts.get(pv.page) || 0) + 1);
    });
  });
  const topPages = Array.from(pageViewCounts.entries())
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Top events
  const eventCounts = new Map<string, number>();
  behaviorEvents.forEach(event => {
    eventCounts.set(event.event, (eventCounts.get(event.event) || 0) + 1);
  });
  const topEvents = Array.from(eventCounts.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Conversion funnel
  const emailSignups = behaviorEvents.filter(e => e.event === 'email_signup').length;
  const resourceDownloads = behaviorEvents.filter(e => e.event === 'resource_download').length;
  const calculatorUsers = behaviorEvents.filter(e => e.event === 'calculator_used').length;
  const demoRequests = behaviorEvents.filter(e => e.event === 'demo_request').length;
  const quickWinInquiries = behaviorEvents.filter(e => e.event === 'quickwin_inquiry').length;

  // Lead score distribution
  const leadScores = sessions.map(s => s.leadScore);
  const leadScoreDistribution = [
    { range: '0-20', count: leadScores.filter(s => s >= 0 && s < 20).length },
    { range: '20-40', count: leadScores.filter(s => s >= 20 && s < 40).length },
    { range: '40-60', count: leadScores.filter(s => s >= 40 && s < 60).length },
    { range: '60-80', count: leadScores.filter(s => s >= 60 && s < 80).length },
    { range: '80-100', count: leadScores.filter(s => s >= 80 && s <= 100).length }
  ];

  return {
    totalSessions,
    totalPageViews,
    avgTimeOnSite,
    avgPageViews,
    topPages,
    topEvents,
    conversionFunnel: {
      visitors: totalSessions,
      emailSignups,
      resourceDownloads,
      calculatorUsers,
      demoRequests,
      quickWinInquiries
    },
    leadScoreDistribution
  };
}

/**
 * Helper function to calculate total time on site
 */
function calculateTotalTimeOnSite(session: UserSession): number {
  if (session.pageViews.length === 0) return 0;
  
  const start = session.startTime;
  const end = session.lastActivity;
  
  return end.getTime() - start.getTime();
}

/**
 * Helper function to detect device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Clean up old sessions (call periodically)
 */
export function cleanupOldSessions(maxAgeHours: number = 24): void {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  
  for (const [sessionId, session] of userSessions.entries()) {
    if (session.lastActivity < cutoff) {
      userSessions.delete(sessionId);
      
      // Remove associated events
      const sessionEvents = behaviorEvents.filter(e => e.sessionId === sessionId);
      sessionEvents.forEach(event => {
        const index = behaviorEvents.indexOf(event);
        if (index > -1) behaviorEvents.splice(index, 1);
      });
    }
  }
  
  logger.info('Old sessions cleaned up', {
    sessionsRemaining: userSessions.size,
    eventsRemaining: behaviorEvents.length
  });
}