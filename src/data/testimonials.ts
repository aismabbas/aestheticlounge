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
    name: "Ayesha Malik",
    location: "DHA Phase 6, Lahore",
    treatment: "HydraFacial",
    rating: 5,
    quote:
      "I have tried facials at several clinics in Lahore, but the HydraFacial at Aesthetic Lounge was on another level. My skin was glowing for days. The clinic itself feels so luxurious and clean — exactly the standard you expect in DHA.",
  },
  {
    id: 2,
    name: "Fatima Tariq",
    location: "DHA Phase 5, Lahore",
    treatment: "Lip Fillers",
    rating: 5,
    quote:
      "Dr. Huma did my lip fillers and the results are so natural — nobody can tell they are done, they just say I look fresher. She took time to understand exactly what I wanted and the whole process was comfortable. Highly recommend.",
  },
  {
    id: 3,
    name: "Sana Javed",
    location: "DHA Phase 7, Lahore",
    treatment: "Full Body Laser",
    rating: 5,
    quote:
      "After six sessions of full body laser, I am virtually hair-free. The staff is professional and the laser technology they use is painless compared to my previous clinic. Worth every rupee — I wish I had started sooner.",
  },
  {
    id: 4,
    name: "Mehreen Ahmed",
    location: "DHA Phase 8, Lahore",
    treatment: "Teeth Whitening",
    rating: 4,
    quote:
      "Got my teeth whitened before my wedding and the results were amazing — five shades whiter in one sitting. Dr. Ahmed was thorough with the consultation and the whole team made me feel at ease. My photos turned out beautiful.",
  },
  {
    id: 5,
    name: "Zara Hussain",
    location: "DHA Phase 7, Lahore",
    treatment: "PRP Hair Treatment",
    rating: 5,
    quote:
      "I was losing so much hair due to stress and nothing was working. Dr. Huma recommended PRP and after four sessions my hair fall has reduced dramatically. I can see new baby hairs growing in. The clinic follows up after every session which shows they genuinely care.",
  },
  {
    id: 6,
    name: "Nadia Sheikh",
    location: "DHA Phase 6, Lahore",
    treatment: "Carbon Laser Facial",
    rating: 4,
    quote:
      "The Carbon Laser Facial gave me an instant glow — my pores looked smaller and my skin felt so smooth. I now come monthly for maintenance. The ambiance at Aesthetic Lounge is calming and the hygiene standards are impeccable. It feels like a proper medical clinic, not just a beauty salon.",
  },
];
