import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Aesthetic Lounge — how we collect, use, and protect your personal data including medical information.',
  alternates: {
    canonical: 'https://aestheticloungeofficial.com/privacy',
  },
};

const cookieTable = [
  {
    name: 'al_session',
    purpose: 'Maintains your session while browsing the site',
    duration: 'Session',
    type: 'Necessary',
  },
  {
    name: 'al_visitor',
    purpose: 'Anonymous visitor identifier for site analytics',
    duration: '1 year',
    type: 'Analytics',
  },
  {
    name: 'al_consent',
    purpose: 'Stores your cookie consent preferences',
    duration: '1 year',
    type: 'Necessary',
  },
  {
    name: 'al_session_id',
    purpose: 'Tracks your current browsing session',
    duration: 'Session',
    type: 'Necessary',
  },
  {
    name: '_ga',
    purpose: 'Google Analytics — distinguishes unique users',
    duration: '2 years',
    type: 'Analytics',
  },
  {
    name: '_ga_*',
    purpose: 'Google Analytics — maintains session state',
    duration: '2 years',
    type: 'Analytics',
  },
  {
    name: '_fbp',
    purpose: 'Meta Pixel — identifies browsers for ad targeting',
    duration: '3 months',
    type: 'Marketing',
  },
  {
    name: '_fbc',
    purpose: 'Meta Pixel — stores click identifiers from ad clicks',
    duration: '3 months',
    type: 'Marketing',
  },
];

