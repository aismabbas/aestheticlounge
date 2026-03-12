/**
 * render-overlay.ts — Playwright-based text overlay renderer.
 *
 * Uses the exact same HTML/CSS templates as the n8n pipeline (render-al-post.mjs).
 * Playwright renders real CSS — text-shadow, backdrop-filter, box-shadow, animations all work.
 */

import { chromium, type Browser } from 'playwright';

// ---------------------------------------------------------------------------
// Brand Constants
// ---------------------------------------------------------------------------

const AL_FONTS = `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap`;
const AL_DISCLAIMER = `Individual results may vary. Consult with our medical professionals. Dr. Huma Abbas, Medical Director.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OverlayTemplate =
  | 'treatment' | 'tips' | 'stats' | 'overlay' | 'lifestyle'
  | 'carousel_hook' | 'carousel_info' | 'carousel_cta'
  | 'reel' | 'reel_scene' | 'reel_closing';

export interface OverlayParams {
  template: OverlayTemplate;
  backgroundUrl?: string;
  params: Record<string, string>;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Singleton Browser (reuse across renders — launch once)
// ---------------------------------------------------------------------------

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    // If browser crashes, reset so next call re-launches
    browserPromise.catch(() => { browserPromise = null; });
  }
  return browserPromise;
}

// ---------------------------------------------------------------------------
// Default Dimensions
// ---------------------------------------------------------------------------

const DEFAULT_DIMS: Record<string, { w: number; h: number }> = {
  treatment: { w: 1080, h: 1080 },
  tips: { w: 1080, h: 1080 },
  stats: { w: 1080, h: 1080 },
  overlay: { w: 1080, h: 1080 },
  lifestyle: { w: 1080, h: 1350 },
  carousel_hook: { w: 1080, h: 1080 },
  carousel_info: { w: 1080, h: 1080 },
  carousel_cta: { w: 1080, h: 1080 },
  reel: { w: 1080, h: 1920 },
  reel_scene: { w: 1080, h: 1920 },
  reel_closing: { w: 1080, h: 1920 },
};

// ---------------------------------------------------------------------------
// Background HTML helper
// ---------------------------------------------------------------------------

function bgHTML(url?: string): string {
  if (!url) return '';
  return `<div class="bg"><img src="${url}" alt=""></div>`;
}

// ---------------------------------------------------------------------------
// Templates — exact copy from render-al-post.mjs (n8n)
// ---------------------------------------------------------------------------

function treatmentTemplate(a: Record<string, string>, bgUrl?: string): string {
  const stats: { num: string; lbl: string }[] = [];
  if (a.stat1) stats.push({ num: a.stat1, lbl: a['stat1-label'] || '' });
  if (a.stat2) stats.push({ num: a.stat2, lbl: a['stat2-label'] || '' });
  if (a.stat3) stats.push({ num: a.stat3, lbl: a['stat3-label'] || '' });
  const statsHTML = stats.length > 0 ? `<div class="stat-row">${stats.map(s =>
    `<div class="stat-box"><span class="num">${s.num}</span><span class="lbl">${s.lbl}</span></div>`
  ).join('')}</div>` : '';
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A1A1A;position:relative;background:#FAF9F6}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover}
.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(250,249,246,0.6) 0%,rgba(250,249,246,0.2) 28%,rgba(250,249,246,0.15) 42%,rgba(250,249,246,0.4) 62%,rgba(250,249,246,0.88) 80%,rgba(250,249,246,0.96) 100%)}
.glow{position:absolute;top:-100px;right:-100px;width:500px;height:500px;background:radial-gradient(circle,rgba(184,146,74,0.08)0%,transparent 70%);border-radius:50%;z-index:1}
.badge{position:absolute;top:48px;left:48px;z-index:2;display:flex;align-items:center;gap:10px}
.badge .dot{width:12px;height:12px;background:#B8924A;border-radius:50%;box-shadow:0 0 8px rgba(184,146,74,0.6)}
.badge .label{font-weight:800;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#B8924A}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(26,26,26,0.4)}
.brand-top span{color:rgba(184,146,74,0.6)}
.hero-text{position:absolute;top:110px;left:48px;right:48px;z-index:2}
.headline{font-family:'Playfair Display',serif;font-size:64px;line-height:1.08;color:#1A1A1A;text-shadow:0 2px 12px rgba(250,249,246,0.5);margin-bottom:12px}
.headline em{color:#B8924A;font-style:normal;display:block;margin-top:8px;font-size:48px;line-height:1.15;text-shadow:0 1px 8px rgba(250,249,246,0.4)}
.body-text{font-size:22px;color:#6B6B6B;line-height:1.5;max-width:800px;margin-top:16px}
.content-area{position:absolute;bottom:0;left:0;right:0;padding:0 48px 44px;z-index:2}
.gold-rule{width:80px;height:3px;background:#B8924A;margin-bottom:24px}
.stat-row{display:flex;gap:14px;margin-bottom:24px}
.stat-box{background:rgba(184,146,74,0.08);border:1px solid rgba(184,146,74,0.2);border-radius:12px;padding:14px 20px;text-align:center;flex:1;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.stat-box .num{font-family:'Playfair Display',serif;font-size:36px;color:#B8924A;display:block}
.stat-box .lbl{font-size:12px;color:#6B6B6B;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px}
.cta-bar{background:linear-gradient(135deg,#B8924A,#9A7A3C);border-radius:12px;padding:18px 28px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.cta-text{font-family:'Playfair Display',serif;font-size:24px;color:#FFFFFF}
.cta-arrow{font-size:26px;color:#FFFFFF}
.footer{display:flex;align-items:center;justify-content:space-between}
.disclaimer{font-size:11px;color:rgba(26,26,26,0.3);line-height:1.5;max-width:680px}
.brand-footer{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.brand-name{font-family:'Playfair Display',serif;font-size:18px;color:#B8924A}
.brand-tagline{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6B6B6B}
</style></head><body>
${bgHTML(bgUrl)}
<div class="scrim"></div>
<div class="glow"></div>
<div class="badge"><div class="dot"></div><span class="label">${a.category || 'Treatment Spotlight'}</span></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="hero-text">
  <h1 class="headline">${a.headline || 'Headline Here'}<em>${a['headline-highlight'] || ''}</em></h1>
  ${a.body ? `<p class="body-text">${a.body}</p>` : ''}
</div>
<div class="content-area">
  <div class="gold-rule"></div>
  ${statsHTML}
  ${a.cta ? `<div class="cta-bar"><span class="cta-text">${a.cta}</span><span class="cta-arrow">&#8594;</span></div>` : ''}
  <div class="footer">
    <div class="disclaimer">${AL_DISCLAIMER}</div>
    <div class="brand-footer"><span class="brand-name">Aesthetic Lounge</span><span class="brand-tagline">Where Science Meets Beauty</span></div>
  </div>
