/**
 * Marketing Pipeline Configuration — AL models, commands, template schemas
 */

export interface ModelInfo {
  name: string;
  fullName: string;
  age: number;
  desc: string;
  portraits: string[];
}

export interface Command {
  id: string;
  label: string;
  icon: string;
  action: string;
  desc: string;
}

export interface TemplateParam {
  type: 'text' | 'textarea' | 'file' | 'model';
  label: string;
  required?: boolean;
  default?: string;
}

export interface TemplateSchema {
  name: string;
  size: string;
  params: Record<string, TemplateParam>;
}

export const PIPELINE_COMMANDS: Command[] = [
  { id: 'new_post', label: 'Post', icon: '📝', action: 'al:new_post', desc: 'Create a new social post' },
  { id: 'new_reel', label: 'Reel', icon: '🎬', action: 'al:new_reel', desc: 'Create a new reel' },
  { id: 'new_carousel', label: 'Carousel', icon: '📸', action: 'al:new_carousel', desc: 'Create carousel slides' },
  { id: 'research', label: 'Research', icon: '🔍', action: 'research', desc: 'Research a topic' },
  { id: 'check_status', label: 'Status', icon: '📊', action: 'al:check_status', desc: 'Check pipeline status' },
  { id: 'go_post', label: 'Orchestrate Post', icon: '📡', action: 'al:go_post:auto', desc: 'Auto-pick and create post' },
  { id: 'go_reel', label: 'Orchestrate Reel', icon: '✍️', action: 'al:go_reel:auto', desc: 'Auto-pick and create reel' },
  { id: 'go_carousel', label: 'Orchestrate Carousel', icon: '🎨', action: 'al:go_carousel:auto', desc: 'Auto-pick and create carousel' },
  { id: 'analyze', label: 'Analyze', icon: '📈', action: 'analyze', desc: 'Analyze ad performance' },
];

export const MODELS: ModelInfo[] = [
  {
    name: 'Ayesha', fullName: 'Ayesha Khalid', age: 30,
    desc: 'Fair, conservative — face treatments, Ramadan/Eid',
    portraits: [
      'hero-3quarter.png', 'hero-profile-jawline.png', 'hero-warm-smile.png',
      'closeup-before-pose.png', 'closeup-eye-detail.png', 'closeup-skin-macro.png',
      'lifestyle-eid-ready.png', 'lifestyle-mirror-glow.png', 'lifestyle-outdoor-confidence.png',
      'treatment-consultation.png', 'treatment-hydrafacial.png', 'treatment-laser.png',
      'treatment-laser-closeup.png', 'treatment-laser-wide.png',
    ],
  },
  {
    name: 'Meher', fullName: 'Meher Fatima', age: 28,
    desc: 'Curvy, sultry — body contouring, spa, before/after',
    portraits: [
      'hero.png', 'body-side-profile.png', 'body-spa-reclining.png', 'body-standing.png',
      'treatment-body-contouring.png', 'treatment-exosome-after.png', 'treatment-exosome-before.png',
      'treatment-hair-prp.png', 'treatment-hifu.png', 'treatment-hydrafacial.png', 'treatment-lip-filler.png',
    ],
  },
  {
    name: 'Noor', fullName: 'Noor Ahmed', age: 25,
    desc: 'Athletic, toned — laser legs/arms',
    portraits: [
      'hero.png', 'body-arms-shoulders.png', 'body-back-walking.png', 'body-standing.png',
      'treatment-body-laser.png', 'treatment-hair-prp.png',
    ],
  },
  {
    name: 'Usman', fullName: 'Usman Malik', age: 35,
    desc: 'Professional male — Hair PRP',
    portraits: ['treatment-hair-prp.png'],
  },
];

