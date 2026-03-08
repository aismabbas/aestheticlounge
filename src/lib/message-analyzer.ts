/**
 * Rule-based message sentiment analysis and agent communication quality scoring.
 * No external AI API calls — runs purely on keyword matching and pattern detection.
 */

// ─── Sentiment signals ──────────────────────────────────────────────────────

const POSITIVE_WORDS = [
  'thank you', 'thanks', 'thankyou', 'great', 'amazing', 'love', 'loved',
  'happy', 'perfect', 'excellent', 'wonderful', 'appreciate', 'recommend',
  'fantastic', 'awesome', 'beautiful', 'best', 'impressed', 'satisfied',
  'pleased', 'delighted', 'thrilled', 'grateful', 'brilliant', 'superb',
  'outstanding', 'good job', 'well done', 'nice', 'kind', 'helpful',
  'friendly', 'professional', 'smooth', 'easy', 'comfortable', 'clean',
  'gentle', 'painless', 'quick', 'fast',
];

const POSITIVE_EMOJI = ['😊', '❤️', '👍', '🙏', '✨', '💕', '😍', '🥰', '💯', '🌟', '⭐', '😁', '😄', '🎉', '💖', '♥️', '👏', '🤩'];

const NEGATIVE_WORDS = [
  'disappointed', 'bad', 'worst', 'terrible', 'angry', 'waiting',
  'no response', 'complaint', 'refund', 'unprofessional', 'rude',
  'horrible', 'awful', 'disgusting', 'unacceptable', 'frustrated',
  'frustrating', 'poor', 'never again', 'waste', 'scam', 'misleading',
  'lied', 'ignored', 'overcharged', 'hurt', 'painful', 'damage',
  'damaged', 'infection', 'swollen', 'bruise', 'scarring', 'burns',
  'allergic', 'reaction', 'not happy', 'unhappy', 'unsatisfied',
  'dissatisfied', 'regret', 'worse', 'still waiting', 'no reply',
  'not responding', 'unresponsive', 'cancel', 'sue', 'lawyer',
  'incompetent', 'careless', 'negligent',
];

const ANGRY_WORDS = [
  'furious', 'livid', 'outraged', 'disgusted', 'appalled', 'sue',
  'lawyer', 'legal action', 'report', 'police', 'scam', 'fraud',
  'never coming back', 'worst experience', 'ruined', 'destroyed',
];

const NEGATIVE_EMOJI = ['😡', '😤', '😢', '👎', '💢', '😠', '🤬', '😞', '😔', '😒', '😑', '🙄', '😩', '😫', '💔'];

const URGENCY_WORDS = [
  'urgent', 'emergency', 'asap', 'immediately', 'right now', 'today',
  'help', 'please hurry', 'can\'t wait', 'swelling', 'bleeding',
  'allergic reaction', 'pain', 'severe', 'critical',
];

const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  pricing: [/price/i, /cost/i, /how much/i, /fee/i, /charge/i, /rate/i, /afford/i, /expensive/i, /cheap/i, /discount/i, /deal/i, /offer/i, /pkr/i, /rs\.?\s?\d/i, /payment plan/i],
  booking: [/book/i, /appointment/i, /schedule/i, /slot/i, /available/i, /when can/i, /time/i, /date/i, /reschedule/i, /cancel/i, /tomorrow/i, /next week/i],
  complaint: [/complaint/i, /complain/i, /not happy/i, /disappointed/i, /problem/i, /issue/i, /wrong/i, /mistake/i, /poor/i, /bad experience/i, /refund/i],
  inquiry: [/what is/i, /how does/i, /tell me about/i, /information/i, /details/i, /explain/i, /which treatment/i, /recommend/i, /suitable/i, /options/i],
  followup: [/follow.?up/i, /check.?in/i, /how am i/i, /after.?care/i, /recovery/i, /healing/i, /results/i, /before.?and.?after/i, /progress/i, /side.?effect/i],
  treatment: [/botox/i, /filler/i, /laser/i, /hydrafacial/i, /peel/i, /prp/i, /mesotherapy/i, /micro.?needling/i, /thread.?lift/i, /lip/i, /skin/i, /acne/i, /pigment/i, /whitening/i, /anti.?aging/i, /wrinkle/i, /hair.?removal/i],
  greeting: [/^(hi|hello|hey|assalam|salam|aoa)/i, /good morning/i, /good evening/i, /good afternoon/i],
};