</div>
</body></html>`;
}

function tipsTemplate(a: Record<string, string>, bgUrl?: string): string {
  const tips = [a.tip1, a.tip2, a.tip3, a.tip4, a.tip5].filter(Boolean);
  if (tips.length === 0) tips.push('Tip 1', 'Tip 2', 'Tip 3');
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A1A1A;position:relative;background:#FAF9F6}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover}
.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(250,249,246,0.65) 0%,rgba(250,249,246,0.25) 25%,rgba(250,249,246,0.15) 40%,rgba(250,249,246,0.45) 60%,rgba(250,249,246,0.9) 80%,rgba(250,249,246,0.97) 100%)}
.glow{position:absolute;bottom:-100px;right:-100px;width:500px;height:500px;background:radial-gradient(circle,rgba(184,146,74,0.08)0%,transparent 70%);border-radius:50%;z-index:1}
.badge{position:absolute;top:48px;left:48px;z-index:2;display:flex;align-items:center;gap:10px}
.badge .dot{width:12px;height:12px;background:#B8924A;border-radius:50%;box-shadow:0 0 8px rgba(184,146,74,0.6)}
.badge .label{font-weight:800;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#B8924A}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(26,26,26,0.4)}
.brand-top span{color:rgba(184,146,74,0.6)}
.hero-text{position:absolute;top:100px;left:48px;right:48px;z-index:2}
.headline{font-family:'Playfair Display',serif;font-size:54px;line-height:1.1;color:#1A1A1A;margin-bottom:8px}
.headline em{color:#B8924A;font-style:normal}
.content-area{position:absolute;bottom:0;left:0;right:0;padding:0 48px 44px;z-index:2}
.gold-rule{width:80px;height:3px;background:#B8924A;margin-bottom:20px}
.tip-list{list-style:none;display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
.tip-list li{display:flex;align-items:flex-start;gap:14px;font-size:21px;color:rgba(26,26,26,0.85);line-height:1.4}
.tip-icon{width:32px;height:32px;min-width:32px;background:rgba(184,146,74,0.15);border:1.5px solid #B8924A;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#B8924A;font-size:15px;font-weight:700;margin-top:2px}
.cta-bar{background:linear-gradient(135deg,#B8924A,#9A7A3C);border-radius:12px;padding:18px 28px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.cta-text{font-family:'Playfair Display',serif;font-size:24px;color:#FFFFFF}
.cta-arrow{font-size:26px;color:#FFFFFF}
.footer{display:flex;align-items:center;justify-content:space-between}
.disclaimer{font-size:11px;color:rgba(26,26,26,0.3);line-height:1.5;max-width:680px}
.brand-footer{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.brand-name{font-family:'Playfair Display',serif;font-size:18px;color:#B8924A}
.brand-tagline{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6B6B6B}
</style></head><body>
${bgHTML(bgUrl)}
<div class="scrim"></div>
<div class="glow"></div>
<div class="badge"><div class="dot"></div><span class="label">${a.category || 'Beauty Tips'}</span></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="hero-text">
  <h1 class="headline">${a.headline || 'Headline Here'} <em>${a['headline-highlight'] || ''}</em></h1>
</div>
<div class="content-area">
  <div class="gold-rule"></div>
  <ul class="tip-list">
    ${tips.map((t, i) => `<li><span class="tip-icon">${i + 1}</span><span>${t}</span></li>`).join('\n    ')}
  </ul>
  ${a.cta ? `<div class="cta-bar"><span class="cta-text">${a.cta}</span><span class="cta-arrow">&#8594;</span></div>` : ''}
  <div class="footer">
    <div class="disclaimer">${AL_DISCLAIMER}</div>
    <div class="brand-footer"><span class="brand-name">Aesthetic Lounge</span><span class="brand-tagline">Where Science Meets Beauty</span></div>
  </div>
