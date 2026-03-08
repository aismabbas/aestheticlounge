export interface Doctor {
  slug: string;
  name: string;
  title: string;
  specialization: string;
  bio: string;
  education: string[];
  social: { instagram?: string; linkedin?: string };
}

export const doctors: Doctor[] = [
  {
    slug: "dr-huma",
    name: "Dr. Huma",
    title: "Medical Director & Aesthetic Physician",
    specialization:
      "Aesthetic Medicine, Injectables, Skin Rejuvenation, Thread Lifts, IV Therapy",
    bio: "Dr. Huma is the Medical Director of Aesthetic Lounge, bringing extensive experience in aesthetic medicine and non-surgical facial rejuvenation. With advanced training in injectables, thread lifting, and energy-based devices, she leads the clinic's medical team with precision and an artist's eye for facial harmony. Dr. Huma is passionate about delivering natural-looking results that enhance each patient's unique features while maintaining the highest safety standards. She oversees all non-surgical treatments, from Botox and dermal fillers to HIFU, skin boosters, and IV drip therapy.",
    education: [
      "MBBS — Lahore",
      "Advanced Injectable Techniques Certification",
      "Thread Lift Training — International Certification",
      "Aesthetic Medicine Fellowship",
    ],
    social: {
      instagram: "https://instagram.com/aestheticloungeofficial",
    },
  },
  {
    slug: "dr-zulfiqar",
    name: "Dr. Zulfiqar",
    title: "Plastic Surgeon",
    specialization:
      "Rhinoplasty, Liposuction, Breast Surgery, Facelift, BBL, Blepharoplasty, Brow Lift",
    bio: "Dr. Zulfiqar is the Plastic Surgeon at Aesthetic Lounge, specializing in surgical body contouring, facial surgery, and reconstructive procedures. With board certification in plastic surgery and years of experience performing rhinoplasties, facelifts, breast augmentations, and liposuction, he brings surgical precision and a deep understanding of anatomy to every procedure. Dr. Zulfiqar works closely with each patient to develop a surgical plan tailored to their goals, ensuring natural, proportionate results with the highest safety protocols.",
    education: [
      "MBBS — Pakistan",
      "FCPS Plastic Surgery — College of Physicians and Surgeons Pakistan",
      "Fellowship in Aesthetic & Reconstructive Surgery",
    ],
    social: {
      instagram: "https://instagram.com/aestheticloungeofficial",
    },
  },
  {
    slug: "dr-zonera",
    name: "Dr. Zonera",
    title: "Dermatologist",
    specialization:
      "Dermatology, Laser Treatments, Skin Lesion Removal, Acne & Pigmentation Management, Chemical Peels",
    bio: "Dr. Zonera is the Dermatologist at Aesthetic Lounge, specializing in medical and cosmetic dermatology with particular expertise in laser-based treatments and skin lesion management. She brings a thorough, evidence-based approach to treating acne, hyperpigmentation, skin lesions, and scarring. Dr. Zonera is also the clinic's laser specialist, overseeing all laser hair removal, IPL, tattoo removal, and fractional resurfacing treatments, with protocols optimized for South Asian skin tones to ensure safe, effective results.",
    education: [
      "MBBS — Pakistan",
      "FCPS Dermatology — College of Physicians and Surgeons Pakistan",
      "Advanced Laser Safety & Protocols Certification",
    ],
    social: {
      instagram: "https://instagram.com/aestheticloungeofficial",
    },
  },
];

export function getDoctorBySlug(slug: string): Doctor | undefined {
  return doctors.find((d) => d.slug === slug);
}
