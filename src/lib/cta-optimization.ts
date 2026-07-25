// CTA Optimization System with A/B testing and behavioral targeting

import { logger } from './logger';

export interface CTAVariant {
  id: string;
  name: string;
  text: string;
  style: 'primary' | 'secondary' | 'outline' | 'ghost';
  color?: 'teal' | 'orange' | 'blue' | 'purple';
  icon?: string;
  urgency?: string; // "Limited time", "This week only", etc.
  social_proof?: string; // "Join 5,000+ leaders", etc.
  value_prop?: string; // "Free", "£10k fixed price", etc.
}

export interface CTATest {
  id: string;
  name: string;
  context: {
    page?: string;
    position?: string;
    audience?: string;
  };
  variants: CTAVariant[];
  status: 'draft' | 'running' | 'completed' | 'paused';
  traffic_split: number; // Percentage of traffic to include in test
  start_date?: Date;
  end_date?: Date;
  min_sample_size: number;
  confidence_level: number; // 95, 99, etc.
  primary_metric: 'clicks' | 'conversions' | 'bookings';
  results?: {
    variant_id: string;
    impressions: number;
    clicks: number;
    conversions: number;
    conversion_rate: number;
    confidence: number;
    statistical_significance: boolean;
  }[];
}

export interface UserContext {
  sessionId: string;
  userId?: string;
  email?: string;
  
  // Behavioral data
  pageViews: number;
  timeOnSite: number;
  scrollDepth: number;
  previousPages: string[];
  source?: string;
  utmParams?: Record<string, string>;
  
  // Lead scoring
  leadScore: number;
  interactions: string[];
  emailSubscriber: boolean;
  hasDownloadedResource: boolean;
  hasUsedCalculator: boolean;
  
  // Demographic/firmographic
  company?: string;
  role?: string;
  industry?: string;
  companySize?: 'startup' | 'scaleup' | 'midmarket' | 'enterprise';
  
  // Device/technical
  device: 'mobile' | 'tablet' | 'desktop';
  location?: string;
  timezone?: string;
}

export interface CTARecommendation {
  ctaType: 'quickwin' | 'demo' | 'strategy' | 'implementation' | 'resource' | 'newsletter';
  variant: CTAVariant;
  confidence: number;
  reasoning: string[];
  position: 'hero' | 'sidebar' | 'inline' | 'exit' | 'floating';
  timing?: 'immediate' | 'scroll' | 'time' | 'exit_intent';
}

// In-memory storage for development (replace with database in production)
const ctaTests: CTATest[] = [];
const userSessions: Map<string, UserContext> = new Map();
const ctaInteractions: Array<{
  sessionId: string;
  testId?: string;
  variantId?: string;
  action: 'impression' | 'click' | 'conversion';
  timestamp: Date;
  context: any;
}> = [];

// Predefined CTA variants for different contexts
export const CTA_VARIANTS = {
  quickwin_primary: [
    {
      id: 'qw_primary_1',
      name: 'Direct Value',
      text: 'Get £10k QuickWin',
      style: 'primary' as const,
      color: 'orange' as const,
      value_prop: '£10k fixed price'
    },
    {
      id: 'qw_primary_2', 
      name: 'Action Focused',
      text: 'Start Your QuickWin',
      style: 'primary' as const,
      color: 'orange' as const,
      urgency: 'Limited availability'
    },
    {
      id: 'qw_primary_3',
      name: 'Outcome Focused',
      text: 'Surface Hidden Risks in 2 Weeks',
      style: 'primary' as const,
      color: 'teal' as const,
      value_prop: '2-week results'
    }
  ],
  
  demo_secondary: [
    {
      id: 'demo_sec_1',
      name: 'Product Focus',
      text: 'See Change Radar Demo',
      style: 'secondary' as const,
      color: 'teal' as const
    },
    {
      id: 'demo_sec_2',
      name: 'Benefit Focus', 
      text: 'See Transformation Intelligence',
      style: 'secondary' as const,
      color: 'blue' as const
    },
    {
      id: 'demo_sec_3',
      name: 'Social Proof',
      text: 'See What HSBC Uses',
      style: 'secondary' as const,
      color: 'teal' as const,
      social_proof: 'Used by HSBC & Santander'
    }
  ],

  newsletter_tertiary: [
    {
      id: 'newsletter_1',
      name: 'Community Focus',
      text: 'Join 5,000+ Leaders',
      style: 'outline' as const,
      social_proof: '5,000+ executives'
    },
    {
      id: 'newsletter_2',
      name: 'Value Focus',
      text: 'Get Weekly Insights',
      style: 'outline' as const,
      value_prop: 'Free weekly insights'
    },
    {
      id: 'newsletter_3',
      name: 'Urgency Focus',
      text: 'Don\'t Miss Next Week\'s Insight',
      style: 'outline' as const,
      urgency: 'Next edition Tuesday'
    }
  ]
};