</div>
</body></html>`;
}

function statsTemplate(a: Record<string, string>, bgUrl?: string): string {
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A1A1A;position:relative;background:#FAF9F6}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover}
.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(250,249,246,0.6) 0%,rgba(250,249,246,0.2) 25%,rgba(250,249,246,0.15) 42%,rgba(250,249,246,0.45) 62%,rgba(250,249,246,0.9) 82%,rgba(250,249,246,0.97) 100%)}
.glow{position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(184,146,74,0.08)0%,transparent 60%);border-radius:50%;z-index:1}
.badge{position:absolute;top:48px;left:48px;z-index:2;display:flex;align-items:center;gap:10px}
.badge .dot{width:12px;height:12px;background:#B8924A;border-radius:50%;box-shadow:0 0 8px rgba(184,146,74,0.6)}
.badge .label{font-weight:800;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#B8924A}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(26,26,26,0.4)}
.brand-top span{color:rgba(184,146,74,0.6)}
.hero-number{position:absolute;top:110px;left:48px;right:48px;z-index:2}
.big-number{font-family:'Playfair Display',serif;font-size:140px;line-height:1;color:#B8924A;text-shadow:0 2px 12px rgba(184,146,74,0.2),0 0 60px rgba(184,146,74,0.15)}
.big-label{font-size:20px;color:#6B6B6B;letter-spacing:4px;text-transform:uppercase;margin-top:8px}
.headline{font-family:'Playfair Display',serif;font-size:52px;line-height:1.1;color:#1A1A1A;margin-top:20px}
.headline em{color:#B8924A;font-style:normal;display:block;margin-top:6px;font-size:42px}
.content-area{position:absolute;bottom:0;left:0;right:0;padding:0 48px 44px;z-index:2}
.gold-rule{width:80px;height:3px;background:#B8924A;margin-bottom:20px}
.body-text{font-size:22px;color:#6B6B6B;line-height:1.5;max-width:800px;margin-bottom:24px}
.cta-bar{background:linear-gradient(135deg,#B8924A,#9A7A3C);border-radius:12px;padding:18px 28px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.cta-text{font-family:'Playfair Display',serif;font-size:24px;color:#FFFFFF}
.cta-arrow{font-size:26px;color:#FFFFFF}
.footer{display:flex;align-items:center;justify-content:space-between}
.disclaimer{font-size:11px;color:rgba(26,26,26,0.3);line-height:1.5;max-width:680px}
.brand-footer{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.brand-name{font-family:'Playfair Display',serif;font-size:18px;color:#B8924A}
.brand-tagline{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6B6B6B}
</style></head><body>
${bgHTML(bgUrl)}
<div class="scrim"></div>
<div class="glow"></div>
<div class="badge"><div class="dot"></div><span class="label">${a.category || 'Results'}</span></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="hero-number">
  <div class="big-number">${a['big-number'] || '98%'}</div>
  <div class="big-label">${a['big-label'] || 'Key Metric'}</div>
  <h1 class="headline">${a.headline || 'Headline'}<em>${a['headline-highlight'] || ''}</em></h1>
</div>
<div class="content-area">
  <div class="gold-rule"></div>
  ${a.body ? `<p class="body-text">${a.body}</p>` : ''}
  ${a.cta ? `<div class="cta-bar"><span class="cta-text">${a.cta}</span><span class="cta-arrow">&#8594;</span></div>` : ''}
  <div class="footer">
    <div class="disclaimer">${AL_DISCLAIMER}</div>
    <div class="brand-footer"><span class="brand-name">Aesthetic Lounge</span><span class="brand-tagline">Where Science Meets Beauty</span></div>
  </div>
