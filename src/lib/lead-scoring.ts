/**
 * Lead Scoring Engine
 *
 * Calculates a 0-100 score for each lead based on behavioral signals.
 * Hot (70-100), Warm (40-69), Cold (0-39).
 */

export interface ScoreFactors {
  hasPhone?: boolean;
  hasEmail?: boolean;
  respondedWhatsApp?: boolean;
  pagesViewed?: number;
  timeOnSiteMinutes?: number;
  viewedHighValueTreatment?: boolean; // laser, botox, filler
  formSubmitted?: boolean;
  responseSpeedUnder5Min?: boolean;
  referredByClient?: boolean;
  repeatVisitor?: boolean;
}

export interface ScoreResult {
  score: number;
  label: 'hot' | 'warm' | 'cold';
  factors: Record<string, number>;
}

const SCORE_WEIGHTS = {
  hasPhone: { points: 10, max: 10 },
  hasEmail: { points: 5, max: 5 },
  respondedWhatsApp: { points: 15, max: 15 },
  pagesViewed: { pointsPer: 2, max: 10 },
  timeOnSiteMinutes: { pointsPer: 1, max: 10 },
  viewedHighValueTreatment: { points: 10, max: 10 },
  formSubmitted: { points: 15, max: 15 },
  responseSpeedUnder5Min: { points: 10, max: 10 },
  referredByClient: { points: 10, max: 10 },
  repeatVisitor: { points: 5, max: 5 },
} as const;

export function calculateLeadScore(factors: ScoreFactors): ScoreResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  if (factors.hasPhone) {
    breakdown.hasPhone = SCORE_WEIGHTS.hasPhone.points;
  }
  if (factors.hasEmail) {
    breakdown.hasEmail = SCORE_WEIGHTS.hasEmail.points;
  }
  if (factors.respondedWhatsApp) {
    breakdown.respondedWhatsApp = SCORE_WEIGHTS.respondedWhatsApp.points;
  }
  if (factors.pagesViewed && factors.pagesViewed > 0) {
    breakdown.pagesViewed = Math.min(
      factors.pagesViewed * SCORE_WEIGHTS.pagesViewed.pointsPer,
      SCORE_WEIGHTS.pagesViewed.max,
    );
  }
  if (factors.timeOnSiteMinutes && factors.timeOnSiteMinutes > 0) {
    breakdown.timeOnSiteMinutes = Math.min(
      factors.timeOnSiteMinutes * SCORE_WEIGHTS.timeOnSiteMinutes.pointsPer,
      SCORE_WEIGHTS.timeOnSiteMinutes.max,
    );
  }
  if (factors.viewedHighValueTreatment) {
    breakdown.viewedHighValueTreatment = SCORE_WEIGHTS.viewedHighValueTreatment.points;
  }
  if (factors.formSubmitted) {
    breakdown.formSubmitted = SCORE_WEIGHTS.formSubmitted.points;
  }
  if (factors.responseSpeedUnder5Min) {
    breakdown.responseSpeedUnder5Min = SCORE_WEIGHTS.responseSpeedUnder5Min.points;
  }
  if (factors.referredByClient) {
    breakdown.referredByClient = SCORE_WEIGHTS.referredByClient.points;
  }
  if (factors.repeatVisitor) {
    breakdown.repeatVisitor = SCORE_WEIGHTS.repeatVisitor.points;
  }

  for (const v of Object.values(breakdown)) {
    total += v;
  }
  // Clamp to 100
  total = Math.min(total, 100);

  return {
    score: total,
    label: getScoreLabel(total),
    factors: breakdown,
  };
}

export function getScoreLabel(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-amber-500';
  return 'text-blue-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-red-100 text-red-700 border-red-200';
  if (score >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}

export function getScoreIcon(score: number): string {
  if (score >= 70) return '🔥';
  if (score >= 40) return '☀️';
  return '❄️';
}

/** Factor display names for UI */
export const FACTOR_LABELS: Record<string, string> = {
  hasPhone: 'Has phone number',
  hasEmail: 'Has email address',
  respondedWhatsApp: 'Responded on WhatsApp',
  pagesViewed: 'Pages viewed',
  timeOnSiteMinutes: 'Time on site',
  viewedHighValueTreatment: 'Viewed high-value treatment',
  formSubmitted: 'Form submitted',
  responseSpeedUnder5Min: 'Fast response (<5 min)',
  referredByClient: 'Client referral',
  repeatVisitor: 'Repeat visitor',
};

/**
 * Build ScoreFactors from a raw lead database row.
 * This allows server-side recalculation from DB fields.
 */
export function buildFactorsFromLead(lead: Record<string, unknown>): ScoreFactors {
  const HIGH_VALUE_TREATMENTS = ['laser', 'botox', 'filler', 'hydrafacial', 'prp'];

  const treatmentsViewed = (lead.treatments_viewed as string[]) || [];
  const hasHighValue = treatmentsViewed.some((t) =>
    HIGH_VALUE_TREATMENTS.some((hv) => t.toLowerCase().includes(hv)),
  );

  // Check interest field for high-value keywords too
  const interest = ((lead.interest as string) || '').toLowerCase();
  const interestHighValue = HIGH_VALUE_TREATMENTS.some((hv) => interest.includes(hv));

  return {
    hasPhone: !!(lead.phone as string),
    hasEmail: !!(lead.email as string),
    respondedWhatsApp: ((lead.whatsapp_messages as number) || 0) > 0,
    pagesViewed: (lead.pages_viewed as number) || 0,
    timeOnSiteMinutes: Math.floor(((lead.time_on_site as number) || 0) / 60),
    viewedHighValueTreatment: hasHighValue || interestHighValue,
    formSubmitted: ((lead.form_submissions as number) || 0) > 0,
    responseSpeedUnder5Min: false, // Computed separately from response_time data
    referredByClient: ((lead.source as string) || '').toLowerCase() === 'referral',
    repeatVisitor: ((lead.pages_viewed as number) || 0) > 3,
  };
}
