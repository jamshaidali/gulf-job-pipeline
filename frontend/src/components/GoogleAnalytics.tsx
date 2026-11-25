import Script from 'next/script';

/** Google Analytics 4. Loads only in production builds, so local and test runs are not counted. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-CGXVNSXW4J';

export default function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production' || !GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { allow_google_signals: false, allow_ad_personalization_signals: false });`}
      </Script>
    </>
  );
}