</div>
</body></html>`;
}

function overlayTemplate(a: Record<string, string>, bgUrl?: string): string {
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A1A1A;position:relative;background:#FAF9F6}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover}
.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(250,249,246,0.55) 0%,rgba(250,249,246,0.15) 25%,rgba(250,249,246,0.10) 42%,rgba(250,249,246,0.40) 62%,rgba(250,249,246,0.88) 80%,rgba(250,249,246,0.96) 100%)}
.badge{position:absolute;top:48px;left:48px;z-index:2;display:flex;align-items:center;gap:10px}
.badge .dot{width:12px;height:12px;background:#B8924A;border-radius:50%;box-shadow:0 0 8px rgba(184,146,74,0.6)}
.badge .label{font-weight:800;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#B8924A}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(26,26,26,0.4)}
.brand-top span{color:rgba(184,146,74,0.6)}
.hero-text{position:absolute;top:110px;left:48px;right:48px;z-index:2}
.headline{font-family:'Playfair Display',serif;font-size:60px;line-height:1.08;color:#1A1A1A;margin-bottom:12px}
.headline em{color:#B8924A;font-style:normal;display:block;margin-top:10px;font-size:48px;line-height:1.2}
.subtitle{font-size:22px;color:#6B6B6B;line-height:1.5;max-width:800px;margin-top:16px}
.content-area{position:absolute;bottom:0;left:0;right:0;padding:0 48px 44px;z-index:2}
.gold-rule{width:80px;height:3px;background:#B8924A;margin-bottom:20px}
.hook{font-size:20px;color:rgba(26,26,26,0.6);line-height:1.4;font-family:'Cormorant Garamond',serif;font-style:italic;margin-bottom:24px;max-width:600px}
.hook strong{color:#B8924A;font-style:normal;font-weight:600}
.footer{display:flex;align-items:center;justify-content:space-between}
.disclaimer{font-size:11px;color:rgba(26,26,26,0.3);line-height:1.5;max-width:680px}
.brand-footer{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.brand-name{font-family:'Playfair Display',serif;font-size:18px;color:#B8924A}
.brand-tagline{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6B6B6B}
</style></head><body>
${bgHTML(bgUrl)}
<div class="scrim"></div>
<div class="badge"><div class="dot"></div><span class="label">${a.category || 'Treatment Spotlight'}</span></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="hero-text">
  <h1 class="headline">${a.headline || 'Headline Here'}<em>${a['headline-highlight'] || ''}</em></h1>
  ${a.subtitle ? `<p class="subtitle">${a.subtitle}</p>` : ''}
</div>
<div class="content-area">
  <div class="gold-rule"></div>
  ${a.hook ? `<p class="hook">${a.hook}</p>` : ''}
  <div class="footer">
    <div class="disclaimer">${AL_DISCLAIMER}</div>
    <div class="brand-footer"><span class="brand-name">Aesthetic Lounge</span><span class="brand-tagline">Where Science Meets Beauty</span></div>
  </div>
</div>
</body></html>`;
}

