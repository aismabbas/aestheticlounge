/**
 * render-overlay.ts — Satori + resvg-wasm text overlay renderer.
 *
 * Adapted from src/lib/render-overlay.ts for the Railway worker.
 * Font path changed from process.cwd()/public/fonts to __dirname/../fonts
 */

import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import type { ReactNode } from 'react';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

// ---------------------------------------------------------------------------
// Resolve fonts directory relative to this file
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// In built output: dist/lib/render-overlay.js -> fonts is at ../../fonts
// In dev with tsx: src/lib/render-overlay.ts -> fonts is at ../../fonts
const FONTS_DIR = join(__dirname, '..', '..', 'fonts');

// ---------------------------------------------------------------------------
// Brand Constants
// ---------------------------------------------------------------------------

const GOLD = '#B8924A';
const GOLD_LIGHT = '#D4B876';
const GOLD_DARK = '#9A7A3C';
const CREAM = '#FAF9F6';
const DARK = '#1A1A1A';
const GRAY = '#6B6B6B';
const DISCLAIMER = 'Individual results may vary. Consult with our medical professionals. Dr. Huma Abbas, Medical Director.';

// ---------------------------------------------------------------------------
// Singleton Initializers
// ---------------------------------------------------------------------------

type SatoriFont = { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' | 'italic' };
let fontsPromise: Promise<SatoriFont[]> | null = null;
let wasmInit: Promise<void> | null = null;

function ensureWasm(): Promise<void> {
  if (!wasmInit) {
    wasmInit = (async () => {
      try {
        let wasmPath: string;
        try {
          const pkgPath = require.resolve('@resvg/resvg-wasm/package.json');
          wasmPath = join(pkgPath, '..', 'index_bg.wasm');
        } catch {
          wasmPath = join(process.cwd(), 'node_modules', '@resvg', 'resvg-wasm', 'index_bg.wasm');
        }
        const wasmBuffer = await readFile(wasmPath);
        await initWasm(wasmBuffer);
      } catch (e) {
        if (!(e instanceof Error && e.message.includes('Already initialized'))) throw e;
      }
    })();
  }
  return wasmInit;
}

async function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const [playfairReg, playfairBold, inter] = await Promise.all([
        readFile(join(FONTS_DIR, 'PlayfairDisplay-Regular.ttf')),
        readFile(join(FONTS_DIR, 'PlayfairDisplay-Bold.ttf')),
        readFile(join(FONTS_DIR, 'Inter-Regular.ttf')),
      ]);
      return [
        { name: 'Playfair Display', data: playfairReg.buffer.slice(playfairReg.byteOffset, playfairReg.byteOffset + playfairReg.byteLength), weight: 400, style: 'normal' },
        { name: 'Playfair Display', data: playfairBold.buffer.slice(playfairBold.byteOffset, playfairBold.byteOffset + playfairBold.byteLength), weight: 700, style: 'normal' },
        { name: 'Inter', data: inter.buffer.slice(inter.byteOffset, inter.byteOffset + inter.byteLength), weight: 400, style: 'normal' },
        { name: 'Inter', data: inter.buffer.slice(inter.byteOffset, inter.byteOffset + inter.byteLength), weight: 600, style: 'normal' },
        { name: 'Inter', data: inter.buffer.slice(inter.byteOffset, inter.byteOffset + inter.byteLength), weight: 700, style: 'normal' },
      ] satisfies SatoriFont[];
    })();
  }
  return fontsPromise;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OverlayTemplate =
  | 'treatment' | 'tips' | 'stats' | 'overlay' | 'lifestyle'
  | 'carousel_hook' | 'carousel_info' | 'carousel_cta';

