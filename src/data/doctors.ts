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
    slug: "dr-huma-abbas",
    name: "Dr. Huma Abbas",
    title: "Medical Director & Lead Dermatologist",
    specialization: "Dermatology, Injectables, Skin Rejuvenation, Thread Lifts",
    bio: "Dr. Huma Abbas is the founder and Medical Director of Aesthetic Lounge, bringing over 15 years of experience in clinical and cosmetic dermatology. Trained internationally with certifications in advanced injectable techniques and thread lifting, she leads every complex procedure with precision and an artist's eye. Dr. Huma is passionate about delivering natural-looking results that enhance each patient's unique features while maintaining the highest safety standards.",
    education: [
      "MBBS — King Edward Medical University, Lahore",
      "FCPS Dermatology — College of Physicians and Surgeons Pakistan",
      "Advanced Injectable Masterclass — London, UK",
      "Thread Lift Certification — Seoul, South Korea",
    ],
    social: {
      instagram: "https://instagram.com/aestheticloungeofficial",
      linkedin: "https://linkedin.com/in/dr-huma-abbas",
    },
  },
  {
    slug: "dr-sarah-khan",
    name: "Dr. Sarah Khan",
    title: "Aesthetic Surgeon",
    specialization:
      "Body Contouring, Laser Treatments, Non-Surgical Procedures",
    bio: "Dr. Sarah Khan specializes in non-invasive body contouring and laser-based treatments, combining surgical precision with a minimally invasive approach. With a background in plastic surgery and advanced training in laser technology, she helps patients achieve their body goals without the downtime of traditional surgery. Her expertise in skin-type-specific laser protocols ensures safe, effective results for South Asian skin tones.",
    education: [
      "MBBS — Allama Iqbal Medical College, Lahore",
      "FCPS Surgery — College of Physicians and Surgeons Pakistan",
      "Fellowship in Aesthetic Medicine — Dubai",
      "Laser Safety & Advanced Protocols — American Board of Laser Surgery",
    ],
    social: {
      instagram: "https://instagram.com/aestheticloungeofficial",
    },
  },
  {
    slug: "dr-ahmed-raza",
    name: "Dr. Ahmed Raza",
    title: "Cosmetic Dentist",
    specialization:
      "Dental Veneers, Smile Design, Teeth Whitening, Dental Aesthetics",
    bio: "Dr. Ahmed Raza is a cosmetic dentist with a decade of experience transforming smiles through veneers, bonding, whitening, and complete smile makeovers. He utilizes digital smile design technology to plan and preview results before any treatment begins, ensuring patients know exactly what to expect. His meticulous attention to detail and understanding of facial aesthetics make him a trusted partner for anyone seeking their perfect smile.",
    education: [
      "BDS — de'Montmorency College of Dentistry, Lahore",
      "MSc Aesthetic Dentistry — University of Manchester, UK",
      "Digital Smile Design Certification — DSD Residency Program",
      "Advanced Veneer & Bonding Workshop — Istanbul, Turkey",
    ],
    social: {
      instagram: "https://instagram.com/aestheticloungeofficial",
      linkedin: "https://linkedin.com/in/dr-ahmed-raza-dds",
    },
  },
];

export function getDoctorBySlug(slug: string): Doctor | undefined {
  return doctors.find((d) => d.slug === slug);
}
