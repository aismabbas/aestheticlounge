import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for Aesthetic Lounge — conditions governing the use of our website and medical aesthetics services.',
  alternates: {
    canonical: 'https://aestheticloungeofficial.com/terms',
  },
};

const tocItems = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'services', label: '2. Services Description' },
  { id: 'eligibility', label: '3. Eligibility' },
  { id: 'accounts', label: '4. Account & Dashboard Access' },
  { id: 'booking', label: '5. Booking & Cancellation' },
  { id: 'payment', label: '6. Payment Terms' },
  { id: 'medical', label: '7. Medical Disclaimer' },
  { id: 'photos', label: '8. Photo Consent' },
  { id: 'whatsapp', label: '9. WhatsApp Communication' },
  { id: 'ip', label: '10. Intellectual Property' },
  { id: 'liability', label: '11. Limitation of Liability' },
  { id: 'indemnification', label: '12. Indemnification' },
  { id: 'governing-law', label: '13. Governing Law' },
  { id: 'disputes', label: '14. Dispute Resolution' },
  { id: 'termination', label: '15. Termination' },
  { id: 'changes', label: '16. Changes to Terms' },
  { id: 'contact', label: '17. Contact Information' },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-white border-b border-[#EAEAEA]">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-lg font-bold text-white"
              style={{
                background:
                  'linear-gradient(135deg, #D4B876 0%, #B8924A 40%, #96742F 70%, #D4B876 100%)',
              }}
            >
              A
            </div>
            <div className="font-serif text-xl font-semibold tracking-tight">
              Aesthetic <span className="text-[#B8924A]">Lounge</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-[#6B6B6B] hover:text-[#B8924A] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-3">
            Terms of Service
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
          <ul className="columns-1 sm:columns-2 space-y-2">
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
        <div className="space-y-10">
          {/* Intro */}
          <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the website,
              services, and treatments provided by Aesthetic Lounge (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;),
              located at Plaza-126, BWB Phase 8, DHA Lahore Cantt, Lahore, Pakistan. By accessing
              our website or using our services, you agree to be bound by these Terms. If you do
              not agree, please do not use our website or services.
            </p>
          </div>

          {/* 1. Acceptance */}
          <section id="acceptance" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              1. Acceptance of Terms
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                By accessing or using our website (aestheticloungeofficial.com), booking an
                appointment, completing an intake form, or receiving any treatment, you acknowledge
                that you have read, understood, and agree to be bound by these Terms, along with
                our{' '}
                <Link href="/privacy" className="text-[#B8924A] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and Aesthetic Lounge.
                We reserve the right to update these Terms at any time, and your continued use of
                our services constitutes acceptance of any changes.
              </p>
            </div>
          </section>

          {/* 2. Services */}
          <section id="services" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              2. Services Description
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                Aesthetic Lounge provides medical aesthetics consultations, treatments, and related
                services including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Facial treatments (HydraFacial, chemical peels, microneedling, facials)</li>
                <li>Injectable treatments (Botox, dermal fillers, lip enhancement, PRP)</li>
                <li>Laser treatments (hair removal, IPL, fractional CO2, carbon peel)</li>
                <li>Body contouring (CoolSculpting, RF, cavitation)</li>
                <li>Hair restoration (PRP, mesotherapy, transplant)</li>
                <li>IV drip therapy and vitamin injections</li>
                <li>Dental aesthetics (teeth whitening, veneers)</li>
              </ul>
              <p>
                All treatments are performed by qualified medical professionals under proper
                clinical supervision. Treatment availability may vary and is subject to medical
                assessment.
              </p>
            </div>
          </section>

          {/* 3. Eligibility */}
          <section id="eligibility" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              3. Eligibility
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                You must be at least 18 years old to use our services independently. Individuals
                under 18 may receive treatments only with the presence and written consent of a
                parent or legal guardian, and only for treatments deemed appropriate by our medical
                team.
              </p>
              <p>
                Certain treatments may have additional eligibility requirements based on medical
                history, skin type, or health conditions. Our doctors reserve the right to decline
                or postpone treatment if they determine it is not medically appropriate.
              </p>
            </div>
          </section>

          {/* 4. Accounts */}
          <section id="accounts" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              4. Account &amp; Dashboard Access
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                When you complete an intake form or book through our website, you may be provided
                access to a client dashboard via a secure link. You are responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Keeping your access links and credentials confidential</li>
                <li>Notifying us immediately if you suspect unauthorized access</li>
                <li>Providing accurate and up-to-date information</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate dashboard access at our discretion,
                particularly in cases of misuse or security concerns.
              </p>
            </div>
          </section>

          {/* 5. Booking */}
          <section id="booking" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              5. Booking &amp; Cancellation Policy
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#1A1A1A]">Booking:</strong> Appointments can be booked via
                  our website, WhatsApp, or phone. All bookings are subject to availability and
                  confirmation.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Cancellation:</strong> Please provide at least 24
                  hours&apos; notice for cancellations. Late cancellations or no-shows may result in a
                  cancellation fee or forfeiture of any advance payment.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Rescheduling:</strong> Appointments may be
                  rescheduled with at least 24 hours&apos; notice, subject to availability.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Late Arrival:</strong> Arriving more than 15
                  minutes late may result in a shortened appointment or rescheduling at our
                  discretion.
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Payment */}
          <section id="payment" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              6. Payment Terms
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li>All prices are listed in Pakistani Rupees (PKR) unless otherwise stated.</li>
                <li>Payment is due at the time of service unless otherwise agreed in writing.</li>
                <li>We accept cash, bank transfer, and major credit/debit cards.</li>
                <li>Package deals and promotions may have separate payment terms as specified at the time of purchase.</li>
                <li>Prices are subject to change without prior notice. Prices quoted at the time of booking are honored for that appointment.</li>
                <li>Refunds are evaluated on a case-by-case basis. Treatments already performed are non-refundable.</li>
              </ul>
            </div>
          </section>

          {/* 7. Medical Disclaimer */}
          <section id="medical" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              7. Medical Disclaimer
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p className="font-semibold text-[#1A1A1A]">
                Important: Please read this section carefully.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Our services are medical aesthetics treatments, not substitutes for medical advice,
                  diagnosis, or treatment by a primary healthcare provider.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Results vary.</strong> Individual results from
                  aesthetic treatments depend on multiple factors including skin type, age, health
                  conditions, lifestyle, and adherence to aftercare instructions. We do not guarantee
                  specific outcomes.
                </li>
                <li>
                  All treatments carry inherent risks and potential side effects. These will be discussed
                  during your consultation, and you will be asked to provide informed consent before
                  any procedure.
                </li>
                <li>
                  You are responsible for disclosing all relevant medical information, including
                  allergies, medications, medical conditions, and previous treatments. Failure to
                  disclose may affect treatment safety and outcomes.
                </li>
                <li>
                  Before/after images on our website and social media are for illustrative purposes
                  and represent individual results that may not be typical.
                </li>
                <li>
                  Content on our website (blog, treatment descriptions, FAQs) is for informational
                  purposes only and should not be considered medical advice.
                </li>
              </ul>
            </div>
          </section>

          {/* 8. Photo Consent */}
          <section id="photos" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              8. Photo Consent
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#1A1A1A]">Treatment Records:</strong> We may request your
                  consent to take before/after photographs for your treatment records. This is optional
                  and can be declined without affecting your treatment.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Marketing Use:</strong> Separate consent is required
                  if we wish to use your photos for marketing, social media, or our website. Your identity
                  can be kept anonymous if preferred.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Withdrawal:</strong> You may withdraw photo consent
                  at any time by contacting us. We will remove photos from marketing materials within
                  a reasonable timeframe (up to 30 days for digital content).
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Storage:</strong> Photos are stored securely on
                  encrypted cloud storage with access restricted to authorized clinical staff.
                </li>
              </ul>
            </div>
          </section>

          {/* 9. WhatsApp */}
          <section id="whatsapp" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              9. WhatsApp Communication
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>By opting in to WhatsApp communications (via our intake form or other means), you consent to receive:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Appointment confirmations and reminders</li>
                <li>Treatment aftercare instructions</li>
                <li>Follow-up messages from your treating doctor</li>
                <li>Promotional messages about services and offers (only if marketing consent is given)</li>
              </ul>
              <p>
                You can opt out of WhatsApp communications at any time by replying &quot;STOP&quot; or
                contacting us directly. Opting out of reminders does not affect your appointments.
              </p>
            </div>
          </section>

          {/* 10. IP */}
          <section id="ip" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              10. Intellectual Property
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                All content on our website, including text, images, graphics, logos, videos, and
                design elements, is the property of Aesthetic Lounge or its licensors and is
                protected by copyright, trademark, and other intellectual property laws of Pakistan.
              </p>
              <p>You may not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Copy, reproduce, or distribute our content without written permission</li>
                <li>Use our branding, logos, or trademarks without authorization</li>
                <li>Modify, create derivative works from, or reverse-engineer any part of our website</li>
                <li>Use our content for commercial purposes without a licensing agreement</li>
              </ul>
            </div>
          </section>

          {/* 11. Liability */}
          <section id="liability" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              11. Limitation of Liability
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>To the fullest extent permitted by Pakistani law:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Aesthetic Lounge, its doctors, staff, and affiliates shall not be liable for any
                  indirect, incidental, special, consequential, or punitive damages arising from your
                  use of our services or website.
                </li>
                <li>
                  Our total liability for any claim arising from our services shall not exceed the
                  amount you paid for the specific treatment giving rise to the claim.
                </li>
                <li>
                  We are not liable for treatment outcomes that are within the normal range of expected
                  results, or for complications arising from undisclosed medical conditions or failure
                  to follow aftercare instructions.
                </li>
                <li>
                  Our website is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
                  uninterrupted or error-free operation of the website.
                </li>
              </ul>
            </div>
          </section>

          {/* 12. Indemnification */}
          <section id="indemnification" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              12. Indemnification
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed">
              <p>
                You agree to indemnify and hold harmless Aesthetic Lounge, its owners, doctors,
                employees, and agents from any claims, damages, losses, liabilities, and expenses
                (including legal fees) arising from your use of our services, violation of these
                Terms, or infringement of any third-party rights.
              </p>
            </div>
          </section>

          {/* 13. Governing Law */}
          <section id="governing-law" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              13. Governing Law
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed">
              <p>
                These Terms are governed by and construed in accordance with the laws of the
                Islamic Republic of Pakistan, including the Contract Act 1872, the Prevention of
                Electronic Crimes Act (PECA) 2016, the Electronic Transactions Ordinance 2002,
                and any applicable data protection legislation. Any matters not covered by these
                specific laws shall be governed by the general principles of Pakistani civil law.
              </p>
            </div>
          </section>

          {/* 14. Disputes */}
          <section id="disputes" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              14. Dispute Resolution
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>In the event of a dispute:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong className="text-[#1A1A1A]">Direct Resolution:</strong> We encourage you to
                  contact us first to resolve any concerns directly. You may reach us via email,
                  phone, or our{' '}
                  <Link href="/feedback/complaint" className="text-[#B8924A] hover:underline">
                    complaint form
                  </Link>
                  .
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Mediation:</strong> If direct resolution is not
                  possible, both parties agree to attempt mediation before pursuing litigation.
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Jurisdiction:</strong> Any legal proceedings shall
                  be brought exclusively in the courts of Lahore, Punjab, Pakistan.
                </li>
              </ol>
            </div>
          </section>

          {/* 15. Termination */}
          <section id="termination" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              15. Termination
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>
                We reserve the right to refuse service, terminate access, or cancel appointments at
                our discretion, including but not limited to cases of:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Abusive or threatening behavior toward staff</li>
                <li>Providing false or misleading medical information</li>
                <li>Violation of these Terms</li>
                <li>Non-payment for services rendered</li>
              </ul>
            </div>
          </section>

          {/* 16. Changes */}
          <section id="changes" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              16. Changes to Terms
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed">
              <p>
                We may revise these Terms at any time by updating this page. The &quot;Last updated&quot; date
                at the top indicates when the most recent changes were made. Material changes will be
                highlighted on our website. Your continued use of our services after changes are
                posted constitutes your acceptance of the revised Terms.
              </p>
            </div>
          </section>

          {/* 17. Contact */}
          <section id="contact" className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
              17. Contact Information
            </h2>
            <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
              <p>For questions about these Terms, please contact us:</p>
              <ul className="list-none space-y-2">
                <li>
                  <strong className="text-[#1A1A1A]">Email:</strong>{' '}
                  <a href="mailto:info@aestheticloungeofficial.com" className="text-[#B8924A] hover:underline">
                    info@aestheticloungeofficial.com
                  </a>
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Phone:</strong> +92 327 6620000 | +92 42 35740271
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Address:</strong> Plaza-126, BWB Phase 8, DHA Lahore Cantt, Lahore, Pakistan
                </li>
              </ul>
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