export interface OverlayParams {
  template: OverlayTemplate;
  backgroundUrl?: string;
  params: Record<string, string>;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// JSX Helper (no React dep — Satori accepts plain objects)
// ---------------------------------------------------------------------------

type Style = Record<string, string | number | undefined>;

function h(type: string, props: { style?: Style; children?: ReactNode | ReactNode[] } & Record<string, unknown>): ReactNode {
  const { children, ...rest } = props;
  if (children === undefined) return { type, props: { ...rest, children: [] } } as unknown as ReactNode;
  const childArray = Array.isArray(children) ? children : [children];
  return { type, props: { ...rest, children: childArray } } as unknown as ReactNode;
}

// ---------------------------------------------------------------------------
// Shared UI Components
// ---------------------------------------------------------------------------

function Badge({ label, dark }: { label: string; dark?: boolean }) {
  const dotColor = dark ? GOLD_LIGHT : GOLD;
  const textColor = dark ? GOLD_LIGHT : GOLD;
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: 10, position: 'absolute', top: 48, left: 48 },
    children: [
      h('div', { style: { width: 12, height: 12, background: dotColor, borderRadius: '50%' } }),
      h('span', { style: { fontFamily: 'Inter', fontWeight: 700, fontSize: 16, letterSpacing: 3, textTransform: 'uppercase' as const, color: textColor }, children: label }),
    ],
  });
}

function BrandTop({ dark }: { dark?: boolean }) {
  const baseColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,26,0.4)';
  const accentColor = dark ? 'rgba(212,184,118,0.6)' : 'rgba(184,146,74,0.6)';
  return h('div', {
    style: { position: 'absolute', top: 48, right: 48, fontFamily: 'Playfair Display', fontSize: 20, color: baseColor, display: 'flex' },
    children: [
      h('span', { style: { color: baseColor }, children: 'Aesthetic' }),
      h('span', { style: { color: accentColor }, children: 'Lounge' }),
    ],
  });
}

function GoldRule() {
  return h('div', { style: { width: 80, height: 3, background: GOLD, marginBottom: 20 } });
}

function CtaBar({ text }: { text: string }) {
  return h('div', {
    style: { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, borderRadius: 12, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    children: [
      h('span', { style: { fontFamily: 'Playfair Display', fontSize: 24, color: '#FFFFFF' }, children: text }),
      h('span', { style: { fontSize: 26, color: '#FFFFFF' }, children: '→' }),
    ],
  });
}

function Footer({ dark }: { dark?: boolean }) {
  const disclaimerColor = dark ? 'rgba(255,255,255,0.25)' : 'rgba(26,26,26,0.3)';
  const brandColor = dark ? GOLD_LIGHT : GOLD;
  const taglineColor = dark ? 'rgba(255,255,255,0.4)' : GRAY;
  return h('div', {
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
    children: [
      h('span', { style: { fontSize: 11, color: disclaimerColor, lineHeight: 1.5, maxWidth: 680 }, children: DISCLAIMER }),
      h('div', {
        style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
        children: [
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 18, color: brandColor }, children: 'Aesthetic Lounge' }),
          h('span', { style: { fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: taglineColor }, children: 'Where Science Meets Beauty' }),
        ],
      }),
    ],
  });
}

function BgImage({ url, scrimGradient }: { url: string; scrimGradient: string }) {
  return [
    h('img', { src: url, style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } }),
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: scrimGradient } }),
  ];
}

const LIGHT_SCRIM = 'linear-gradient(180deg, rgba(250,249,246,0.6) 0%, rgba(250,249,246,0.2) 28%, rgba(250,249,246,0.15) 42%, rgba(250,249,246,0.4) 62%, rgba(250,249,246,0.88) 80%, rgba(250,249,246,0.96) 100%)';
const DARK_SCRIM = 'linear-gradient(180deg, rgba(26,26,26,0.6) 0%, rgba(26,26,26,0.2) 20%, rgba(26,26,26,0.15) 40%, rgba(26,26,26,0.5) 65%, rgba(26,26,26,0.92) 85%, rgba(26,26,26,0.98) 100%)';

// ---------------------------------------------------------------------------
// Templates (all 8)
// ---------------------------------------------------------------------------