// ─── Agent quality signals ───────────────────────────────────────────────────

const GREETING_PATTERNS = [/^hi\b/i, /^hello\b/i, /^dear\b/i, /^good (morning|afternoon|evening)/i, /^hey\b/i, /^assalam/i, /^salam/i, /^welcome/i];

const PROFESSIONAL_CLOSINGS = [
  'thank you', 'thanks', 'best regards', 'regards', 'kind regards',
  'warm regards', 'looking forward', 'take care', 'have a great day',
  'have a wonderful day', 'see you soon', 'allah hafiz', 'khuda hafiz',
];

const EMPATHY_PHRASES = [
  'i understand', 'i\'m sorry', 'i am sorry', 'i appreciate',
  'i can see', 'that must be', 'i hear you', 'totally understand',
  'completely understand', 'we apologize', 'sorry for', 'sorry about',
  'we understand', 'don\'t worry', 'no worries', 'rest assured',
  'i feel for you', 'must be frustrating', 'must be difficult',
];

const HELPFULNESS_PHRASES = [
  'happy to help', 'glad to assist', 'glad to help', 'here to help',
  'let me help', 'i can help', 'we can help', 'i\'d be happy',
  'we\'d be happy', 'absolutely', 'of course', 'certainly',
  'definitely', 'my pleasure', 'right away',
];

const FOLLOWUP_QUESTIONS = [
  'how are you feeling', 'is there anything else', 'do you have any questions',
  'would you like', 'can i help', 'anything else', 'how can i assist',
  'shall i', 'do you need', 'let me know if', 'feel free to',
  'don\'t hesitate', 'any concerns', 'any questions',
];

const ACTIONABLE_PATTERNS = [
  /i('ll| will) (book|schedule|arrange|send|call|check)/i,
  /please (visit|come|call|book|contact|reach)/i,
  /your appointment is/i,
  /scheduled for/i,
  /here('s| is) (the|your|our)/i,
  /you can (book|visit|call|reach|contact)/i,
  /our (address|location|clinic|hours)/i,
  /available (on|at|from)/i,
];

const TREATMENT_REFERENCES = [
  /botox/i, /filler/i, /laser/i, /hydrafacial/i, /peel/i, /prp/i,
  /mesotherapy/i, /micro.?needling/i, /thread/i, /treatment/i,
  /procedure/i, /session/i, /consultation/i,
];

// ─── Types ───────────────────────────────────────────────────────────────────

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'angry';
export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // -1.0 to 1.0
  topics: string[];
  urgency: Urgency;
}

export interface AgentScoreResult {
  professionalism: number; // 0-100
  empathy: number; // 0-100
  responseQuality: number; // 0-100
  overall: number; // 0-100
  strengths: string[];
  improvements: string[];
}

export interface ThreadMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  created_at: string;
  agent?: string;
}

export interface MessageAnalysis {
  messageId: string;
  direction: string;
  sentiment: Sentiment;
  sentimentScore: number;
  topics: string[];
  urgency: Urgency;
  agentScore?: AgentScoreResult;
}

export interface ThreadAnalysis {
  threadId: string;
  overallSentiment: Sentiment;
  avgSentimentScore: number;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  topics: string[];
  urgency: Urgency;
  flagged: boolean;
  flagReasons: string[];
  agentOverallScore: number;
  messageAnalyses: MessageAnalysis[];
}

export interface AgentPeriodScore {
  staffId: string;
  periodStart: string;
  periodEnd: string;
  messagesSent: number;
  avgSentimentScore: number;
  professionalism: number;
  empathy: number;
  responseQuality: number;
  overall: number;
  flaggedConversations: number;
  strengths: string[];
  improvements: string[];
}

// ─── Helper functions ────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function countMatches(text: string, patterns: string[]): number {
  const lower = normalizeText(text);
  let count = 0;
  for (const pattern of patterns) {
    if (lower.includes(pattern.toLowerCase())) {
      count++;
    }
  }
  return count;
}

