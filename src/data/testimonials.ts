export interface Testimonial {
  id: number;
  name: string;
  location: string;
  treatment: string;
  rating: number;
  quote: string;
}

// TODO: Add real Google reviews — paste them and they'll be added here
export const testimonials: Testimonial[] = [];