function treatmentTemplate(p: Record<string, string>, bgUrl?: string): ReactNode {
  const stats: { num: string; lbl: string }[] = [];
  if (p.stat1) stats.push({ num: p.stat1, lbl: p['stat1-label'] || '' });
  if (p.stat2) stats.push({ num: p.stat2, lbl: p['stat2-label'] || '' });
  if (p.stat3) stats.push({ num: p.stat3, lbl: p['stat3-label'] || '' });

  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: CREAM, fontFamily: 'Inter' },
    children: [
      ...(bgUrl ? BgImage({ url: bgUrl, scrimGradient: LIGHT_SCRIM }) : []),
      Badge({ label: p.category || 'Treatment Spotlight' }),
      BrandTop({}),
      h('div', {
        style: { position: 'absolute', top: 110, left: 48, right: 48, display: 'flex', flexDirection: 'column' },
        children: [
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 64, lineHeight: 1.08, color: DARK }, children: p.headline || 'Headline Here' }),
          p['headline-highlight'] ? h('span', { style: { fontFamily: 'Playfair Display', fontSize: 48, lineHeight: 1.15, color: GOLD, marginTop: 8 }, children: p['headline-highlight'] }) : null,
          p.body ? h('span', { style: { fontSize: 22, color: GRAY, lineHeight: 1.5, maxWidth: 800, marginTop: 16 }, children: p.body }) : null,
        ].filter(Boolean),
      }),
      h('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 44px', display: 'flex', flexDirection: 'column' },
        children: [
          GoldRule(),
          stats.length > 0 ? h('div', {
            style: { display: 'flex', gap: 14, marginBottom: 24 },
            children: stats.map(s => h('div', {
              style: { background: 'rgba(184,146,74,0.08)', border: '1px solid rgba(184,146,74,0.2)', borderRadius: 12, padding: '14px 20px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
              children: [
                h('span', { style: { fontFamily: 'Playfair Display', fontSize: 36, color: GOLD }, children: s.num }),
                h('span', { style: { fontSize: 12, color: GRAY, textTransform: 'uppercase' as const, letterSpacing: 1.5, marginTop: 4 }, children: s.lbl }),
              ],
            })),
          }) : null,
          p.cta ? CtaBar({ text: p.cta }) : null,
          Footer({}),
        ].filter(Boolean),
      }),
    ],
  });
}

function tipsTemplate(p: Record<string, string>, bgUrl?: string): ReactNode {
  const tips = [p.tip1, p.tip2, p.tip3, p.tip4, p.tip5].filter(Boolean);
  if (tips.length === 0) tips.push('Tip 1', 'Tip 2', 'Tip 3');

  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: CREAM, fontFamily: 'Inter' },
    children: [
      ...(bgUrl ? BgImage({ url: bgUrl, scrimGradient: LIGHT_SCRIM }) : []),
      Badge({ label: p.category || 'Beauty Tips' }),
      BrandTop({}),
      h('div', {
        style: { position: 'absolute', top: 100, left: 48, right: 48, display: 'flex', flexDirection: 'column' },
        children: [
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 54, lineHeight: 1.1, color: DARK }, children: p.headline || 'Headline Here' }),
          p['headline-highlight'] ? h('span', { style: { fontFamily: 'Playfair Display', fontSize: 54, lineHeight: 1.1, color: GOLD }, children: ` ${p['headline-highlight']}` }) : null,
        ].filter(Boolean),
      }),
      h('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 44px', display: 'flex', flexDirection: 'column' },
        children: [
          GoldRule(),
          h('div', {
            style: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 },
            children: tips.map((t, i) => h('div', {
              style: { display: 'flex', alignItems: 'flex-start', gap: 14 },
              children: [
                h('div', {
                  style: { width: 32, height: 32, minWidth: 32, background: 'rgba(184,146,74,0.15)', border: '1.5px solid ' + GOLD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: 15, fontWeight: 700 },
                  children: String(i + 1),
                }),
                h('span', { style: { fontSize: 21, color: 'rgba(26,26,26,0.85)', lineHeight: 1.4 }, children: t }),
              ],
            })),
          }),
          p.cta ? CtaBar({ text: p.cta }) : null,
          Footer({}),
        ].filter(Boolean),
      }),
    ],
  });
}

