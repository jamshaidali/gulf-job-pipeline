/** Public site details used on legal and contact pages. */
export const SITE = {
  name: 'RateYourCV',
  url: 'https://rateyourcv.com',
  /** Set NEXT_PUBLIC_CONTACT_EMAIL in the hosting environment (or edit this) to show a contact address. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  legalUpdated: 'November 27, 2026',
} as const;
