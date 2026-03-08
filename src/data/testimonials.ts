export interface Testimonial {
  id: number;
  name: string;
  location: string;
  treatment: string;
  rating: number;
  quote: string;
  /** 'google' = imported from GBP dashboard, 'manual' = added manually */
  source: 'google' | 'manual';
}

// Reviews can be imported from the Google Business Profile dashboard (/dashboard/google → Reviews tab)
export const testimonials: Testimonial[] = [];
