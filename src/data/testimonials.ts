export interface Testimonial {
  id: number;
  name: string;
  location: string;
  treatment: string;
  rating: number;
  quote: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Maham Hassan",
    location: "DHA, Lahore",
    treatment: "Eyelid Surgery (Blepharoplasty)",
    rating: 5,
    quote:
      "I was always conscious of my tired-looking eyes — no matter how much sleep I got, people would ask if I was exhausted. The dark, heavy lids made me look years older than I actually am. After consulting with the team at Aesthetic Lounge, I decided to go ahead with the blepharoplasty and I could not be happier with my decision. The entire process from consultation to recovery was handled with such care and professionalism. My eyes look naturally refreshed and open now, and the compliments have not stopped. Absolutely thrilled with the results!",
  },
  {
    id: 2,
    name: "Ayesha Khan",
    location: "DHA, Lahore",
    treatment: "Medicated Facials",
    rating: 5,
    quote:
      "I had stubborn acne for years and honestly felt like I had tried everything — expensive skincare routines, home remedies, you name it. Nothing seemed to make a lasting difference. When I finally came to Aesthetic Lounge, their dermatologist took the time to really understand my skin and recommended a course of their medicated facials tailored to my specific concerns. Within a few sessions, I started seeing real improvement — my breakouts calmed down, the redness faded, and my skin texture improved dramatically. Their medicated facials genuinely worked wonders where nothing else had.",
  },
  {
    id: 3,
    name: "Zara Ahmed",
    location: "DHA, Lahore",
    treatment: "Laser Hair Removal",
    rating: 5,
    quote:
      "I was tired of temporary hair removal methods — the constant waxing, the ingrown hairs, the irritation. It felt like a never-ending cycle that was both painful and time-consuming. I decided to invest in laser hair removal at Aesthetic Lounge, and it has been one of the best decisions I have made. The staff was incredibly professional, explained the entire process clearly, and made sure I was comfortable throughout every session. The results are amazing — smooth, hair-free skin that I do not have to worry about anymore. I only wish I had done this sooner.",
  },
  {
    id: 4,
    name: "Fatima Sheikh",
    location: "DHA, Lahore",
    treatment: "Nose Reshaping (Rhinoplasty)",
    rating: 5,
    quote:
      "I was nervous about getting rhinoplasty — it is a big decision and I spent months researching before choosing Aesthetic Lounge. From the very first consultation, the surgeon put me at ease. He listened to exactly what I wanted, showed me realistic expectations, and never once pressured me into anything. The surgery itself went smoothly, and while the recovery took patience, every week I could see the swelling go down and my new nose taking shape. The results are natural and exactly what I wanted — my nose looks like it has always belonged on my face, just refined. I could not be more grateful.",
  },
  {
    id: 5,
    name: "Ali Raza",
    location: "DHA, Lahore",
    treatment: "Body Contouring",
    rating: 5,
    quote:
      "After struggling with stubborn belly fat that would not budge no matter how disciplined I was with my diet and gym routine, I decided to explore body contouring options at Aesthetic Lounge. The team was straightforward and honest about what the treatment could and could not achieve, which I really appreciated. They recommended a combination approach tailored to my specific problem areas, and I committed to the full course. The results exceeded my expectations — my midsection looks noticeably slimmer and more defined, and I finally feel confident taking my shirt off. The professionalism and results here are genuinely world-class.",
  },
];
