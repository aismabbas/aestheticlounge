import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Deletion Request',
  description:
    'Request deletion of your personal data from Aesthetic Lounge, including data collected through Facebook and Instagram.',
  alternates: {
    canonical: 'https://aestheticloungeofficial.com/data-deletion',
  },
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-3xl px-5 pt-32 pb-12 md:pb-20">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-3">
            Data Deletion Request
          </h1>
          <p className="text-[#6B6B6B] text-sm">
            Request the deletion of your personal data from our systems
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8 mb-8">
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            At Aesthetic Lounge, we respect your right to control your personal data. If you have
            interacted with us through our website, Facebook, Instagram, or WhatsApp, you can
            request the deletion of the data we have collected about you. This includes data
            received through Facebook Login, Instagram integrations, and our messaging channels.
          </p>
        </div>

        {/* What data we delete */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8 mb-8">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
            What Data Can Be Deleted
          </h2>
          <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-4">
            <div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Data We Will Delete</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Contact information (name, email, phone number)</li>
                <li>Facebook and Instagram user identifiers</li>
                <li>Conversation and message history from Instagram DMs, Messenger, and comments</li>
                <li>WhatsApp message history</li>
                <li>Website behavior tracking data (page views, clicks, scroll depth)</li>
                <li>Marketing and advertising data (Meta Pixel data, ad interaction history)</li>
                <li>UTM attribution and campaign tracking data</li>
                <li>Cookie and browser identifiers (fbp, fbc, visitor ID)</li>
                <li>Lead form submissions</li>
                <li>Feedback and complaint records</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Data We May Need to Retain</h3>
              <p className="mb-2">
                Certain data may be retained for legal or medical compliance purposes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong className="text-[#1A1A1A]">Medical records:</strong> Retained for 5 years
                  from last treatment as required by medical record-keeping regulations
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Payment records:</strong> Retained for tax and
                  accounting compliance (minimum 6 years)
                </li>
                <li>
                  <strong className="text-[#1A1A1A]">Legal hold data:</strong> Any data subject to
                  ongoing legal proceedings
                </li>
              </ul>
              <p className="mt-2 text-xs text-[#999]">
                We will inform you if any of your data falls under a legal retention requirement
                and cannot be immediately deleted.
              </p>
            </div>
          </div>
        </div>

        {/* How to request */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8 mb-8">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
            How to Request Data Deletion
          </h2>
          <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-4">
            <p>You can request deletion of your data through any of these methods:</p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#EAEAEA]">
                <h3 className="font-semibold text-[#1A1A1A] mb-1">1. Email Request</h3>
                <p>
                  Send an email to{' '}
                  <a
                    href="mailto:info@aestheticloungeofficial.com?subject=Data%20Deletion%20Request"
                    className="text-[#B8924A] hover:underline"
                  >
                    info@aestheticloungeofficial.com
                  </a>{' '}
                  with the subject line &quot;Data Deletion Request&quot; and include:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Your full name</li>
                  <li>Email address associated with your account</li>
                  <li>Phone number (if applicable)</li>
                  <li>Facebook or Instagram username (if applicable)</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#EAEAEA]">
                <h3 className="font-semibold text-[#1A1A1A] mb-1">2. WhatsApp</h3>
                <p>
                  Send a message to{' '}
                  <a
                    href="https://wa.me/923276620000?text=I%20would%20like%20to%20request%20deletion%20of%20my%20data"
                    className="text-[#B8924A] hover:underline"
                  >
                    +92 327 6620000
                  </a>{' '}
                  requesting data deletion.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#EAEAEA]">
                <h3 className="font-semibold text-[#1A1A1A] mb-1">3. In Person</h3>
                <p>
                  Visit our clinic at Plaza-126, BWB Phase 8, DHA Lahore Cantt, Lahore, Pakistan
                  and speak with our front desk staff.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Facebook/Instagram specific */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8 mb-8">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
            Facebook &amp; Instagram Data Deletion
          </h2>
          <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
            <p>
              If you logged into our services using Facebook Login or interacted with us through
              Instagram or Facebook Messenger, you can also manage your data through Meta&apos;s
              platform:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Go to your{' '}
                <strong className="text-[#1A1A1A]">Facebook Settings &amp; Privacy &gt; Settings</strong>
              </li>
              <li>
                Click <strong className="text-[#1A1A1A]">Apps and Websites</strong>
              </li>
              <li>Find and select <strong className="text-[#1A1A1A]">Aesthetic Lounge</strong></li>
              <li>
                Click <strong className="text-[#1A1A1A]">Remove</strong> to revoke access and
                request data deletion
              </li>
            </ol>
            <p className="mt-3">
              When you remove our app from your Facebook settings, Meta will automatically notify
              our systems to delete the data we received about you through their platform. We will
              process this deletion within 30 days and send you a confirmation.
            </p>
            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-800">Confirmation Code</p>
              <p className="text-xs text-blue-600 mt-1">
                After processing your deletion request, we will provide a confirmation code that
                you can use to verify the status of your request. You can check your deletion
                status at any time by visiting this page and contacting us with your confirmation
                code.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8 mb-8">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">
            Deletion Timeline
          </h2>
          <div className="text-sm text-[#6B6B6B] leading-relaxed space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#1A1A1A]">Acknowledgement:</strong> Within 48 hours of
                receiving your request
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Processing:</strong> Within 30 calendar days
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Confirmation:</strong> We will notify you via
                your preferred contact method once deletion is complete
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Third-party propagation:</strong> We will request
                deletion from all third-party services (Google Analytics, Meta) within the same
                timeframe. Third parties may take additional time to fully purge data from their
                backup systems.
              </li>
            </ul>
          </div>
        </div>

        {/* Back links */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <Link
            href="/privacy"
            className="inline-block rounded-md border border-[#EAEAEA] bg-white px-6 py-3 text-sm font-semibold text-[#1A1A1A] transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Privacy Policy
          </Link>
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