/**
 * Get optimal CTA recommendation based on user context
 */
export function getCTARecommendation(
  userContext: UserContext,
  pageContext: {
    page: string;
    position: string;
    existing_ctas?: string[];
  }
): CTARecommendation {
  const { leadScore, interactions, pageViews, timeOnSite, hasUsedCalculator, role, companySize } = userContext;
  const { page, position } = pageContext;

  let ctaType: CTARecommendation['ctaType'] = 'newsletter';
  let confidence = 0.5;
  const reasoning: string[] = [];
  let timing: CTARecommendation['timing'] = 'immediate';

  // High-intent user detection
  if (leadScore >= 70 || hasUsedCalculator || interactions.includes('quickwin')) {
    ctaType = 'quickwin';
    confidence = 0.9;
    reasoning.push('High lead score indicates QuickWin readiness');
  }
  // Medium-high intent with product interest
  else if (leadScore >= 50 && (page.includes('demo') || page.includes('change-radar'))) {
    ctaType = 'demo';
    confidence = 0.8;
    reasoning.push('Medium-high lead score with product interest');
  }
  // Senior role suggests higher-value offerings
  else if (role && /\b(ceo|cto|cfo|director|vp|head of|chief)\b/i.test(role)) {
    if (leadScore >= 40) {
      ctaType = 'quickwin';
      confidence = 0.7;
      reasoning.push('Senior role with engagement suggests QuickWin potential');
    } else {
      ctaType = 'strategy';
      confidence = 0.8;
      reasoning.push('Senior role suggests strategy consultation');
    }
  }
  // Enterprise context
  else if (companySize === 'enterprise' && leadScore >= 30) {
    ctaType = 'demo';
    confidence = 0.7;
    reasoning.push('Enterprise context with engagement suggests demo interest');
  }
  // High engagement suggests escalation
  else if (timeOnSite > 180 && pageViews >= 3) {
    ctaType = pageContext.page === 'blog' ? 'newsletter' : 'strategy';
    confidence = 0.6;
    reasoning.push('High engagement suggests interest escalation');
    timing = 'scroll';
  }
  // Page-specific defaults
  else if (page === 'services' || page === 'consulting') {
    ctaType = 'quickwin';
    confidence = 0.6;
    reasoning.push('Services page context suggests conversion intent');
  }
  else if (page === 'about' || page === 'demo') {
    ctaType = 'demo';
    confidence = 0.7;
    reasoning.push('About/demo page suggests product interest');
  }
  else if (page === 'blog') {
    ctaType = 'newsletter';
    confidence = 0.8;
    reasoning.push('Blog context ideal for newsletter subscription');
    timing = 'time';
  }

  // Select variant based on context
  let variants: CTAVariant[] = [];
  if (ctaType === 'quickwin') {
    variants = CTA_VARIANTS.quickwin_primary;
  } else if (ctaType === 'demo') {
    variants = CTA_VARIANTS.demo_secondary;
  } else {
    variants = CTA_VARIANTS.newsletter_tertiary;
  }

  // Choose variant based on user characteristics
  let selectedVariant = variants[0];
  if (role && /\b(ceo|cto|cfo)\b/i.test(role)) {
    // C-level prefers direct value propositions
    selectedVariant = variants.find(v => v.value_prop) || variants[0];
  } else if (companySize === 'enterprise') {
    // Enterprise prefers social proof
    selectedVariant = variants.find(v => v.social_proof) || variants[0];
  } else if (leadScore < 30) {
    // Low engagement prefers urgency
    selectedVariant = variants.find(v => v.urgency) || variants[0];
  }

  return {
    ctaType,
    variant: selectedVariant,
    confidence,
    reasoning,
    position: position as CTARecommendation['position'],
    timing
  };
}