function containsAny(text: string, patterns: string[]): boolean {
  const lower = normalizeText(text);
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

function countEmojiMatches(text: string, emojis: string[]): number {
  let count = 0;
  for (const emoji of emojis) {
    if (text.includes(emoji)) count++;
  }
  return count;
}

function matchesAnyRegex(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Core analysis functions ─────────────────────────────────────────────────

/**
 * Analyze the sentiment of a client message.
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { sentiment: 'neutral', score: 0, topics: [], urgency: 'low' };
  }

  const lower = normalizeText(text);

  // Count positive and negative signals
  const positiveWordCount = countMatches(text, POSITIVE_WORDS);
  const positiveEmojiCount = countEmojiMatches(text, POSITIVE_EMOJI);
  const negativeWordCount = countMatches(text, NEGATIVE_WORDS);
  const negativeEmojiCount = countEmojiMatches(text, NEGATIVE_EMOJI);
  const angryWordCount = countMatches(text, ANGRY_WORDS);

  // Check for all caps (yelling indicator)
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  const capsWords = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  const capsRatio = words.length > 0 ? capsWords.length / words.length : 0;
  const capsBoost = capsRatio > 0.5 ? -0.2 : 0;

  // Check for excessive punctuation (!!!, ???)
  const excessivePunctuation = (text.match(/[!?]{3,}/g) || []).length;

  // Calculate raw score
  let score = 0;
  score += positiveWordCount * 0.15;
  score += positiveEmojiCount * 0.12;
  score -= negativeWordCount * 0.18;
  score -= negativeEmojiCount * 0.12;
  score -= angryWordCount * 0.25;
  score += capsBoost;
  score -= excessivePunctuation * 0.08;

  // Clamp score to [-1.0, 1.0]
  score = clamp(score, -1.0, 1.0);

  // Determine sentiment category
  let sentiment: Sentiment;
  if (angryWordCount >= 2 || score <= -0.6) {
    sentiment = 'angry';
  } else if (score < -0.15) {
    sentiment = 'negative';
  } else if (score > 0.15) {
    sentiment = 'positive';
  } else {
    sentiment = 'neutral';
  }

  // Extract topics
  const topics: string[] = [];
  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      topics.push(topic);
    }
  }

  // Determine urgency
  const urgencyCount = countMatches(text, URGENCY_WORDS);
  let urgency: Urgency = 'low';
  if (urgencyCount >= 3 || (lower.includes('emergency') || lower.includes('allergic reaction') || lower.includes('bleeding'))) {
    urgency = 'critical';
  } else if (urgencyCount >= 2 || lower.includes('urgent') || lower.includes('asap')) {
    urgency = 'high';
  } else if (urgencyCount >= 1 || lower.includes('today') || lower.includes('soon')) {
    urgency = 'medium';
  }

  // Boost urgency if sentiment is angry
  if (sentiment === 'angry' && urgency === 'low') {
    urgency = 'medium';
  }

  return {
    sentiment,
    score: Math.round(score * 100) / 100,
    topics,
    urgency,
  };
}

/**
 * Score an agent's outbound message for communication quality.
 */
export function scoreAgentMessage(
  text: string,
  context?: {
    hasGreeting?: boolean;
    usesName?: boolean;
    responseTimeSeconds?: number;
    clientName?: string;
  },
): AgentScoreResult {
  if (!text || text.trim().length === 0) {
    return {
      professionalism: 0,
      empathy: 0,
      responseQuality: 0,
      overall: 0,
      strengths: [],
      improvements: ['Message is empty'],
    };
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  // ─── Professionalism Score ───────────────────────────────────────────

  let professionalism = 50; // Base score

  // Greeting check
  const hasGreeting = context?.hasGreeting || matchesAnyRegex(text, GREETING_PATTERNS);
  if (hasGreeting) {
    professionalism += 10;
    strengths.push('Uses greeting');
  } else {
    improvements.push('Add a greeting');
  }

  // Uses client name
  const usesName = context?.usesName || (context?.clientName ? normalizeText(text).includes(normalizeText(context.clientName)) : false);
  if (usesName) {
    professionalism += 15;
    strengths.push('Uses client name');
  } else {
    improvements.push('Use client\'s name');
  }

  // All caps check (unprofessional)
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  const capsWords = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  const capsRatio = words.length > 0 ? capsWords.length / words.length : 0;
  if (capsRatio > 0.3) {
    professionalism -= 10;
    improvements.push('Avoid ALL CAPS');
  }

  // Excessive punctuation
  const excessivePunct = (text.match(/[!?]{3,}/g) || []).length;
  if (excessivePunct > 0) {
    professionalism -= 5;
    improvements.push('Reduce excessive punctuation');
  }

  // Professional closing
  if (containsAny(text, PROFESSIONAL_CLOSINGS)) {
    professionalism += 10;
    strengths.push('Professional closing');
  } else {
    improvements.push('Add professional closing');
  }

  // Message length check
  if (text.trim().length > 20) {
    professionalism += 5;
  } else {
    professionalism -= 10;
    improvements.push('More detailed responses');
  }

  // Proper sentence structure (starts with uppercase after greeting)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const properSentences = sentences.filter((s) => /^[A-Z\s]/.test(s.trim()));
  if (sentences.length > 0 && properSentences.length / sentences.length > 0.5) {
    professionalism += 5;
  }

  professionalism = clamp(professionalism, 0, 100);

  // ─── Empathy Score ─────────────────────────────────────────────────

  let empathy = 40; // Base score

  // Acknowledgment phrases
  if (containsAny(text, EMPATHY_PHRASES)) {
    empathy += 15;
    strengths.push('Empathetic language');
  } else {
    improvements.push('Show more empathy');
  }

  // Follow-up questions
  if (containsAny(text, FOLLOWUP_QUESTIONS)) {
    empathy += 10;
    strengths.push('Asks follow-up questions');
  } else {
    improvements.push('Ask follow-up questions');
  }

  // Helpfulness phrases
  if (containsAny(text, HELPFULNESS_PHRASES)) {
    empathy += 10;
    strengths.push('Helpful language');
  }

  // Treatment/personal references
  if (matchesAnyRegex(text, TREATMENT_REFERENCES)) {
    empathy += 10;
    strengths.push('References treatment');
  }

  // Question mark presence (shows engagement)
  if (text.includes('?')) {
    empathy += 5;
  }

  // Warm tone words
  const warmWords = ['please', 'kindly', 'glad', 'hope', 'wish', 'welcome'];
  if (containsAny(text, warmWords)) {
    empathy += 5;
    strengths.push('Warm tone');
  }

  empathy = clamp(empathy, 0, 100);

  // ─── Response Quality Score ────────────────────────────────────────

  let responseQuality = 40; // Base score

  // Contains useful information (treatment details, pricing, scheduling)
  const infoPatterns = [
    /\d+\s*(pkr|rs|rupee)/i,
    /\d{1,2}:\d{2}/,
    /\d{1,2}\s*(am|pm)/i,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*/i,
  ];
  if (infoPatterns.some((p) => p.test(text)) || matchesAnyRegex(text, TREATMENT_REFERENCES)) {
    responseQuality += 20;
    strengths.push('Contains useful information');
  }

  // Actionable next step
  if (matchesAnyRegex(text, ACTIONABLE_PATTERNS)) {
    responseQuality += 20;
    strengths.push('Provides next steps');
  } else {
    improvements.push('Include actionable next steps');
  }

  // Response time scoring
  if (context?.responseTimeSeconds !== undefined) {
    if (context.responseTimeSeconds <= 300) {
      responseQuality += 20;
      strengths.push('Quick response');
    } else if (context.responseTimeSeconds <= 900) {
      responseQuality += 10;
    } else {
      improvements.push('Respond faster');
    }
  }

  // Substantive response check
  const isMinimal = /^(ok|yes|no|sure|done|noted|okay|k|hmm|hm|alright|fine)$/i.test(text.trim());
  if (isMinimal) {
    responseQuality -= 15;
    improvements.push('Give more substantive responses');
  } else if (text.trim().length > 50) {
    responseQuality += 10;
  }

  responseQuality = clamp(responseQuality, 0, 100);

  // ─── Overall Score ─────────────────────────────────────────────────

  const overall = Math.round(
    professionalism * 0.3 + empathy * 0.35 + responseQuality * 0.35,
  );

  // Deduplicate strengths and improvements
  const uniqueStrengths = [...new Set(strengths)];
  const uniqueImprovements = [...new Set(improvements)];

  return {
    professionalism: Math.round(professionalism),
    empathy: Math.round(empathy),
    responseQuality: Math.round(responseQuality),
    overall: clamp(overall, 0, 100),
    strengths: uniqueStrengths,
    improvements: uniqueImprovements,
  };
}

/**
 * Analyze an entire conversation thread.
 */
export function analyzeThread(messages: ThreadMessage[], threadId?: string): ThreadAnalysis {
  const messageAnalyses: MessageAnalysis[] = [];
  const allTopics: string[] = [];
  let maxUrgency: Urgency = 'low';
  const urgencyOrder: Record<Urgency, number> = { low: 0, medium: 1, high: 2, critical: 3 };

  let inboundSentimentScores: number[] = [];
  let agentScores: AgentScoreResult[] = [];
  const flagReasons: string[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const analysis: MessageAnalysis = {
      messageId: msg.id,
      direction: msg.direction,
      sentiment: 'neutral',
      sentimentScore: 0,
      topics: [],
      urgency: 'low',
    };

    if (msg.direction === 'inbound') {
      const sentimentResult = analyzeSentiment(msg.content);
      analysis.sentiment = sentimentResult.sentiment;
      analysis.sentimentScore = sentimentResult.score;
      analysis.topics = sentimentResult.topics;
      analysis.urgency = sentimentResult.urgency;
      inboundSentimentScores.push(sentimentResult.score);
      allTopics.push(...sentimentResult.topics);

      if (urgencyOrder[sentimentResult.urgency] > urgencyOrder[maxUrgency]) {
        maxUrgency = sentimentResult.urgency;
      }
    } else {
      // Agent message — also analyze sentiment + score quality
      const sentimentResult = analyzeSentiment(msg.content);
      analysis.sentiment = sentimentResult.sentiment;
      analysis.sentimentScore = sentimentResult.score;
      analysis.topics = sentimentResult.topics;

      // Calculate response time from previous inbound message
      let responseTimeSeconds: number | undefined;
      for (let j = i - 1; j >= 0; j--) {
        if (messages[j].direction === 'inbound') {
          const inboundTime = new Date(messages[j].created_at).getTime();
          const outboundTime = new Date(msg.created_at).getTime();
          responseTimeSeconds = Math.floor((outboundTime - inboundTime) / 1000);
          break;
        }
      }

      const agentScore = scoreAgentMessage(msg.content, {
        responseTimeSeconds,
      });
      analysis.agentScore = agentScore;
      agentScores.push(agentScore);
    }

    messageAnalyses.push(analysis);
  }

  // Calculate overall sentiment
  const avgScore = inboundSentimentScores.length > 0
    ? inboundSentimentScores.reduce((a, b) => a + b, 0) / inboundSentimentScores.length
    : 0;

  let overallSentiment: Sentiment;
  if (avgScore <= -0.6) overallSentiment = 'angry';
  else if (avgScore < -0.15) overallSentiment = 'negative';
  else if (avgScore > 0.15) overallSentiment = 'positive';
  else overallSentiment = 'neutral';

  // Determine sentiment trend
  let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (inboundSentimentScores.length >= 2) {
    const firstHalf = inboundSentimentScores.slice(0, Math.floor(inboundSentimentScores.length / 2));
    const secondHalf = inboundSentimentScores.slice(Math.floor(inboundSentimentScores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > 0.15) sentimentTrend = 'improving';
    else if (diff < -0.15) sentimentTrend = 'declining';
  }

  // Calculate agent overall score
  const agentOverallScore = agentScores.length > 0
    ? Math.round(agentScores.reduce((a, b) => a + b.overall, 0) / agentScores.length)
    : 0;

  // Determine if thread should be flagged
  let flagged = false;
  if (overallSentiment === 'angry') {
    flagged = true;
    flagReasons.push('Client sentiment is angry');
  }
  if (overallSentiment === 'negative') {
    flagged = true;
    flagReasons.push('Client sentiment is negative');
  }
  if (maxUrgency === 'critical') {
    flagged = true;
    flagReasons.push('Critical urgency detected');
  }
  if (sentimentTrend === 'declining') {
    flagged = true;
    flagReasons.push('Client sentiment declining during conversation');
  }
  if (agentOverallScore > 0 && agentOverallScore < 40) {
    flagged = true;
    flagReasons.push('Low agent communication quality');
  }

  // Unique topics
  const uniqueTopics = [...new Set(allTopics)];

  return {
    threadId: threadId || messages[0]?.id || 'unknown',
    overallSentiment,
    avgSentimentScore: Math.round(avgScore * 100) / 100,
    sentimentTrend,
    totalMessages: messages.length,
    inboundMessages: messages.filter((m) => m.direction === 'inbound').length,
    outboundMessages: messages.filter((m) => m.direction === 'outbound').length,
    topics: uniqueTopics,
    urgency: maxUrgency,
    flagged,
    flagReasons,
    agentOverallScore,
    messageAnalyses,
  };
}

/**
 * Calculate agent scores for a period based on analyzed messages.
 * This aggregates individual message scores into period scores.
 */
export function computeAgentPeriodScore(
  staffId: string,
  startDate: string,
  endDate: string,
  threadAnalyses: ThreadAnalysis[],
): AgentPeriodScore {
  let totalMessages = 0;
  let totalProfessionalism = 0;
  let totalEmpathy = 0;
  let totalResponseQuality = 0;
  let allSentimentScores: number[] = [];
  let flaggedCount = 0;
  const allStrengths: string[] = [];
  const allImprovements: string[] = [];

  for (const thread of threadAnalyses) {
    if (thread.flagged) flaggedCount++;
    allSentimentScores.push(thread.avgSentimentScore);

    for (const msg of thread.messageAnalyses) {
      if (msg.direction === 'outbound' && msg.agentScore) {
        totalMessages++;
        totalProfessionalism += msg.agentScore.professionalism;
        totalEmpathy += msg.agentScore.empathy;
        totalResponseQuality += msg.agentScore.responseQuality;
        allStrengths.push(...msg.agentScore.strengths);
        allImprovements.push(...msg.agentScore.improvements);
      }
    }
  }

  const avgProfessionalism = totalMessages > 0 ? Math.round(totalProfessionalism / totalMessages) : 0;
  const avgEmpathy = totalMessages > 0 ? Math.round(totalEmpathy / totalMessages) : 0;
  const avgResponseQuality = totalMessages > 0 ? Math.round(totalResponseQuality / totalMessages) : 0;
  const avgSentiment = allSentimentScores.length > 0
    ? Math.round((allSentimentScores.reduce((a, b) => a + b, 0) / allSentimentScores.length) * 100) / 100
    : 0;

  const overall = Math.round(
    avgProfessionalism * 0.3 + avgEmpathy * 0.35 + avgResponseQuality * 0.35,
  );

  // Count frequency of strengths/improvements to find top ones
  const strengthCounts = new Map<string, number>();
  for (const s of allStrengths) {
    strengthCounts.set(s, (strengthCounts.get(s) || 0) + 1);
  }
  const improvementCounts = new Map<string, number>();
  for (const imp of allImprovements) {
    improvementCounts.set(imp, (improvementCounts.get(imp) || 0) + 1);
  }

  const topStrengths = [...strengthCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  const topImprovements = [...improvementCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  return {
    staffId,
    periodStart: startDate,
    periodEnd: endDate,
    messagesSent: totalMessages,
    avgSentimentScore: avgSentiment,
    professionalism: avgProfessionalism,
    empathy: avgEmpathy,
    responseQuality: avgResponseQuality,
    overall: clamp(overall, 0, 100),
    flaggedConversations: flaggedCount,
    strengths: topStrengths,
    improvements: topImprovements,
  };
}
