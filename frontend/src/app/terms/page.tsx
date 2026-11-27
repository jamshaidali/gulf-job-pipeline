import type { Metadata } from 'next';
import LegalPage, { H2, Contact } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | RateYourCV',
  description:
    'The terms for using RateYourCV: your account, your content, acceptable use, what the ATS scanner does and does not promise, and limits of liability.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms apply when you use the RateYourCV website and tools. By using the service you agree to them. If you do not agree, please do not use it."
    >
      <H2>1. What the service is</H2>
      <p>
        RateYourCV provides a resume builder, resume templates and an ATS Scanner that compares a resume with a job description. The
        tools are meant to help you write and check your own resume.
      </p>

      <H2>2. Your account</H2>
      <p>
        Some features need an account. Give accurate details, keep your password private, and tell us if you think someone else has used
        your account. You are responsible for activity under your account.
      </p>

      <H2>3. Your content</H2>
      <p>
        You keep ownership of the resumes, job descriptions and other content you submit. You give us permission to process that content
        only as needed to run the service for you, for example to read a resume file, show an analysis, or create a download. You
        confirm that you have the right to use what you submit, and that it is accurate and does not infringe anyone else&apos;s rights.
      </p>

      <H2>4. Be honest on your resume</H2>
      <p>
        You are responsible for what is on your resume. Please do not use the service to state qualifications, employers or results that
        are not true. Suggestions and examples in the tools and guides are starting points; check that anything you use applies to you.
      </p>

      <H2>5. Acceptable use</H2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Break the law or use the service to harm, harass or deceive others</li>
        <li>Try to disrupt the site, overload it, or get around its limits and security</li>
        <li>Use bots or scripts to create accounts or copy the service in bulk without our permission</li>
        <li>Upload files that contain malware or that you do not have the right to share</li>
        <li>Resell or redistribute the templates or tools as your own product</li>
      </ul>

      <H2>6. What the tools do and do not promise</H2>
      <p>
        The ATS Scanner gives an estimate of how well a resume matches a particular job description. It is our own calculation, not a
        score from any employer or applicant tracking system, and different tools give different numbers. Templates are designed to be
        easy to read, but we cannot guarantee how any employer&apos;s software or recruiter will treat a resume. We do not promise
        interviews, job offers or any particular result.
      </p>

      <H2>7. Free service and future pricing</H2>
      <p>
        The service is currently free to use. We may introduce paid features in future. If we do, we will show the price clearly before
        you are asked to pay, and we will not charge you without your agreement.
      </p>

      <H2>8. Our content and templates</H2>
      <p>
        The site, its design, software, templates and guides belong to RateYourCV or its licensors. You may use the resumes you create
        for your own job applications. Please do not copy or republish our guides and templates as a competing product.
      </p>

      <H2>9. Availability and changes</H2>
      <p>
        We try to keep the service available but cannot promise it will always be uninterrupted or error-free. We may change, pause or end
        features, and we may suspend accounts that break these terms. You can stop using the service at any time and ask us to delete your
        account.
      </p>

      <H2>10. Limit of liability</H2>
      <p>
        The service is provided &quot;as is&quot;. To the extent the law allows, RateYourCV is not liable for indirect or consequential
        losses, such as lost job opportunities, that result from using the service. Nothing in these terms limits any right you have under
        law that cannot be limited.
      </p>

      <H2>11. Changes to these terms</H2>
      <p>
        We may update these terms. The date at the top shows the latest version, and continuing to use the service after a change means you
        accept it.
      </p>

      <H2>12. Contact</H2>
      <p>
        Questions about these terms: <Contact />. See also our <a href="/privacy" className="text-indigo-700 font-semibold hover:underline">Privacy Policy</a>.
      </p>
    </LegalPage>
  );
}