function statsTemplate(p: Record<string, string>, bgUrl?: string): ReactNode {
  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: CREAM, fontFamily: 'Inter' },
    children: [
      ...(bgUrl ? BgImage({ url: bgUrl, scrimGradient: LIGHT_SCRIM }) : []),
      Badge({ label: p.category || 'Results' }),
      BrandTop({}),
      h('div', {
        style: { position: 'absolute', top: 110, left: 48, right: 48, display: 'flex', flexDirection: 'column' },
        children: [
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 140, lineHeight: 1, color: GOLD }, children: p['big-number'] || '98%' }),
          h('span', { style: { fontSize: 20, color: GRAY, letterSpacing: 4, textTransform: 'uppercase' as const, marginTop: 8 }, children: p['big-label'] || 'Key Metric' }),
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 52, lineHeight: 1.1, color: DARK, marginTop: 20 }, children: p.headline || 'Headline' }),
          p['headline-highlight'] ? h('span', { style: { fontFamily: 'Playfair Display', fontSize: 42, color: GOLD, marginTop: 6 }, children: p['headline-highlight'] }) : null,
        ].filter(Boolean),
      }),
      h('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 44px', display: 'flex', flexDirection: 'column' },
        children: [
          GoldRule(),
          p.body ? h('span', { style: { fontSize: 22, color: GRAY, lineHeight: 1.5, maxWidth: 800, marginBottom: 24 }, children: p.body }) : null,
          p.cta ? CtaBar({ text: p.cta }) : null,
          Footer({}),
        ].filter(Boolean),
      }),
    ],
  });
}

function overlayTmpl(p: Record<string, string>, bgUrl?: string): ReactNode {
  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: CREAM, fontFamily: 'Inter' },
    children: [
      ...(bgUrl ? BgImage({ url: bgUrl, scrimGradient: LIGHT_SCRIM }) : []),
      Badge({ label: p.category || 'Treatment Spotlight' }),
      BrandTop({}),
      h('div', {
        style: { position: 'absolute', top: 110, left: 48, right: 48, display: 'flex', flexDirection: 'column' },
        children: [
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 60, lineHeight: 1.08, color: DARK }, children: p.headline || 'Headline Here' }),
          p['headline-highlight'] ? h('span', { style: { fontFamily: 'Playfair Display', fontSize: 48, lineHeight: 1.2, color: GOLD, marginTop: 10 }, children: p['headline-highlight'] }) : null,
          p.subtitle ? h('span', { style: { fontSize: 22, color: GRAY, lineHeight: 1.5, maxWidth: 800, marginTop: 16 }, children: p.subtitle }) : null,
        ].filter(Boolean),
      }),
      h('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 44px', display: 'flex', flexDirection: 'column' },
        children: [
          GoldRule(),
          p.hook ? h('span', { style: { fontSize: 20, color: 'rgba(26,26,26,0.6)', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 24, maxWidth: 600 }, children: p.hook }) : null,
          Footer({}),
        ].filter(Boolean),
      }),
    ],
  });
}

function lifestyleTemplate(p: Record<string, string>, bgUrl?: string): ReactNode {
  const cities = p.cities ? p.cities.split(',').map(c => c.trim()).filter(Boolean) : [];
  const stats: { num: string; lbl: string }[] = [];
  if (p.stat1) stats.push({ num: p.stat1, lbl: p['stat1-label'] || '' });
  if (p.stat2) stats.push({ num: p.stat2, lbl: p['stat2-label'] || '' });
  if (p.stat3) stats.push({ num: p.stat3, lbl: p['stat3-label'] || '' });

  const DARK_LIFESTYLE_SCRIM = 'linear-gradient(180deg, rgba(26,26,26,0.45) 0%, rgba(26,26,26,0.08) 18%, rgba(26,26,26,0.05) 35%, rgba(26,26,26,0.18) 55%, rgba(26,26,26,0.72) 75%, rgba(26,26,26,0.92) 100%)';

  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: DARK, fontFamily: 'Inter', color: '#fff' },
    children: [
      ...(bgUrl ? BgImage({ url: bgUrl, scrimGradient: DARK_LIFESTYLE_SCRIM }) : []),
      Badge({ label: p.category || 'Treatment Spotlight', dark: true }),
      BrandTop({ dark: true }),
      h('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 36px', display: 'flex', flexDirection: 'column' },
        children: [
          h('div', { style: { width: 80, height: 3, background: GOLD, marginBottom: 14 } }),
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 50, lineHeight: 1.08, color: '#fff', marginBottom: 8 }, children: p.headline || 'Headline Here' }),
          p['headline-highlight'] ? h('span', { style: { fontFamily: 'Playfair Display', fontSize: 50, lineHeight: 1.08, color: GOLD_LIGHT }, children: p['headline-highlight'] }) : null,
          p.body ? h('span', { style: { fontSize: 19, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, maxWidth: 800, marginBottom: 12 }, children: p.body }) : null,
          stats.length > 0 ? h('div', {
            style: { display: 'flex', gap: 12, marginBottom: 14 },
            children: stats.map(s => h('div', {
              style: { flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,184,118,0.25)', borderRadius: 12, padding: '14px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
              children: [
                h('span', { style: { fontFamily: 'Playfair Display', fontSize: 30, color: GOLD_LIGHT, lineHeight: 1, marginBottom: 4 }, children: s.num }),
                h('span', { style: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600 }, children: s.lbl }),
              ],
            })),
          }) : null,
          cities.length > 0 ? h('div', {
            style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
            children: cities.map(c => h('span', {
              style: { background: 'rgba(212,184,118,0.15)', border: '1px solid rgba(212,184,118,0.3)', color: GOLD_LIGHT, fontSize: 13, fontWeight: 600, letterSpacing: 1, padding: '6px 16px', borderRadius: 50 },
              children: c,
            })),
          }) : null,
          p['model-name'] ? h('div', {
            style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
            children: [
              h('span', { style: { fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }, children: p['model-name'] }),
              p['model-title'] ? h('span', { style: { fontSize: 12, color: 'rgba(255,255,255,0.4)' }, children: `· ${p['model-title']}` }) : null,
            ].filter(Boolean),
          }) : null,
          Footer({ dark: true }),
        ].filter(Boolean),
      }),
    ],
  });
}

