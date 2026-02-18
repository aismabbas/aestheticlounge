# Aesthetic Lounge Official — Website Redesign

## Overview
Redesigning **aestheticloungeofficial.com** — a premium medical aesthetics clinic in DHA Lahore, Pakistan. Replacing the current WordPress/Elementor site with a modern, fast, premium website.

## Client
- **Business**: Aesthetic Lounge Official
- **Location**: DHA Phase 5, Lahore, Pakistan
- **Services**: 80+ aesthetic treatments (fillers, botox, laser, HydraFacial, etc.)
- **Doctors**: 3 (Dermatologist, Aesthetic Surgeon, Cosmetic Dentist)

---

## Phase 1: Static Prototype (CURRENT)

**Status**: ✅ Complete — awaiting client feedback

**File**: `prototype/index.html`

Single-page HTML/CSS/JS prototype of the full homepage design.

### Color Theme
| Token | Hex | Usage |
|-------|-----|-------|
| White | `#FFFFFF` | Page backgrounds |
| Cream | `#FAF9F6` | Alternate section backgrounds |
| Warm white | `#F5F3EF` | Subtle surfaces |
| Gold | `#B8924A` | Primary accent — CTAs, accents, hover states |
| Gold light | `#D4B876` | Shimmer gradients, secondary gold |
| Gold dark | `#96742F` | Button hover, deep gold |
| Gold pale | `#F0E6D0` | Soft backgrounds |
| Text | `#1A1A1A` | Primary text |
| Text light | `#6B6B6B` | Secondary text |
| Text lighter | `#999999` | Muted text |

### Fonts
- **Playfair Display** — Headings (serif, elegant)
- **Cormorant Garamond** — Testimonial quotes (light serif)
- **Inter** — Body text (clean sans-serif)

### Sections in Prototype
1. **Header** — Logo, nav links, "Book a Visit" gold button. Transparent → solid white on scroll.
2. **Hero** — Split layout: content left (headline, subtitle, CTAs, social proof), image right with floating badges + decorative gold ring.
3. **Marquee** — Horizontal scrolling service names with gold star separators.
4. **About Intro** — Asymmetric overlapping images left, text + feature grid right. Years badge.
5. **Services** — Bento grid layout (mixed card sizes: tall, wide, standard). 11 service categories.
6. **Stats** — Dark band with animated gold-shimmer counters (1000+ clients, 80+ treatments, 3 doctors, 8+ years).
7. **Doctors** — 3 elegant cards with photo, name, title, bio, social links.
8. **Before & After Gallery** — Horizontal scroll of interactive comparison sliders.
9. **Testimonials** — Sticky heading left, scrolling cards right. 4 testimonials with star ratings.
10. **CTA Banner** — Dark section, gold shimmer headline, call + WhatsApp buttons.
11. **Footer** — 4-column layout on dark background. Logo, quick links, top services, contact info.
12. **WhatsApp Float** — Fixed bottom-right, green with pulse animation.

### Design Features
- White & gold luxury aesthetic (not dark template)
- Gold shimmer gradient animation on buttons/stats
- Scroll-triggered reveal animations (fade, slide, scale)
- Bento grid for services (creative, not uniform)
- Asymmetric layout for About section
- Split hero with floating badges
- Parallax on hero visual
- Interactive before/after sliders (drag)
- Sticky testimonials heading
- Marquee text banner
- Fully responsive (mobile, tablet, desktop)

---

## Phase 2: Next.js 14 App (After Approval)

### Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (or keep custom CSS — TBD)
- **Deployment**: Vercel
- **Forms**: Resend API for email
- **SEO**: Metadata, JSON-LD structured data, sitemap.xml

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Full homepage (from prototype) |
| Services | `/services` | All 11 service categories |
| Service Detail | `/services/[slug]` | Individual service page (x11) |
| Doctors | `/doctors` | Full team page |
| About | `/about` | Clinic story, values, gallery |
| Contact | `/contact` | Contact form, map, details |
| Appointment | `/appointment` | Booking form |
| Price Guide | `/price-guide` | Treatment pricing table |

### Service Categories (11)
1. Dermal Fillers (8 treatments)
2. Botox & Anti-Wrinkle (6 treatments)
3. Laser Treatments (12 treatments)
4. Skin Rejuvenation (10 treatments)
5. Chemical Peels (5 treatments)
6. Thread Lifts (4 treatments)
7. HydraFacial (3 treatments)
8. Dental Aesthetics (6 treatments)
9. Hair Restoration (5 treatments)
10. Body Contouring (7 treatments)
11. PRP Therapy (4 treatments)

### Forms
- **Contact form** — Name, email, phone, message → email via Resend
- **Appointment form** — Name, email, phone, service, preferred date/time, notes → email via Resend

### SEO
- OpenGraph + Twitter Card meta tags per page
- JSON-LD: LocalBusiness, MedicalBusiness, Physician schemas
- `sitemap.xml` auto-generated
- `robots.txt`
- Canonical URLs

### Performance
- Static generation (SSG) for all pages
- Image optimization via Next.js `<Image>`
- Font optimization via `next/font`
- Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## Project Structure (Phase 2)
```
aesthetic-lounge/
├── prototype/              # Phase 1 — static HTML prototype
│   └── index.html
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home
│   │   ├── services/
│   │   │   ├── page.tsx       # All services
│   │   │   └── [slug]/
│   │   │       └── page.tsx   # Service detail
│   │   ├── doctors/
│   │   │   └── page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── appointment/
│   │   │   └── page.tsx
│   │   └── price-guide/
│   │       └── page.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── DoctorCard.tsx
│   │   ├── TestimonialCard.tsx
│   │   ├── BeforeAfter.tsx
│   │   ├── StatsCounter.tsx
│   │   ├── WhatsAppButton.tsx
│   │   └── ...
│   ├── data/
│   │   ├── services.ts
│   │   ├── doctors.ts
│   │   └── testimonials.ts
│   └── lib/
│       ├── resend.ts
│       └── utils.ts
├── public/
│   ├── images/
│   └── fonts/
├── PLAN.md
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Checklist

### Phase 1
- [x] Build static HTML/CSS/JS prototype
- [x] White & gold theme
- [x] All homepage sections
- [x] Scroll animations
- [x] Responsive design
- [x] Push to GitHub
- [ ] Client review & feedback
- [ ] Iterate on design

### Phase 2
- [ ] Initialize Next.js 14 project
- [ ] Convert prototype to React components
- [ ] Build all 8 pages
- [ ] Add service data (all 80+ treatments)
- [ ] Working contact & appointment forms
- [ ] SEO (meta, JSON-LD, sitemap)
- [ ] Image optimization
- [ ] Performance audit
- [ ] Deploy to Vercel
- [ ] Connect custom domain
