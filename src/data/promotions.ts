export interface Promotion {
  id: string;
  title: string;
  description: string;
  originalPrice?: number;
  promoPrice?: number;
  discount?: string; // e.g., "20% OFF" or "Buy 2 Get 1 Free"
  treatment: string;
  validUntil: string; // ISO date
  badge?: string; // e.g., "Limited Time", "Popular", "New"
  active: boolean;
}

export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Summer Glow Package',
    description: 'Get camera-ready with our signature HydraFacial + LED therapy combo. Perfect for the wedding season.',
    originalPrice: 15000,
    promoPrice: 11000,
    discount: '27% OFF',
    treatment: 'HydraFacial + LED',
    validUntil: '2026-04-30',
    badge: 'Popular',
    active: true,
  },
  {
    id: 'promo-2',
    title: 'Laser Hair Removal - Full Body',
    description: 'Complete full body laser hair removal package. 6 sessions with our advanced diode laser technology.',
    originalPrice: 60000,
    promoPrice: 45000,
    discount: '25% OFF',
    treatment: 'Full Body Laser',
    validUntil: '2026-03-31',
    badge: 'Limited Time',
    active: true,
  },
  {
    id: 'promo-3',
    title: 'Anti-Aging Bundle',
    description: 'Botox (3 areas) + PRP facial rejuvenation. Turn back the clock with our expert physicians.',
    discount: 'Buy Together & Save PKR 8,000',
    treatment: 'Botox + PRP',
    validUntil: '2026-05-15',
    badge: 'New',
    active: true,
  },
];