function lifestyleTemplate(a: Record<string, string>, bgUrl?: string): string {
  const cities = a.cities ? a.cities.split(',').map(c => c.trim()).filter(Boolean) : [];
  const hasStats = a.stat1 || a.stat2 || a.stat3;
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;position:relative}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover;object-position:center top}
.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(26,26,26,0.45) 0%,rgba(26,26,26,0.08) 18%,rgba(26,26,26,0.05) 35%,rgba(26,26,26,0.18) 55%,rgba(26,26,26,0.72) 75%,rgba(26,26,26,0.92) 100%)}
.badge{position:absolute;top:48px;left:48px;z-index:2;display:flex;align-items:center;gap:10px}
.badge .dot{width:12px;height:12px;background:#D4B876;border-radius:50%;box-shadow:0 0 8px rgba(212,184,118,0.6)}
.badge .label{font-weight:800;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#D4B876}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(255,255,255,0.5)}
.brand-top span{color:rgba(212,184,118,0.6)}
.content-area{position:absolute;bottom:0;left:0;right:0;padding:0 48px 36px;z-index:2}
.headline{font-family:'Playfair Display',serif;font-size:50px;line-height:1.08;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,0.6);margin-bottom:8px}
.headline em{color:#D4B876;font-style:normal}
.body-text{font-size:19px;color:rgba(255,255,255,0.85);line-height:1.5;text-shadow:0 1px 8px rgba(0,0,0,0.5);max-width:800px;margin-bottom:12px}
.stats-row{display:flex;gap:12px;margin-bottom:14px}
.stat-box{flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(212,184,118,0.25);border-radius:12px;padding:14px 12px;text-align:center;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.stat-value{font-family:'Playfair Display',serif;font-size:30px;color:#D4B876;line-height:1;margin-bottom:4px}
.stat-label{font-size:11px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:1px;font-weight:600}
.cities-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.city-tag{background:rgba(212,184,118,0.15);border:1px solid rgba(212,184,118,0.3);color:#D4B876;font-size:13px;font-weight:600;letter-spacing:1px;padding:6px 16px;border-radius:50px}
.model-badge{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.model-name{font-size:15px;font-weight:600;color:rgba(255,255,255,0.75)}
.model-title{font-size:12px;color:rgba(255,255,255,0.4)}
.gold-rule{width:80px;height:3px;background:#B8924A;margin-bottom:14px}
.footer{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08)}
.disclaimer{font-size:10px;color:rgba(255,255,255,0.25);line-height:1.5;max-width:680px}
.brand-footer{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.brand-name{font-family:'Playfair Display',serif;font-size:16px;color:#D4B876}
.brand-tagline{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.4)}
</style></head><body>
${bgHTML(bgUrl)}
<div class="scrim"></div>
<div class="badge"><div class="dot"></div><span class="label">${a.category || 'Treatment Spotlight'}</span></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="content-area">
  <div class="gold-rule"></div>
  <h1 class="headline">${a.headline || 'Headline Here'}${a['headline-highlight'] ? `<br><em>${a['headline-highlight']}</em>` : ''}</h1>
  ${a.body ? `<p class="body-text">${a.body}</p>` : ''}
  ${hasStats ? `<div class="stats-row">
    ${a.stat1 ? `<div class="stat-box"><div class="stat-value">${a.stat1}</div><div class="stat-label">${a['stat1-label'] || ''}</div></div>` : ''}
    ${a.stat2 ? `<div class="stat-box"><div class="stat-value">${a.stat2}</div><div class="stat-label">${a['stat2-label'] || ''}</div></div>` : ''}
    ${a.stat3 ? `<div class="stat-box"><div class="stat-value">${a.stat3}</div><div class="stat-label">${a['stat3-label'] || ''}</div></div>` : ''}
  </div>` : ''}
  ${cities.length > 0 ? `<div class="cities-row">${cities.map(c => `<span class="city-tag">${c}</span>`).join('')}</div>` : ''}
  ${a['model-name'] ? `<div class="model-badge"><div class="model-name">${a['model-name']}</div>${a['model-title'] ? `<div class="model-title">&middot; ${a['model-title']}</div>` : ''}</div>` : ''}
  <div class="footer">
    <div class="disclaimer">${AL_DISCLAIMER}</div>
    <div class="brand-footer"><span class="brand-name">Aesthetic Lounge</span><span class="brand-tagline">Where Science Meets Beauty</span></div>
  </div>
</div>
</body></html>`;
}

function carouselHookTemplate(a: Record<string, string>, bgUrl?: string): string {
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;position:relative}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover;object-position:center top}
.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(26,26,26,0.6) 0%,rgba(26,26,26,0.2) 20%,rgba(26,26,26,0.15) 40%,rgba(26,26,26,0.5) 65%,rgba(26,26,26,0.92) 85%,rgba(26,26,26,0.98) 100%)}
.badge{position:absolute;top:48px;left:48px;z-index:2;display:flex;align-items:center;gap:10px}
.badge .dot{width:12px;height:12px;background:#D4B876;border-radius:50%;box-shadow:0 0 8px rgba(212,184,118,0.6)}
.badge .label{font-weight:800;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#D4B876}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(255,255,255,0.5)}
.brand-top span{color:rgba(212,184,118,0.6)}
.hero-text{position:absolute;bottom:120px;left:48px;right:48px;z-index:2}
.headline{font-family:'Playfair Display',serif;font-size:80px;line-height:1.05;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,0.6)}
.headline em{color:#D4B876;font-style:normal;display:block;margin-top:8px;font-size:58px;line-height:1.12}
.swipe-indicator{position:absolute;bottom:48px;right:48px;z-index:2;display:flex;align-items:center;gap:10px;color:rgba(255,255,255,0.6);font-size:15px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
.swipe-arrow{font-size:28px;color:#D4B876;animation:nudge 1.5s ease-in-out infinite}
@keyframes nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}
</style></head><body>
${bgHTML(bgUrl)}
<div class="scrim"></div>
<div class="badge"><div class="dot"></div><span class="label">${a.category || 'Beauty Tips'}</span></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="hero-text">
  <h1 class="headline">${a.headline || 'Headline Here'}<em>${a['headline-highlight'] || ''}</em></h1>
</div>
<div class="swipe-indicator"><span>Swipe</span><span class="swipe-arrow">&#8594;</span></div>
</body></html>`;
}

function carouselInfoTemplate(a: Record<string, string>, bgUrl?: string): string {
  const slideNum = a['slide-number'] || '01';
  const slideTotal = a['slide-total'] || '5';
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A1A1A;position:relative;background:#FAF9F6}
${bgUrl ? `.bg-texture{position:absolute;inset:0;z-index:0;opacity:0.15}.bg-texture img{width:100%;height:100%;object-fit:cover}` : ''}
.glow{position:absolute;top:20%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(184,146,74,0.06)0%,transparent 60%);border-radius:50%;z-index:0}
.slide-badge{position:absolute;top:48px;left:48px;z-index:2;font-family:'Playfair Display',serif;font-size:80px;color:rgba(184,146,74,0.12);line-height:1}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(26,26,26,0.4)}
.brand-top span{color:rgba(184,146,74,0.6)}
.center-content{position:absolute;top:50%;left:48px;right:48px;transform:translateY(-50%);z-index:2;text-align:center}
.big-number{font-family:'Playfair Display',serif;font-size:120px;line-height:1;color:#B8924A;text-shadow:0 0 60px rgba(184,146,74,0.15);margin-bottom:8px}
.big-label{font-size:16px;color:#6B6B6B;letter-spacing:4px;text-transform:uppercase;margin-bottom:40px}
.headline{font-family:'Playfair Display',serif;font-size:44px;line-height:1.15;color:#1A1A1A;margin-bottom:20px}
.body-text{font-size:22px;color:#6B6B6B;line-height:1.55;max-width:800px;margin:0 auto}
.slide-counter{position:absolute;bottom:48px;left:50%;transform:translateX(-50%);z-index:2;font-size:14px;color:rgba(26,26,26,0.3);letter-spacing:2px}
</style></head><body>
${bgUrl ? `<div class="bg-texture"><img src="${bgUrl}" alt=""></div>` : ''}
<div class="glow"></div>
<div class="slide-badge">${String(slideNum).padStart(2, '0')}</div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="center-content">
  ${a['big-number'] ? `<div class="big-number">${a['big-number']}</div>` : ''}
  ${a['big-label'] ? `<div class="big-label">${a['big-label']}</div>` : ''}
  <h1 class="headline">${a.headline || 'Key Point'}</h1>
  ${a.body ? `<p class="body-text">${a.body}</p>` : ''}
</div>
<div class="slide-counter">${slideNum} of ${slideTotal}</div>
</body></html>`;
}

function carouselCtaTemplate(a: Record<string, string>, bgUrl?: string): string {
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A1A1A;position:relative;background:#FAF9F6}
${bgUrl ? `.bg-texture{position:absolute;inset:0;z-index:0;opacity:0.15}.bg-texture img{width:100%;height:100%;object-fit:cover}` : ''}
.glow{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);width:700px;height:700px;background:radial-gradient(circle,rgba(184,146,74,0.08)0%,transparent 55%);border-radius:50%;z-index:0}
.brand-top{position:absolute;top:48px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:20px;color:rgba(26,26,26,0.4)}
.brand-top span{color:rgba(184,146,74,0.6)}
.center-content{position:absolute;top:50%;left:48px;right:48px;transform:translateY(-55%);z-index:2;text-align:center}
.gold-rule{width:80px;height:3px;background:#B8924A;margin:0 auto 32px}
.headline{font-family:'Playfair Display',serif;font-size:52px;line-height:1.12;color:#1A1A1A;margin-bottom:40px}
.headline em{color:#B8924A;font-style:normal}
.cta-bar{background:linear-gradient(135deg,#B8924A,#9A7A3C);border-radius:16px;padding:24px 48px;display:inline-flex;align-items:center;gap:16px;margin-bottom:24px}
.cta-text{font-family:'Playfair Display',serif;font-size:28px;color:#FFFFFF}
.cta-arrow{font-size:30px;color:#FFFFFF}
.subtitle{font-size:18px;color:#6B6B6B;margin-top:12px}
.footer{position:absolute;bottom:0;left:0;right:0;padding:0 48px 44px;z-index:2}
.disclaimer{font-size:11px;color:rgba(26,26,26,0.3);line-height:1.5;text-align:center;margin-bottom:16px}
.brand-footer{display:flex;justify-content:center;align-items:center;gap:24px}
.brand-name{font-family:'Playfair Display',serif;font-size:20px;color:#B8924A}
.brand-tagline{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#6B6B6B}
</style></head><body>
${bgUrl ? `<div class="bg-texture"><img src="${bgUrl}" alt=""></div>` : ''}
<div class="glow"></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="center-content">
  <div class="gold-rule"></div>
  <h1 class="headline">${a.headline || 'Discover Your Glow'}</h1>
  ${a.cta ? `<div class="cta-bar"><span class="cta-text">${a.cta}</span><span class="cta-arrow">&#8594;</span></div>` : ''}
  ${a.subtitle ? `<p class="subtitle">${a.subtitle}</p>` : ''}
</div>
<div class="footer">
  <div class="disclaimer">${AL_DISCLAIMER}</div>
  <div class="brand-footer"><span class="brand-name">Aesthetic Lounge</span><span class="brand-tagline">Where Science Meets Beauty</span></div>
</div>
</body></html>`;
}

function reelTemplate(a: Record<string, string>, bgUrl?: string): string {
  const cities = a.cities ? a.cities.split(',').map(c => c.trim()).filter(Boolean) : [];
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;font-family:'Inter',sans-serif;color:#fff;position:relative}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover;object-position:center top}
.scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(26,26,26,0.55) 0%,rgba(26,26,26,0.10) 18%,rgba(26,26,26,0.05) 35%,rgba(26,26,26,0.15) 55%,rgba(26,26,26,0.70) 72%,rgba(26,26,26,0.92) 85%,rgba(26,26,26,0.98) 100%)}
.badge{position:absolute;top:64px;left:48px;z-index:2;display:flex;align-items:center;gap:10px}
.badge .dot{width:12px;height:12px;background:#D4B876;border-radius:50%;box-shadow:0 0 8px rgba(212,184,118,0.6)}
.badge .label{font-weight:800;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#D4B876}
.brand-top{position:absolute;top:64px;right:48px;z-index:2;font-family:'Playfair Display',serif;font-size:22px;color:rgba(255,255,255,0.5)}
.brand-top span{color:rgba(212,184,118,0.6)}
.hero-text{position:absolute;top:160px;left:48px;right:48px;z-index:2}
.headline{font-family:'Playfair Display',serif;font-size:72px;line-height:1.06;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.8);margin-bottom:12px}
.headline em{color:#D4B876;font-style:normal;display:block;margin-top:10px;font-size:56px;line-height:1.12;text-shadow:0 4px 20px rgba(0,0,0,0.7)}
.content-area{position:absolute;bottom:0;left:0;right:0;padding:0 48px 64px;z-index:2}
.gold-rule{width:80px;height:3px;background:#B8924A;margin-bottom:24px;box-shadow:0 0 12px rgba(184,146,74,0.4)}
.body-text{font-size:24px;color:rgba(255,255,255,0.95);line-height:1.55;text-shadow:0 2px 12px rgba(0,0,0,0.8),0 1px 4px rgba(0,0,0,0.9);max-width:900px;margin-bottom:20px}
.cities-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.city-tag{background:rgba(212,184,118,0.15);border:1px solid rgba(212,184,118,0.3);color:#D4B876;font-size:14px;font-weight:600;letter-spacing:1px;padding:8px 18px;border-radius:50px}
.footer{display:flex;align-items:center;justify-content:space-between}
.disclaimer{font-size:11px;color:rgba(255,255,255,0.35);line-height:1.5;max-width:680px}
.brand-footer{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.brand-name{font-family:'Playfair Display',serif;font-size:18px;color:#D4B876}
.brand-tagline{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.5)}
</style></head><body>
${bgHTML(bgUrl)}
<div class="scrim"></div>
<div class="badge"><div class="dot"></div><span class="label">${a.category || 'Glow Up'}</span></div>
<span class="brand-top">Aesthetic<span>Lounge</span></span>
<div class="hero-text">
  <h1 class="headline">${a.headline || 'Headline Here'}<em>${a['headline-highlight'] || ''}</em></h1>
</div>
<div class="content-area">
  <div class="gold-rule"></div>
  ${a.body ? `<p class="body-text">${a.body}</p>` : ''}
  ${cities.length > 0 ? `<div class="cities-row">${cities.map(c => `<span class="city-tag">${c}</span>`).join('')}</div>` : ''}
  <div class="footer">
    <div class="disclaimer">${AL_DISCLAIMER}</div>
    <div class="brand-footer"><span class="brand-name">Aesthetic Lounge</span><span class="brand-tagline">Where Science Meets Beauty</span></div>
  </div>
</div>
</body></html>`;
}

function reelSceneTemplate(a: Record<string, string>, bgUrl?: string): string {
  return `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:#FAF9F6}
.bg{position:absolute;inset:0;z-index:0}
.bg img{width:100%;height:100%;object-fit:cover;object-position:center top}
</style></head><body>
${bgHTML(bgUrl)}
</body></html>`;
}

function reelClosingTemplate(a: Record<string, string>): string {
  return `<!DOCTYPE html><html><head>
<link href="${AL_FONTS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A1A1A;background:#FAF9F6}
.brand-zone{position:relative;width:100%;height:864px;overflow:hidden;background:linear-gradient(135deg,#B8924A 0%,#D4B876 40%,#B8924A 70%,#9A7A3C 100%);display:flex;flex-direction:column;align-items:center;justify-content:center}
.brand-zone-inner{position:relative;z-index:2;text-align:center}
.brand-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:700px;background:radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 60%);pointer-events:none;z-index:1}
.brand-logo{font-family:'Playfair Display',serif;font-size:72px;color:#FFFFFF;letter-spacing:2px;text-shadow:0 4px 24px rgba(0,0,0,0.2);margin-bottom:12px;font-weight:700}
.brand-subtitle{font-size:20px;font-weight:600;letter-spacing:8px;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-bottom:24px}
.brand-divider{width:120px;height:3px;background:rgba(255,255,255,0.5);margin:0 auto 24px}
.brand-tagline-hero{font-family:'Cormorant Garamond',serif;font-size:28px;color:rgba(255,255,255,0.9);font-style:italic;letter-spacing:1px}
.content-zone{position:relative;padding:32px 60px 48px;display:flex;flex-direction:column;align-items:center;height:1056px}
.brand{font-family:'Playfair Display',serif;font-size:54px;color:#1A1A1A;margin-bottom:6px;text-align:center}
.brand span{color:#B8924A}
.title{font-size:17px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:#6B6B6B;margin-bottom:36px}
.gold-rule{width:80px;height:3px;background:#B8924A;margin-bottom:32px;box-shadow:0 0 12px rgba(184,146,74,0.3)}
.slogan{font-family:'Cormorant Garamond',serif;font-size:32px;color:rgba(26,26,26,0.75);text-align:center;margin-bottom:44px;line-height:1.35;font-style:italic}
.slogan em{color:#B8924A;font-style:italic}
.contact-list{display:flex;flex-direction:column;gap:20px;align-items:center;margin-bottom:36px}
.contact-item{display:flex;align-items:center;gap:16px;font-size:22px;color:rgba(26,26,26,0.7)}
.contact-icon{width:44px;height:44px;border-radius:50%;background:rgba(184,146,74,0.1);border:1px solid rgba(184,146,74,0.25);display:flex;align-items:center;justify-content:center;color:#B8924A;font-size:18px;font-weight:700}
.gold-divider{width:120px;height:2px;background:linear-gradient(90deg,transparent,#B8924A,transparent);margin-bottom:20px}
.disclaimer{font-size:11px;color:rgba(26,26,26,0.25);text-align:center;line-height:1.5;max-width:800px;margin-top:auto}
</style></head><body>
<div class="brand-zone">
  <div class="brand-glow"></div>
  <div class="brand-zone-inner">
    <div class="brand-logo">AESTHETIC LOUNGE</div>
    <div class="brand-subtitle">Medical Aesthetics</div>
    <div class="brand-divider"></div>
    <div class="brand-tagline-hero">Where Science Meets Beauty</div>
  </div>
</div>
<div class="content-zone">
  <div class="brand">Aesthetic<span>Lounge</span></div>
  <div class="title">Medical Aesthetics</div>
  <div class="gold-rule"></div>
  <div class="slogan">"${a.slogan || 'Where <em>Science</em> Meets Beauty'}"</div>
  <div class="contact-list">
    <div class="contact-item"><div class="contact-icon">P</div>${a.phone || '+92 327 6620000'}</div>
    <div class="contact-item"><div class="contact-icon">W</div>${a.website || 'aestheticloungeofficial.com'}</div>
    <div class="contact-item"><div class="contact-icon">@</div>${a.instagram || '@aestheticlounge.official'}</div>
  </div>
  <div class="gold-divider"></div>
  <div class="disclaimer">${AL_DISCLAIMER}</div>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Template Registry
// ---------------------------------------------------------------------------

const TEMPLATES: Record<string, (a: Record<string, string>, bgUrl?: string) => string> = {
  treatment: treatmentTemplate,
  tips: tipsTemplate,
  stats: statsTemplate,
  overlay: overlayTemplate,
  lifestyle: lifestyleTemplate,
  carousel_hook: carouselHookTemplate,
  carousel_info: carouselInfoTemplate,
  carousel_cta: carouselCtaTemplate,
  reel: reelTemplate,
  reel_scene: reelSceneTemplate,
  reel_closing: reelClosingTemplate,
};

// ---------------------------------------------------------------------------
// Public API — same interface as before
// ---------------------------------------------------------------------------

export async function renderOverlay(opts: OverlayParams): Promise<Buffer> {
  const templateFn = TEMPLATES[opts.template];
  if (!templateFn) throw new Error(`Unknown template: ${opts.template}`);

  const dims = DEFAULT_DIMS[opts.template] || { w: 1080, h: 1080 };
  const width = opts.width || dims.w;
  const height = opts.height || dims.h;

  const html = templateFn(opts.params, opts.backgroundUrl);

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewportSize({ width, height });
    await page.setContent(html, { waitUntil: 'networkidle' });
    // Wait for Google Fonts to load
    await page.waitForTimeout(2000);

    const pngBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height },
    });
    return Buffer.from(pngBuffer);
  } finally {
    await page.close();
  }
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
