import type { Metadata } from 'next';
import LegalPage, { H2, Contact } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | RateYourCV',
  description:
    'What RateYourCV collects, how resumes you upload or type are handled, which cookies we use, and how to ask us to delete your data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what information RateYourCV collects when you use the website, what we do with it, and the choices you have. We have tried to write it in plain language and to describe only what the service actually does."
    >
      <H2>1. Information we collect</H2>
      <p>
        <strong>Account details.</strong> If you create an account, we store your username, email address, optional full name and a
        password. Passwords are stored as a salted hash (PBKDF2-SHA256), not in readable form.
      </p>
      <p>
        <strong>Resume and job content.</strong> This is anything you upload, paste or type into the ATS Scanner and the resume
        builder: resume files (PDF, DOCX, or text), job descriptions, and the text, skills and optional profile photo you add to a resume.
      </p>
      <p>
        <strong>Usage information.</strong> We use Google Analytics to understand how the site is used: pages visited, device and
        browser type, approximate location, and how visitors arrived. We have turned off Google&apos;s advertising features for our
        Analytics.
      </p>
      <p>
        <strong>Technical information.</strong> Our servers handle your IP address and request details, for example to limit abuse such
        as repeated sign-up or login attempts and to keep the service secure.
      </p>

      <H2>2. How we handle your resume</H2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          When you scan a resume or import one into the builder, the file is sent to our server so its text can be read and analysed.
          The uploaded file is processed from a temporary location and removed once the text has been extracted.
        </li>
        <li>
          Resumes you edit in the builder, saved versions and your chosen photo are kept in your own browser&apos;s local storage on
          your device. We do not receive them until you ask for a download, when the content is sent to our server to produce the PDF or
          Word file.
        </li>
        <li>
          If you use the job-matching features and upload a resume to your account, that file is stored on our servers under your account.
        </li>
        <li>
          At the time of writing, the resume analysis, keyword matching and builder tools run on our own servers, and we do not send the
          content of your resume to third-party AI services. If that changes, we will update this policy first.
        </li>
      </ul>

      <H2>3. How we use information</H2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>To provide the scanner, builder, templates and downloads you ask for</li>
        <li>To create and secure your account, and to send service messages such as job alerts you switch on</li>
        <li>To understand which pages and features are used so we can improve them</li>
        <li>To prevent abuse and keep the service running reliably</li>
      </ul>
      <p>We do not sell your personal information, and we do not use your resume content to advertise to you.</p>

      <H2>4. Cookies and local storage</H2>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>Sign-in cookies.</strong> A session cookie keeps you signed in. A longer-lived account cookie, signed so it cannot be
          altered, lets us restore your account if our servers restart. Both are marked HTTP-only so scripts in the page cannot read them.
        </li>
        <li>
          <strong>Analytics cookies.</strong> Google Analytics sets cookies to count visits and see how pages are used.
        </li>
        <li>
          <strong>Local storage.</strong> Your browser stores your resume drafts, chosen template, colours, font and photo so your work is
          there when you return. You can remove them by clearing site data in your browser.
        </li>
      </ul>

      <H2>5. Who we share information with</H2>
      <p>We use a small number of service providers to run the site:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Vercel, which hosts the website and our server code</li>
        <li>Google, for Google Analytics</li>
      </ul>
      <p>
        These providers process information on our behalf under their own terms. We may also disclose information if the law requires it
        or to protect the safety and rights of our users and the service.
      </p>

      <H2>6. How long we keep information</H2>
      <p>
        We keep account details for as long as your account exists. Temporary files used to read a scanned resume are removed after
        processing. Content stored in your browser stays there until you clear it. To have your account and the data we hold about you
        deleted, ask us (see section 9) and we will do so.
      </p>

      <H2>7. Security</H2>
      <p>
        The website is served over HTTPS, passwords are stored as salted hashes, and sign-in cookies are protected from page scripts. No
        online service is completely secure, so please use a strong, unique password and avoid putting sensitive details you do not need on
        a resume, such as national ID numbers.
      </p>

      <H2>8. Your choices and rights</H2>
      <p>
        You can ask us to tell you what personal information we hold about you, to correct it, or to delete it, and you can object to how
        we use it. If you are in the European Economic Area, the United Kingdom or another place with data protection law, these rights
        may be set out in that law. You can also decline Analytics by using your browser&apos;s tracking protection or an extension that
        blocks it.
      </p>

      <H2>9. Contact</H2>
      <p>
        For privacy questions or to make a request, contact us through <Contact />. Please say what you would like us to do and the email
        address on your account, so we can find it.
      </p>

      <H2>10. Children</H2>
      <p>RateYourCV is not directed at children under 16, and we do not knowingly collect their personal information.</p>

      <H2>11. Where information is processed</H2>
      <p>
        Our hosting provider runs servers in several countries, so your information may be processed outside the country where you live.
      </p>

      <H2>12. Changes to this policy</H2>
      <p>
        If we change this policy we will update the date at the top of this page and, for significant changes, tell you on the site.
      </p>
    </LegalPage>
  );
}