function carouselHookTemplate(p: Record<string, string>, bgUrl?: string): ReactNode {
  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: DARK, fontFamily: 'Inter', color: '#fff' },
    children: [
      ...(bgUrl ? BgImage({ url: bgUrl, scrimGradient: DARK_SCRIM }) : []),
      Badge({ label: p.category || 'Beauty Tips', dark: true }),
      BrandTop({ dark: true }),
      h('div', {
        style: { position: 'absolute', bottom: 120, left: 48, right: 48, display: 'flex', flexDirection: 'column' },
        children: [
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 80, lineHeight: 1.05, color: '#fff' }, children: p.headline || 'Headline Here' }),
          p['headline-highlight'] ? h('span', { style: { fontFamily: 'Playfair Display', fontSize: 58, lineHeight: 1.12, color: GOLD_LIGHT, marginTop: 8 }, children: p['headline-highlight'] }) : null,
        ].filter(Boolean),
      }),
      h('div', {
        style: { position: 'absolute', bottom: 48, right: 48, display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const },
        children: [
          h('span', { children: 'Swipe' }),
          h('span', { style: { fontSize: 28, color: GOLD_LIGHT }, children: '→' }),
        ],
      }),
    ],
  });
}

function carouselInfoTemplate(p: Record<string, string>, bgUrl?: string): ReactNode {
  const slideNum = p['slide-number'] || '01';
  const slideTotal = p['slide-total'] || '5';

  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: CREAM, fontFamily: 'Inter' },
    children: [
      ...(bgUrl ? [
        h('img', { src: bgUrl, style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 } }),
      ] : []),
      h('span', {
        style: { position: 'absolute', top: 48, left: 48, fontFamily: 'Playfair Display', fontSize: 80, color: 'rgba(184,146,74,0.12)', lineHeight: 1 },
        children: String(slideNum).padStart(2, '0'),
      }),
      BrandTop({}),
      h('div', {
        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 48px', maxWidth: 980 },
        children: [
          p['big-number'] ? h('span', { style: { fontFamily: 'Playfair Display', fontSize: 120, lineHeight: 1, color: GOLD, marginBottom: 8 }, children: p['big-number'] }) : null,
          p['big-label'] ? h('span', { style: { fontSize: 16, color: GRAY, letterSpacing: 4, textTransform: 'uppercase' as const, marginBottom: 40 }, children: p['big-label'] }) : null,
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 44, lineHeight: 1.15, color: DARK, marginBottom: 20 }, children: p.headline || 'Key Point' }),
          p.body ? h('span', { style: { fontSize: 22, color: GRAY, lineHeight: 1.55, maxWidth: 800 }, children: p.body }) : null,
        ].filter(Boolean),
      }),
      h('span', {
        style: { position: 'absolute', bottom: 48, fontSize: 14, color: 'rgba(26,26,26,0.3)', letterSpacing: 2 },
        children: `${slideNum} of ${slideTotal}`,
      }),
    ],
  });
}

