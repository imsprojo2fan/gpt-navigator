import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "GPT Navigator privacy policy — how we handle your data.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | GPT Navigator",
    description: "GPT Navigator privacy policy — how we handle your data.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 prose prose-gray max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: May 11, 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        GPT Navigator uses Vercel Analytics to collect anonymized usage data,
        including page views, referrers, and browser information. This data
        does not identify individual users.
      </p>
      <p>We do NOT collect:</p>
      <ul>
        <li>Personal identification information</li>
        <li>Email addresses</li>
        <li>Account credentials</li>
        <li>Payment information</li>
      </ul>

      <h2>2. Cookies</h2>
      <p>
        We do not use tracking cookies. Vercel Analytics is privacy-focused
        and does not use cookies for tracking purposes.
      </p>

      <h2>3. How We Use Information</h2>
      <p>Usage data helps us understand:</p>
      <ul>
        <li>Which pages are most visited</li>
        <li>How users find our site</li>
        <li>Page performance and load times</li>
      </ul>

      <h2>4. Third-Party Links</h2>
      <p>
        Our site contains links to third-party GPT platforms. We are not
        responsible for the privacy practices of those sites. Please review
        their privacy policies before signing up.
      </p>

      <h2>5. Affiliate Disclosure</h2>
      <p>
        Some links on GPT Navigator are affiliate links. If you click an
        affiliate link and sign up for a platform, we may earn a commission
        at no additional cost to you. This does not affect our ratings or
        reviews.
      </p>

      <h2>6. Data Hosting</h2>
      <p>
        This site is hosted on Vercel and uses Supabase for data storage.
        Both platforms comply with GDPR and industry-standard security
        practices.
      </p>

      <h2>7. Contact</h2>
      <p>
        For privacy-related questions, contact us at{" "}
        <a href="mailto:admin@ins199.com">admin@ins199.com</a>.
      </p>
    </div>
  );
}