export const TEMPLATE_SCHEMAS: Record<string, TemplateSchema> = {
  treatment: {
    name: 'Treatment Spotlight', size: '1080x1080',
    params: {
      category: { type: 'text', label: 'Category', default: 'Treatment Spotlight' },
      headline: { type: 'text', label: 'Headline', required: true },
      'headline-highlight': { type: 'text', label: 'Headline Highlight' },
      body: { type: 'textarea', label: 'Body Text' },
      stat1: { type: 'text', label: 'Stat 1 Value' }, 'stat1-label': { type: 'text', label: 'Stat 1 Label' },
      stat2: { type: 'text', label: 'Stat 2 Value' }, 'stat2-label': { type: 'text', label: 'Stat 2 Label' },
      stat3: { type: 'text', label: 'Stat 3 Value' }, 'stat3-label': { type: 'text', label: 'Stat 3 Label' },
      cta: { type: 'text', label: 'CTA', default: 'Book a Consultation' },
      background: { type: 'file', label: 'Background Image' },
    },
  },
  tips: {
    name: 'Tips List', size: '1080x1080',
    params: {
      headline: { type: 'text', label: 'Headline', required: true },
      tip1: { type: 'text', label: 'Tip 1' }, tip2: { type: 'text', label: 'Tip 2' },
      tip3: { type: 'text', label: 'Tip 3' }, tip4: { type: 'text', label: 'Tip 4' },
      tip5: { type: 'text', label: 'Tip 5' },
      cta: { type: 'text', label: 'CTA', default: 'Book a Consultation' },
    },
  },
  stats: {
    name: 'Stat Hero', size: '1080x1080',
    params: {
      'big-number': { type: 'text', label: 'Big Number', required: true },
      'big-label': { type: 'text', label: 'Big Label', required: true },
      headline: { type: 'text', label: 'Headline' },
      body: { type: 'textarea', label: 'Body Text' },
    },
  },
  overlay: {
    name: 'Text Overlay', size: '1080x1080',
    params: {
      headline: { type: 'text', label: 'Headline', required: true },
      body: { type: 'textarea', label: 'Body Text' },
      background: { type: 'file', label: 'Background Image' },
    },
  },
  lifestyle: {
    name: 'Model Lifestyle', size: '1080x1350',
    params: {
      headline: { type: 'text', label: 'Headline', required: true },
      'model-photo': { type: 'model', label: 'Model Photo' },
      'model-name': { type: 'text', label: 'Model Name' },
      cities: { type: 'text', label: 'Cities', default: 'Lahore, Islamabad' },
      stat1: { type: 'text', label: 'Stat 1 Value' }, 'stat1-label': { type: 'text', label: 'Stat 1 Label' },
      stat2: { type: 'text', label: 'Stat 2 Value' }, 'stat2-label': { type: 'text', label: 'Stat 2 Label' },
    },
  },
  reel: {
    name: 'Reel Overlay', size: '1080x1920',
    params: {
      headline: { type: 'text', label: 'Headline', required: true },
      'model-photo': { type: 'model', label: 'Model Photo' },
      cities: { type: 'text', label: 'Cities', default: 'Lahore, Islamabad' },
    },
  },
  reel_scene: {
    name: 'Reel Scene (No Text)', size: '1080x1920',
    params: {
      'model-photo': { type: 'model', label: 'Model Photo' },
      background: { type: 'file', label: 'Background Image' },
    },
  },
  reel_closing: {
    name: 'Reel Closing Frame', size: '1080x1920',
    params: {
      slogan: { type: 'text', label: 'Slogan', default: 'Your Glow. Our Expertise.' },
      phone: { type: 'text', label: 'Phone', default: '+92 301 8888 042' },
      website: { type: 'text', label: 'Website', default: 'aestheticloungeofficial.com' },
      instagram: { type: 'text', label: 'Instagram', default: '@aestheticloungeofficial' },
    },
  },
  carousel_hook: {
    name: 'Carousel Hook', size: '1080x1080',
    params: {
      headline: { type: 'text', label: 'Headline', required: true },
      'model-photo': { type: 'model', label: 'Model Photo' },
    },
  },
  carousel_info: {
    name: 'Carousel Info', size: '1080x1080',
    params: {
      'slide-number': { type: 'text', label: 'Slide Number' },
      'slide-total': { type: 'text', label: 'Total Slides' },
      headline: { type: 'text', label: 'Headline', required: true },
      body: { type: 'textarea', label: 'Body Text' },
    },
  },
  carousel_cta: {
    name: 'Carousel CTA', size: '1080x1080',
    params: {
      headline: { type: 'text', label: 'Headline', required: true },
      cta: { type: 'text', label: 'CTA', default: 'Book a Consultation' },
      subtitle: { type: 'text', label: 'Subtitle' },
    },
  },
};

export const AGENTS = ['orchestrator', 'researcher', 'copywriter', 'designer', 'publisher', 'analyst'] as const;
export type AgentName = typeof AGENTS[number];