/**
 * Create A/B test for CTA optimization
 */
export function createCTATest(test: Omit<CTATest, 'id' | 'results'>): string {
  const testId = `cta_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newTest: CTATest = {
    ...test,
    id: testId,
    status: 'draft'
  };
  
  ctaTests.push(newTest);
  
  logger.info('CTA test created', {
    testId,
    name: test.name,
    variants: test.variants.length,
    context: test.context
  });
  
  return testId;
}

/**
 * Get CTA variant for user (handles A/B testing)
 */
export function getCTAVariant(
  testId: string,
  sessionId: string,
  userContext?: UserContext
): CTAVariant | null {
  const test = ctaTests.find(t => t.id === testId);
  if (!test || test.status !== 'running') {
    return null;
  }

  // Determine if user should be included in test
  const includeInTest = Math.random() < (test.traffic_split / 100);
  if (!includeInTest) {
    return null;
  }

  // Use consistent variant assignment based on session ID
  const sessionHash = hashString(sessionId);
  const variantIndex = sessionHash % test.variants.length;
  const variant = test.variants[variantIndex];

  // Track impression
  trackCTAInteraction({
    sessionId,
    testId,
    variantId: variant.id,
    action: 'impression',
    timestamp: new Date(),
    context: userContext
  });

  return variant;
}

/**
 * Track CTA interaction (impression, click, conversion)
 */
export function trackCTAInteraction(interaction: {
  sessionId: string;
  testId?: string;
  variantId?: string;
  action: 'impression' | 'click' | 'conversion';
  timestamp: Date;
  context?: any;
}): void {
  ctaInteractions.push({
    ...interaction,
    context: interaction.context || {}
  });
  
  logger.info('CTA interaction tracked', {
    action: interaction.action,
    testId: interaction.testId,
    variantId: interaction.variantId,
    sessionId: interaction.sessionId
  });

  // Update test results if this is part of an A/B test
  if (interaction.testId && interaction.variantId) {
    updateTestResults(interaction.testId);
  }
}

/**
 * Update user context with new behavioral data
 */
export function updateUserContext(sessionId: string, updates: Partial<UserContext>): void {
  const existing = userSessions.get(sessionId) || {
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
    device: 'desktop' as const
  };

  const updated = { ...existing, ...updates };
  userSessions.set(sessionId, updated);
}

/**
 * Calculate lead score based on user behavior
 */
export function calculateLeadScore(userContext: UserContext): number {
  let score = 0;

  // Engagement scoring
  if (userContext.timeOnSite > 300) score += 20; // 5+ minutes
  if (userContext.pageViews >= 5) score += 15;
  if (userContext.scrollDepth > 75) score += 10;

  // Intent signals
  if (userContext.hasUsedCalculator) score += 25;
  if (userContext.hasDownloadedResource) score += 15;
  if (userContext.emailSubscriber) score += 10;

  // High-intent interactions
  if (userContext.interactions.includes('quickwin')) score += 30;
  if (userContext.interactions.includes('demo')) score += 20;
  if (userContext.interactions.includes('services')) score += 15;

  // Demographic scoring
  if (userContext.role && /\b(ceo|cto|cfo|director|vp)\b/i.test(userContext.role)) score += 20;
  if (userContext.companySize === 'enterprise') score += 15;
  if (userContext.companySize === 'midmarket') score += 10;

  return Math.min(score, 100);
}

/**
 * Get CTA test results and statistical significance
 */
export function getCTATestResults(testId: string): CTATest | null {
  return ctaTests.find(t => t.id === testId) || null;
}

/**
 * Update test results with current data
 */
function updateTestResults(testId: string): void {
  const test = ctaTests.find(t => t.id === testId);
  if (!test) return;

  const testInteractions = ctaInteractions.filter(i => i.testId === testId);
  
  const results = test.variants.map(variant => {
    const variantInteractions = testInteractions.filter(i => i.variantId === variant.id);
    const impressions = variantInteractions.filter(i => i.action === 'impression').length;
    const clicks = variantInteractions.filter(i => i.action === 'click').length;
    const conversions = variantInteractions.filter(i => i.action === 'conversion').length;
    
    const conversion_rate = impressions > 0 ? (conversions / impressions) * 100 : 0;
    
    return {
      variant_id: variant.id,
      impressions,
      clicks,
      conversions,
      conversion_rate,
      confidence: calculateStatisticalConfidence(impressions, conversions, test.variants.length),
      statistical_significance: impressions >= test.min_sample_size
    };
  });

  test.results = results;
}

/**
 * Simple statistical confidence calculation
 */
function calculateStatisticalConfidence(impressions: number, conversions: number, variants: number): number {
  if (impressions < 30) return 0; // Need minimum sample size
  
  const conversionRate = conversions / impressions;
  const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / impressions);
  const marginOfError = 1.96 * standardError; // 95% confidence interval
  
  // Simplified confidence score (0-100)
  const confidence = Math.max(0, Math.min(100, (1 - marginOfError) * 100));
  
  return confidence;
}

/**
 * Simple hash function for consistent variant assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get CTA analytics for monitoring and optimization
 */
export function getCTAAnalytics(): {
  totalInteractions: number;
  conversionRate: number;
  topPerformingVariants: Array<{
    variantId: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }>;
  testResults: Array<{
    testId: string;
    status: string;
    confidence: number;
    winningVariant?: string;
  }>;
} {
  const totalInteractions = ctaInteractions.length;
  const conversions = ctaInteractions.filter(i => i.action === 'conversion').length;
  const impressions = ctaInteractions.filter(i => i.action === 'impression').length;
  const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;

  // Calculate top performing variants
  const variantPerformance = new Map<string, { impressions: number; conversions: number }>();
  
  ctaInteractions.forEach(interaction => {
    if (interaction.variantId) {
      const current = variantPerformance.get(interaction.variantId) || { impressions: 0, conversions: 0 };
      if (interaction.action === 'impression') current.impressions++;
      if (interaction.action === 'conversion') current.conversions++;
      variantPerformance.set(interaction.variantId, current);
    }
  });

  const topPerformingVariants = Array.from(variantPerformance.entries())
    .map(([variantId, stats]) => ({
      variantId,
      impressions: stats.impressions,
      conversions: stats.conversions,
      conversionRate: stats.impressions > 0 ? (stats.conversions / stats.impressions) * 100 : 0
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 10);

  // Test results summary
  const testResults = ctaTests.map(test => {
    const avgConfidence = test.results ? 
      test.results.reduce((sum, r) => sum + r.confidence, 0) / test.results.length : 0;
    
    const winningVariant = test.results ? 
      test.results.reduce((best, current) => 
        current.conversion_rate > best.conversion_rate ? current : best
      ).variant_id : undefined;

    return {
      testId: test.id,
      status: test.status,
      confidence: avgConfidence,
      winningVariant
    };
  });

  return {
    totalInteractions,
    conversionRate,
    topPerformingVariants,
    testResults
  };
}