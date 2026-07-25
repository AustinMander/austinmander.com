// Automated email nurture sequence scheduler and manager

import { sendEmail } from './email';
import { env, isEmailConfigured } from './env';
import { logger } from './logger';
import { sendNurtureEmail, UserSegment } from './email-templates';

export interface NurtureSubscription {
  id: string;
  userEmail: string;
  userName?: string;
  userCompany?: string;
  userIndustry?: string;
  sequenceType: 'quickwin' | 'resource' | 'newsletter' | 'demo';
  currentDay: number;
  startDate: Date;
  lastEmailSent?: Date;
  status: 'active' | 'paused' | 'completed' | 'unsubscribed';
  leadScore?: number;
  source?: string;
  additionalData?: {
    resourceName?: string;
    calculatorResult?: number;
    demoViewed?: boolean;
  };
}

// In-memory storage for development (replace with database in production)
const nurtureSubscriptions: NurtureSubscription[] = [];

// Email sequence schedules (days from start)
const SEQUENCE_SCHEDULES = {
  quickwin: [0, 2, 5, 9, 14],
  resource: [0, 3, 7],
  newsletter: [0, 3, 7],
  demo: [0, 3]
};

/**
 * Subscribe a user to a nurture sequence
 */
export async function subscribeToNurture(
  userEmail: string,
  sequenceType: 'quickwin' | 'resource' | 'newsletter' | 'demo',
  userData: {
    name?: string;
    company?: string;
    industry?: string;
    leadScore?: number;
    source?: string;
    additionalData?: any;
  } = {}
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    // Check if user is already subscribed to this sequence
    const existingSubscription = nurtureSubscriptions.find(
      sub => sub.userEmail === userEmail && 
             sub.sequenceType === sequenceType && 
             sub.status === 'active'
    );

    if (existingSubscription) {
      return { success: false, error: 'User already subscribed to this sequence' };
    }

    // Create new subscription
    const subscription: NurtureSubscription = {
      id: `nurture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userEmail,
      userName: userData.name,
      userCompany: userData.company,
      userIndustry: userData.industry,
      sequenceType,
      currentDay: 0,
      startDate: new Date(),
      status: 'active',
      leadScore: userData.leadScore,
      source: userData.source,
      additionalData: userData.additionalData
    };

    nurtureSubscriptions.push(subscription);

    // Send the first email immediately (day 0)
    await sendNurtureEmailForSubscription(subscription);

    logger.info(`User subscribed to ${sequenceType} nurture sequence`, {
      email: userEmail,
      sequenceType,
      subscriptionId: subscription.id
    });

    return { success: true, subscriptionId: subscription.id };
  } catch (error) {
    logger.error('Failed to subscribe to nurture sequence', error, {
      email: userEmail,
      sequenceType
    });
    return { success: false, error: 'Failed to subscribe to nurture sequence' };
  }
}

/**
 * Unsubscribe a user from all nurture sequences
 */
export async function unsubscribeFromAllNurture(userEmail: string): Promise<boolean> {
  try {
    const userSubscriptions = nurtureSubscriptions.filter(
      sub => sub.userEmail === userEmail && sub.status === 'active'
    );

    userSubscriptions.forEach(sub => {
      sub.status = 'unsubscribed';
    });

    logger.info('User unsubscribed from all nurture sequences', { email: userEmail });
    return true;
  } catch (error) {
    logger.error('Failed to unsubscribe from nurture sequences', error, { email: userEmail });
    return false;
  }
}

/**
 * Process all nurture sequences and send due emails
 * This should be called by a cron job or scheduled task
 */
export async function processNurtureSequences(): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn('Email not configured, skipping nurture sequence processing');
    return;
  }

  const now = new Date();
  const activeSubscriptions = nurtureSubscriptions.filter(sub => sub.status === 'active');

  logger.info(`Processing ${activeSubscriptions.length} active nurture subscriptions`);

  for (const subscription of activeSubscriptions) {
    try {
      await processSubscription(subscription, now);
    } catch (error) {
      logger.error('Error processing nurture subscription', error, {
        subscriptionId: subscription.id,
        email: subscription.userEmail
      });
    }
  }
}

/**
 * Process a single subscription
 */
async function processSubscription(subscription: NurtureSubscription, now: Date): Promise<void> {
  const daysSinceStart = Math.floor(
    (now.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const schedule = SEQUENCE_SCHEDULES[subscription.sequenceType];
  const nextEmailDay = schedule.find(day => day > subscription.currentDay);

  // Check if it's time for the next email
  if (nextEmailDay !== undefined && daysSinceStart >= nextEmailDay) {
    // Check if we haven't already sent this email
    const lastEmailDate = subscription.lastEmailSent;
    if (!lastEmailDate || daysSinceStart > subscription.currentDay) {
      await sendNurtureEmailForSubscription(subscription, nextEmailDay);
      subscription.currentDay = nextEmailDay;
      subscription.lastEmailSent = now;
    }
  }

  // Mark sequence as completed if we've sent all emails
  const maxDay = Math.max(...schedule);
  if (subscription.currentDay >= maxDay) {
    subscription.status = 'completed';
    logger.info('Nurture sequence completed', {
      subscriptionId: subscription.id,
      email: subscription.userEmail,
      sequenceType: subscription.sequenceType
    });
  }
}

/**
 * Send a nurture email for a specific subscription
 */
async function sendNurtureEmailForSubscription(
  subscription: NurtureSubscription,
  day?: number
): Promise<void> {
  const emailDay = day ?? subscription.currentDay;
  
  const user: UserSegment = {
    type: subscription.sequenceType === 'quickwin' ? 'quickwin_lead' :
          subscription.sequenceType === 'resource' ? 'resource_downloader' :
          subscription.sequenceType === 'newsletter' ? 'newsletter_subscriber' :
          'demo_requester',
    email: subscription.userEmail,
    name: subscription.userName,
    company: subscription.userCompany,
    industry: subscription.userIndustry,
    leadScore: subscription.leadScore,
    source: subscription.source
  };

  const emailTemplate = await sendNurtureEmail(
    subscription.sequenceType,
    emailDay,
    user,
    subscription.additionalData
  );

  const result = await sendEmail({
    from: env.EMAIL_FROM,
    to: subscription.userEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html
  });

  if (result.success) {
    logger.info('Nurture email sent successfully', {
      subscriptionId: subscription.id,
      email: subscription.userEmail,
      sequenceType: subscription.sequenceType,
      day: emailDay,
      subject: emailTemplate.subject
    });
  } else {
    logger.error('Failed to send nurture email', undefined, {
      subscriptionId: subscription.id,
      email: subscription.userEmail,
      error: result.error
    });
    throw new Error(`Failed to send nurture email: ${result.error}`);
  }
}

/**
 * Get subscription status for a user
 */
export function getUserNurtureStatus(userEmail: string): NurtureSubscription[] {
  return nurtureSubscriptions.filter(sub => sub.userEmail === userEmail);
}

/**
 * Get all active subscriptions (for admin/monitoring)
 */
export function getAllActiveSubscriptions(): NurtureSubscription[] {
  return nurtureSubscriptions.filter(sub => sub.status === 'active');
}

/**
 * Pause a nurture sequence
 */
export function pauseNurtureSequence(subscriptionId: string): boolean {
  const subscription = nurtureSubscriptions.find(sub => sub.id === subscriptionId);
  if (subscription) {
    subscription.status = 'paused';
    logger.info('Nurture sequence paused', { subscriptionId });
    return true;
  }
  return false;
}

/**
 * Resume a paused nurture sequence
 */
export function resumeNurtureSequence(subscriptionId: string): boolean {
  const subscription = nurtureSubscriptions.find(sub => sub.id === subscriptionId);
  if (subscription && subscription.status === 'paused') {
    subscription.status = 'active';
    logger.info('Nurture sequence resumed', { subscriptionId });
    return true;
  }
  return false;
}

/**
 * Get nurture sequence analytics
 */
export function getNurtureAnalytics(): {
  totalSubscriptions: number;
  activeSubscriptions: number;
  completedSequences: number;
  unsubscribed: number;
  bySequenceType: Record<string, number>;
  byStatus: Record<string, number>;
} {
  const total = nurtureSubscriptions.length;
  const active = nurtureSubscriptions.filter(sub => sub.status === 'active').length;
  const completed = nurtureSubscriptions.filter(sub => sub.status === 'completed').length;
  const unsubscribed = nurtureSubscriptions.filter(sub => sub.status === 'unsubscribed').length;

  const bySequenceType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  nurtureSubscriptions.forEach(sub => {
    bySequenceType[sub.sequenceType] = (bySequenceType[sub.sequenceType] || 0) + 1;
    byStatus[sub.status] = (byStatus[sub.status] || 0) + 1;
  });

  return {
    totalSubscriptions: total,
    activeSubscriptions: active,
    completedSequences: completed,
    unsubscribed,
    bySequenceType,
    byStatus
  };
}

// Helper functions for common subscription triggers

/**
 * Trigger QuickWin nurture sequence for contact form submissions
 */
export async function triggerQuickWinNurture(
  email: string, 
  name?: string, 
  company?: string,
  leadScore?: number,
  source = 'contact_form'
) {
  return subscribeToNurture(email, 'quickwin', {
    name,
    company,
    leadScore,
    source
  });
}

/**
 * Trigger resource downloader nurture sequence
 */
export async function triggerResourceNurture(
  email: string,
  resourceName: string,
  name?: string,
  source = 'resource_download'
) {
  return subscribeToNurture(email, 'resource', {
    name,
    source,
    additionalData: { resourceName }
  });
}

/**
 * Trigger newsletter welcome sequence
 */
export async function triggerNewsletterNurture(
  email: string,
  name?: string,
  source = 'newsletter_signup'
) {
  return subscribeToNurture(email, 'newsletter', {
    name,
    source
  });
}

/**
 * Trigger demo follow-up sequence
 */
export async function triggerDemoNurture(
  email: string,
  name?: string,
  company?: string,
  source = 'demo_request'
) {
  return subscribeToNurture(email, 'demo', {
    name,
    company,
    source,
    additionalData: { demoViewed: true }
  });
}