const tocItems = [
  { id: 'who-we-are', label: '1. Who We Are' },
  { id: 'data-we-collect', label: '2. Data We Collect' },
  { id: 'how-we-use', label: '3. How We Use Your Data' },
  { id: 'third-party', label: '4. Third-Party Services' },
  { id: 'meta-platform', label: '5. Facebook & Instagram Data' },
  { id: 'data-sharing', label: '6. Data Sharing' },
  { id: 'cookies', label: '7. Cookies & Tracking' },
  { id: 'your-rights', label: '8. Your Rights' },
  { id: 'data-deletion', label: '9. Data Deletion' },
  { id: 'medical-data', label: '10. Medical Data' },
  { id: 'data-retention', label: '11. Data Retention' },
  { id: 'children', label: '12. Children' },
  { id: 'international', label: '13. International Data' },
  { id: 'contact', label: '14. Contact Us' },
  { id: 'changes', label: '15. Policy Changes' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-3xl px-5 pt-32 pb-12 md:pb-20">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-3">
            Privacy Policy
          </h1>
          <p className="text-[#6B6B6B] text-sm">
            Last updated: March 8, 2026
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="bg-white rounded-xl border border-[#EAEAEA] p-6 mb-10">
          <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-4">
            Table of Contents
          </h2>
          <ul className="space-y-2">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm text-[#6B6B6B] hover:text-[#B8924A] transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="prose-container space-y-10">
          {/* Intro */}
          <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Aesthetic Lounge (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy
              and personal data. This Privacy Policy explains how we collect, use, store, and
              protect your information when you visit our website, use our services, or interact
              with us. We comply with Pakistan&apos;s Prevention of Electronic Crimes Act (PECA) 2016,
              the forthcoming Personal Data Protection Bill, Google&apos;s EU User Consent Policy,
              Meta&apos;s data use policies, and international best practices including GDPR principles.
            </p>
          </div>

          {/* 1. Who We Are */}
          <section id="who-we-are" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              1. Who We Are
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                Aesthetic Lounge is a medical aesthetics clinic providing professional cosmetic
                treatments and skincare services.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-[#1A1A1A]">Business Name:</strong> Aesthetic Lounge Official</li>
                <li><strong className="text-[#1A1A1A]">Address:</strong> Plaza-126, BWB Phase 8, DHA Lahore Cantt, Lahore, Pakistan</li>
                <li><strong className="text-[#1A1A1A]">Phone:</strong> +92 327 6620000 | +92 42 35740271</li>
                <li><strong className="text-[#1A1A1A]">Email:</strong> info@aestheticloungeofficial.com</li>
                <li><strong className="text-[#1A1A1A]">Website:</strong> aestheticloungeofficial.com</li>
              </ul>
            </div>
          </section>

          {/* 2. Data We Collect */}
          <section id="data-we-collect" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              2. Data We Collect
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-5">
              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Personal Information</h3>
                <p>Information you provide directly through forms, bookings, or communications:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Full name, phone number, email address</li>
                  <li>Date of birth and gender</li>
                  <li>Appointment and booking details</li>
                  <li>Feedback and complaint submissions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Health and Medical Information</h3>
                <p>
                  When you complete our intake form, we collect sensitive medical data including:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Known allergies and current medications</li>
                  <li>Medical conditions and health history</li>
                  <li>Skin type and concerns</li>
                  <li>Previous aesthetic treatment history</li>
                  <li>Before/after photographs (with explicit consent)</li>
                </ul>
                <p className="mt-2 text-xs text-[#999]">
                  Medical data is classified as sensitive personal data and receives enhanced protection
                  as described in Section 8 below.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Usage Data</h3>
                <p>Automatically collected when you visit our website (with your consent):</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Pages visited and time spent on each page</li>
                  <li>Scroll depth and click interactions</li>
                  <li>Referral source (how you found us)</li>
                  <li>UTM campaign parameters</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Device Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Screen resolution</li>
                  <li>IP address (anonymized for analytics)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. How We Use Your Data */}
          <section id="how-we-use" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              3. How We Use Your Data
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-4">
              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Service Delivery</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide and improve our medical aesthetics services</li>
                  <li>Process appointments, consultations, and payments</li>
                  <li>Maintain accurate medical records for safe treatment</li>
                  <li>Follow up on treatments and aftercare</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Communication</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Send appointment reminders via WhatsApp (with consent)</li>
                  <li>Respond to inquiries and feedback</li>
                  <li>Send marketing communications and promotions (with consent)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Analytics and Improvement</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Analyze website usage patterns to improve user experience</li>
                  <li>Measure effectiveness of marketing campaigns</li>
                  <li>Identify popular treatments and services</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Advertising</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Measure ad performance and conversions (with consent)</li>
                  <li>Create custom and lookalike audiences for targeted advertising (with consent)</li>
                  <li>Remarketing to website visitors (with consent)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Third-Party Services */}
          <section id="third-party" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              4. Third-Party Services &amp; Integrations
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>We use the following third-party services, each with their own privacy policies:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAEAEA]">
                      <th className="py-3 pr-4 font-semibold text-[#1A1A1A]">Service</th>
                      <th className="py-3 pr-4 font-semibold text-[#1A1A1A]">Purpose</th>
                      <th className="py-3 font-semibold text-[#1A1A1A]">Consent Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    <tr>
                      <td className="py-2.5 pr-4">Google Analytics (GA4)</td>
                      <td className="py-2.5 pr-4">Website analytics and user behavior insights</td>
                      <td className="py-2.5">Analytics consent</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Meta Pixel (Facebook/Instagram)</td>
                      <td className="py-2.5 pr-4">Ad performance measurement and audience targeting</td>
                      <td className="py-2.5">Marketing consent</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Meta Conversions API (CAPI)</td>
                      <td className="py-2.5 pr-4">Server-side conversion tracking for ad optimization</td>
                      <td className="py-2.5">Marketing consent</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Instagram Graph API</td>
                      <td className="py-2.5 pr-4">Respond to DMs and comments on our business account</td>
                      <td className="py-2.5">N/A (business messaging)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Facebook Messenger API</td>
                      <td className="py-2.5 pr-4">Respond to messages sent to our Facebook Page</td>
                      <td className="py-2.5">N/A (business messaging)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">WhatsApp Business API</td>
                      <td className="py-2.5 pr-4">Appointment reminders and client communication</td>
                      <td className="py-2.5">Explicit opt-in</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Neon Database</td>
                      <td className="py-2.5 pr-4">Secure data storage (PostgreSQL)</td>
                      <td className="py-2.5">N/A (infrastructure)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Netlify</td>
                      <td className="py-2.5 pr-4">Website hosting and deployment</td>
                      <td className="py-2.5">N/A (infrastructure)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Google Drive</td>
                      <td className="py-2.5 pr-4">Before/after photo storage</td>
                      <td className="py-2.5">Explicit photo consent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. Facebook & Instagram Data */}
          <section id="meta-platform" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              5. Facebook &amp; Instagram Data
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-4">
              <p>
                We use Meta Platform APIs (Facebook and Instagram) to provide customer service
                and communicate with you. This section explains how we handle data received through
                these platforms.
              </p>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Data We Receive from Meta</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Instagram Direct Messages sent to our business account</li>
                  <li>Facebook Messenger conversations with our Page</li>
                  <li>Comments on our Instagram posts and Facebook Page posts</li>
                  <li>Your public profile information (name, profile picture, username)</li>
                  <li>Ad interaction data (click identifiers, conversion events)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">How We Use Meta Data</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Match conversations to existing client records for continuity of care</li>
                  <li>Measure the effectiveness of our advertising campaigns</li>
                  <li>Send appointment confirmations and reminders (with your consent)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Meta Data Restrictions</h3>
                <p>We commit to the following restrictions on Meta Platform data:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>We do <strong className="text-[#1A1A1A]">not</strong> sell Meta Platform data to third parties</li>
                  <li>We do <strong className="text-[#1A1A1A]">not</strong> use Meta data for purposes unrelated to our services</li>
                  <li>We do <strong className="text-[#1A1A1A]">not</strong> share Meta data with data brokers or advertising networks</li>
                  <li>We do <strong className="text-[#1A1A1A]">not</strong> use Meta data for surveillance or unauthorized profiling</li>
                  <li>Message content is stored securely and only accessible to authorized staff</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Meta Conversions API (CAPI)</h3>
                <p>
                  We use Meta&apos;s Conversions API to send conversion events (leads, bookings,
                  payments) server-to-server. This data is sent with hashed identifiers (SHA-256
                  hashed email and phone) and is used solely to measure ad performance and optimize
                  ad delivery. Event deduplication ensures no data is sent twice.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">Your Rights Regarding Meta Data</h3>
                <p>
                  You can request deletion of all data we received through Facebook and Instagram at
                  any time. See{' '}
                  <a href="/data-deletion" className="text-[#B8924A] hover:underline">
                    our Data Deletion page
                  </a>{' '}
                  or remove our app from your{' '}
                  <strong className="text-[#1A1A1A]">Facebook Settings &gt; Apps and Websites</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Data Sharing */}
          <section id="data-sharing" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              6. Data Sharing
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p className="font-semibold text-[#1A1A1A]">
                We do not sell, rent, or trade your personal data to third parties.
              </p>
              <p>We may share your data only in the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-[#1A1A1A]">Service providers:</strong> Third-party services listed above, strictly for the purposes described</li>
                <li><strong className="text-[#1A1A1A]">Legal requirements:</strong> When required by Pakistani law, court order, or government authority under PECA 2016</li>
                <li><strong className="text-[#1A1A1A]">Your consent:</strong> When you have given explicit permission (e.g., sharing before/after photos on social media)</li>
                <li><strong className="text-[#1A1A1A]">Safety:</strong> To protect the rights, property, or safety of Aesthetic Lounge, our clients, or others</li>
              </ul>
            </div>
          </section>

          {/* 7. Cookies */}
          <section id="cookies" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              7. Cookies &amp; Tracking Technologies
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-4">
              <p>
                We use cookies and similar technologies to provide, protect, and improve our services.
                You can manage your cookie preferences at any time using the &quot;Cookie Settings&quot; link
                in the footer of our website.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAEAEA]">
                      <th className="py-3 pr-3 font-semibold text-[#1A1A1A]">Cookie</th>
                      <th className="py-3 pr-3 font-semibold text-[#1A1A1A]">Purpose</th>
                      <th className="py-3 pr-3 font-semibold text-[#1A1A1A]">Duration</th>
                      <th className="py-3 font-semibold text-[#1A1A1A]">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {cookieTable.map((c) => (
                      <tr key={c.name}>
                        <td className="py-2.5 pr-3 font-mono text-[11px]">{c.name}</td>
                        <td className="py-2.5 pr-3">{c.purpose}</td>
                        <td className="py-2.5 pr-3">{c.duration}</td>
                        <td className="py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              c.type === 'Necessary'
                                ? 'bg-green-50 text-green-700'
                                : c.type === 'Analytics'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {c.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p>
                <strong className="text-[#1A1A1A]">Google Consent Mode:</strong> We implement Google&apos;s
                Consent Mode v2 which ensures that Google Analytics and Google Ads respect your consent
                choices. When analytics or advertising cookies are denied, Google&apos;s tags adjust their
                behavior accordingly, using cookieless pings that do not store identifying information.
              </p>

              <p>
                <strong className="text-[#1A1A1A]">Meta Limited Data Use:</strong> When you have not
                consented to marketing cookies, the Meta Pixel is not loaded at all. No tracking script
                is injected, no data is sent to Meta, and no Meta cookies are set on your device.
              </p>
            </div>
          </section>

          {/* 8. Your Rights */}
          <section id="your-rights" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              8. Your Rights
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                Under Pakistan&apos;s PECA 2016, the forthcoming Personal Data Protection Bill, and
                international privacy best practices, you have the following rights:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#1A1A1A]">Right of Access:</strong> Request a copy of the
                  personal data we hold about you.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Right to Rectification:</strong> Request correction
                  of inaccurate or incomplete personal data.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Right to Erasure:</strong> Request deletion of your
                  personal data, subject to legal retention requirements.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Right to Withdraw Consent:</strong> Withdraw consent
                  for any processing based on consent at any time, without affecting the lawfulness of
                  processing before withdrawal.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Right to Data Portability:</strong> Request your data
                  in a structured, commonly used, machine-readable format.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Right to Object:</strong> Object to processing of your
                  data for direct marketing purposes.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Right to Complain:</strong> Lodge a complaint with the
                  Pakistan Telecommunication Authority (PTA) or any relevant data protection authority.
                </li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at{' '}
                <a
                  href="mailto:info@aestheticloungeofficial.com"
                  className="text-[#B8924A] hover:underline"
                >
                  info@aestheticloungeofficial.com
                </a>{' '}
                or call +92 327 6620000. We will respond within 30 days.
              </p>
            </div>
          </section>

          {/* 9. Data Deletion */}
          <section id="data-deletion" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              9. Data Deletion
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                You have the right to request deletion of your personal data at any time. We provide
                multiple ways to submit a deletion request:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Visit our{' '}
                  <a href="/data-deletion" className="text-[#B8924A] hover:underline">
                    Data Deletion Request page
                  </a>
                </li>
                <li>
                  Email{' '}
                  <a href="mailto:info@aestheticloungeofficial.com?subject=Data%20Deletion%20Request" className="text-[#B8924A] hover:underline">
                    info@aestheticloungeofficial.com
                  </a>{' '}
                  with the subject &quot;Data Deletion Request&quot;
                </li>
                <li>Remove our app from your Facebook Settings &gt; Apps and Websites</li>
              </ul>
              <p>
                Upon receiving your request, we will delete your data within 30 calendar days and
                provide a confirmation code you can use to verify the deletion status. Certain data
                may be retained if required by law (see Section 11: Data Retention).
              </p>
              <p>
                For full details on what data is deleted and our deletion timeline, please visit our{' '}
                <a href="/data-deletion" className="text-[#B8924A] hover:underline">
                  Data Deletion page
                </a>.
              </p>
            </div>
          </section>

          {/* 10. Medical Data */}
          <section id="medical-data" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              10. Medical Data
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                Health and medical information collected through our intake forms receives enhanced
                protection:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#1A1A1A]">Encryption:</strong> All medical data is encrypted
                  at rest and in transit using industry-standard encryption (TLS 1.3, AES-256).
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Access Control:</strong> Only authorized medical
                  professionals (treating doctors and clinical staff) can access your medical records.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Retention:</strong> Medical records are retained for
                  a minimum of 5 years from the date of last treatment, as required by medical record-keeping
                  regulations. After the retention period, records are securely deleted.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Photo Consent:</strong> Before/after photographs are
                  taken only with your explicit written consent. You can withdraw photo consent at any time.
                  Photos used for marketing require separate consent.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">No Marketing Use:</strong> Medical data is never used
                  for marketing purposes, ad targeting, or shared with advertisers.
                </li>
              </ul>
            </div>
          </section>

          {/* 11. Data Retention */}
          <section id="data-retention" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              11. Data Retention
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAEAEA]">
                      <th className="py-3 pr-4 font-semibold text-[#1A1A1A]">Data Type</th>
                      <th className="py-3 pr-4 font-semibold text-[#1A1A1A]">Retention Period</th>
                      <th className="py-3 font-semibold text-[#1A1A1A]">Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    <tr>
                      <td className="py-2.5 pr-4">Medical records</td>
                      <td className="py-2.5 pr-4">5 years from last treatment</td>
                      <td className="py-2.5">Legal/medical obligation</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Appointment records</td>
                      <td className="py-2.5 pr-4">3 years</td>
                      <td className="py-2.5">Legitimate interest</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Contact information</td>
                      <td className="py-2.5 pr-4">Until deletion requested or 3 years of inactivity</td>
                      <td className="py-2.5">Consent / legitimate interest</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Analytics data</td>
                      <td className="py-2.5 pr-4">26 months (Google Analytics default)</td>
                      <td className="py-2.5">Consent</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Marketing data</td>
                      <td className="py-2.5 pr-4">Until consent withdrawn or 2 years</td>
                      <td className="py-2.5">Consent</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Feedback/complaints</td>
                      <td className="py-2.5 pr-4">2 years</td>
                      <td className="py-2.5">Legitimate interest</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4">Before/after photos</td>
                      <td className="py-2.5 pr-4">Until consent withdrawn or 5 years</td>
                      <td className="py-2.5">Explicit consent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 12. Children */}
          <section id="children" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              12. Children
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed">
              <p>
                Our services are not intended for individuals under the age of 18. We do not
                knowingly collect personal data from minors. Aesthetic treatments for individuals
                under 18 require the presence and consent of a parent or legal guardian, who must
                complete all forms on behalf of the minor.
              </p>
            </div>
          </section>

          {/* 13. International */}
          <section id="international" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              13. International Data Transfers
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                While our clinic is based in Pakistan, some of our service providers (Google, Meta,
                Netlify, Neon) process data in other jurisdictions, including the United States and
                European Union. When your data is transferred internationally, we ensure that:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Service providers maintain adequate data protection standards</li>
                <li>Data transfers comply with applicable privacy frameworks</li>
                <li>Appropriate safeguards are in place (e.g., Standard Contractual Clauses for EU data)</li>
              </ul>
            </div>
          </section>

          {/* 14. Contact */}
          <section id="contact" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              14. Contact Us
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>For any privacy-related inquiries, data requests, or complaints:</p>
              <ul className="list-none space-y-2">
                <li>
                  <strong className="text-[#1A1A1A]">Email:</strong>{' '}
                  <a href="mailto:info@aestheticloungeofficial.com" className="text-[#B8924A] hover:underline">
                    info@aestheticloungeofficial.com
                  </a>
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Phone:</strong> +92 327 6620000
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Address:</strong> Plaza-126, BWB Phase 8, DHA Lahore Cantt, Lahore, Pakistan
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">WhatsApp:</strong>{' '}
                  <a href="https://wa.me/923276620000" className="text-[#B8924A] hover:underline">
                    +92 327 6620000
                  </a>
                </li>
              </ul>
              <p>
                We aim to respond to all data-related requests within 30 calendar days. For complex
                requests, we may extend this to 60 days with notice.
              </p>
            </div>
          </section>

          {/* 15. Changes */}
          <section id="changes" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              15. Policy Changes
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                legal requirements, or services. When we make material changes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We will update the &quot;Last updated&quot; date at the top of this page</li>
                <li>For significant changes, we will display a notice on our website</li>
                <li>If the changes affect how we process your medical data, we will seek your renewed consent</li>
              </ul>
              <p>
                We encourage you to review this policy periodically to stay informed about how we
                protect your data.
              </p>
            </div>
          </section>
        </div>

        {/* Back link */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-block rounded-md bg-[#B8924A] px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
