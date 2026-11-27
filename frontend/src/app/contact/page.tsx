import type { Metadata } from 'next';
import LegalPage, { H2 } from '@/components/legal/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact | RateYourCV',
  description: 'How to reach RateYourCV for support, feedback, privacy requests such as deleting your data, and business enquiries.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact us"
      updated={false}
      intro="We read every message. The quickest way to reach us is by email."
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</div>
        {SITE.contactEmail ? (
          <a href={`mailto:${SITE.contactEmail}`} className="mt-1 block text-lg font-extrabold text-indigo-700 hover:underline">
            {SITE.contactEmail}
          </a>
        ) : (
          <p className="mt-1 font-semibold text-slate-800">Our contact address is being set up. Please check back soon.</p>
        )}
      </div>

      <H2>What to include</H2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>A bug or a problem: what you did, what you expected, what happened, and the browser or device you used</li>
        <li>An account or privacy request (for example deleting your data): the email address on your account and what you would like us to do</li>
        <li>Feedback or a feature idea: tell us what you were trying to do</li>
      </ul>

      <H2>Please do not send</H2>
      <p>
        Passwords, national ID numbers or other sensitive documents. We will never ask for your password.
      </p>

      <H2>Replies</H2>
      <p>We aim to reply within a few working days. For data requests, we will confirm once the request is done.</p>

      <p>
        See also our <a href="/privacy" className="text-indigo-700 font-semibold hover:underline">Privacy Policy</a> and{' '}
        <a href="/terms" className="text-indigo-700 font-semibold hover:underline">Terms of Service</a>.
      </p>
    </LegalPage>
  );
}
