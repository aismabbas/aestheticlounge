import type { Treatment } from '@/data/services';

const BASE_URL = 'https://aestheticloungeofficial.com';

const BUSINESS_INFO = {
  name: 'Aesthetic Lounge',
  alternateName: 'Aesthetic Lounge Official',
  url: BASE_URL,
  logo: 'https://aestheticloungeofficial.com/logo.png',
  image: 'https://aestheticloungeofficial.com/logo.png',
  description:
    'Premium medical aesthetics clinic offering 66+ treatments at Plaza-126, BWB Phase 8, DHA Lahore Cantt. Expert doctors delivering personalized care with advanced solutions.',
  telephone: '+92-327-6660004',
  email: 'info@aestheticloungeofficial.com',
  address: {
    '@type': 'PostalAddress' as const,
    streetAddress: 'Plaza-126, BWB Phase 8',
    addressLocality: 'DHA Lahore Cantt',
    addressRegion: 'Punjab',
    addressCountry: 'PK',
  },
  geo: {
    '@type': 'GeoCoordinates' as const,
    latitude: 31.4697,
    longitude: 74.3762,
  },
  openingHours: [
    {
      '@type': 'OpeningHoursSpecification' as const,
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '21:00',
    },
  ],
  sameAs: [
    'https://instagram.com/aestheticloungeofficial/',
    'https://facebook.com/people/Aestheticloungeofficial/61567387603705/',
    'https://youtube.com/@aestheticloungeofficial',
  ],
};

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: BUSINESS_INFO.name,
    alternateName: BUSINESS_INFO.alternateName,
    url: BUSINESS_INFO.url,
    logo: BUSINESS_INFO.logo,
    image: BUSINESS_INFO.image,
    description: BUSINESS_INFO.description,
    telephone: BUSINESS_INFO.telephone,
    email: BUSINESS_INFO.email,
    address: BUSINESS_INFO.address,
    geo: BUSINESS_INFO.geo,
    openingHoursSpecification: BUSINESS_INFO.openingHours,
    priceRange: '$$',
    sameAs: BUSINESS_INFO.sameAs,
  };
}

export function generateMedicalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: BUSINESS_INFO.name,
    alternateName: BUSINESS_INFO.alternateName,
    url: BUSINESS_INFO.url,
    logo: BUSINESS_INFO.logo,
    image: BUSINESS_INFO.image,
    description: BUSINESS_INFO.description,
    telephone: BUSINESS_INFO.telephone,
    email: BUSINESS_INFO.email,
    address: BUSINESS_INFO.address,
    geo: BUSINESS_INFO.geo,
    openingHoursSpecification: BUSINESS_INFO.openingHours,
    medicalSpecialty: 'Dermatology',
    priceRange: '$$',
    sameAs: BUSINESS_INFO.sameAs,
    founder: {
      '@type': 'Person',
      name: 'Dr. Huma',
      jobTitle: 'Aesthetic Physician',
    },
  };
}

export function generateServiceSchema(treatment: Treatment) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: treatment.name,
    description: treatment.description,
    url: `${BASE_URL}/services/${treatment.slug}`,
    procedureType: 'https://health-lifesci.schema.org/CosmeticProcedure',
    bodyLocation: treatment.bestFor,
    howPerformed: treatment.shortDesc,
    category: treatment.category,
    provider: {
      '@type': 'MedicalBusiness',
      name: BUSINESS_INFO.name,
      url: BUSINESS_INFO.url,
      telephone: BUSINESS_INFO.telephone,
      address: BUSINESS_INFO.address,
    },
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateArticleSchema(post: {
  title: string;
  excerpt: string;
  author: string;
  published_at?: string;
  slug: string;
  featured_image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS_INFO.name,
      logo: {
        '@type': 'ImageObject',
        url: BUSINESS_INFO.logo,
      },
    },
    datePublished: post.published_at,
    image: post.featured_image || BUSINESS_INFO.image,
    url: `${BASE_URL}/blog/${post.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
  };
}