function carouselCtaTemplate(p: Record<string, string>, bgUrl?: string): ReactNode {
  return h('div', {
    style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: CREAM, fontFamily: 'Inter' },
    children: [
      ...(bgUrl ? [
        h('img', { src: bgUrl, style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 } }),
      ] : []),
      BrandTop({}),
      h('div', {
        style: { position: 'absolute', top: '45%', left: 48, right: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transform: 'translateY(-55%)' },
        children: [
          h('div', { style: { width: 80, height: 3, background: GOLD, marginBottom: 32 } }),
          h('span', { style: { fontFamily: 'Playfair Display', fontSize: 52, lineHeight: 1.12, color: DARK, marginBottom: 40 }, children: p.headline || 'Discover Your Glow' }),
          p.cta ? h('div', {
            style: { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, borderRadius: 16, padding: '24px 48px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
            children: [
              h('span', { style: { fontFamily: 'Playfair Display', fontSize: 28, color: '#FFFFFF' }, children: p.cta }),
              h('span', { style: { fontSize: 30, color: '#FFFFFF' }, children: '→' }),
            ],
          }) : null,
          p.subtitle ? h('span', { style: { fontSize: 18, color: GRAY, marginTop: 12 }, children: p.subtitle }) : null,
        ].filter(Boolean),
      }),
      h('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 44px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        children: [
          h('span', { style: { fontSize: 11, color: 'rgba(26,26,26,0.3)', lineHeight: 1.5, textAlign: 'center', marginBottom: 16 }, children: DISCLAIMER }),
          h('div', {
            style: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 },
            children: [
              h('span', { style: { fontFamily: 'Playfair Display', fontSize: 20, color: GOLD }, children: 'Aesthetic Lounge' }),
              h('span', { style: { fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: GRAY }, children: 'Where Science Meets Beauty' }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Template Router
// ---------------------------------------------------------------------------

const TEMPLATES: Record<OverlayTemplate, (p: Record<string, string>, bgUrl?: string) => ReactNode> = {
  treatment: treatmentTemplate,
  tips: tipsTemplate,
  stats: statsTemplate,
  overlay: overlayTmpl,
  lifestyle: lifestyleTemplate,
  carousel_hook: carouselHookTemplate,
  carousel_info: carouselInfoTemplate,
  carousel_cta: carouselCtaTemplate,
};

const DEFAULT_DIMS: Record<OverlayTemplate, { w: number; h: number }> = {
  treatment: { w: 1080, h: 1080 },
  tips: { w: 1080, h: 1080 },
  stats: { w: 1080, h: 1080 },
  overlay: { w: 1080, h: 1080 },
  lifestyle: { w: 1080, h: 1350 },
  carousel_hook: { w: 1080, h: 1080 },
  carousel_info: { w: 1080, h: 1080 },
  carousel_cta: { w: 1080, h: 1080 },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function renderOverlay(opts: OverlayParams): Promise<Buffer> {
  const templateFn = TEMPLATES[opts.template];
  if (!templateFn) throw new Error(`Unknown template: ${opts.template}`);

  const dims = DEFAULT_DIMS[opts.template];
  const width = opts.width || dims.w;
  const height = opts.height || dims.h;

  const [fonts] = await Promise.all([loadFonts(), ensureWasm()]);

  const jsx = templateFn(opts.params, opts.backgroundUrl);

  const svg = await satori(jsx as React.ReactElement, {
    width,
    height,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}

export async function renderOverlayAndUpload(opts: OverlayParams): Promise<string> {
  const pngBuffer = await renderOverlay(opts);

  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY not set — cannot upload overlay');

  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: `al-overlay-${Date.now()}.png`, content_type: 'image/png' }),
  });
  const { upload_url, file_url } = await initRes.json();
  if (!upload_url || !file_url) throw new Error('fal.ai upload initiation failed');

  await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: new Uint8Array(pngBuffer),
  });

  return file_url;
}
