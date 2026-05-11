import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "GPT Navigator terms of service and affiliate disclosure.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | GPT Navigator",
    description: "GPT Navigator terms of service and affiliate disclosure.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 prose prose-gray max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated: May 11, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing GPT Navigator, you agree to these terms. If you do not
        agree, please do not use this website.
      </p>

      <h2>2. Service Description</h2>
      <p>
        GPT Navigator is an informational website that lists and compares
        get-paid-to (GPT) platforms. We provide reviews, ratings, and
        comparison tools to help users find suitable earning platforms.
      </p>

      <h2>3. No Guarantees</h2>
      <p>
        We strive to keep platform information accurate and up-to-date, but we
        do not guarantee:
      </p>
      <ul>
        <li>That listed platforms will pay you</li>
        <li>That earning estimates are accurate for your location</li>
        <li>That platform availability or terms won&apos;t change</li>
      </ul>
      <p>
        Always do your own research before signing up for any platform.
      </p>

      <h2>4. Affiliate Disclosure</h2>
      <p>
        GPT Navigator participates in affiliate programs. When you click
        certain links and sign up for a platform, we may receive a commission.
        This does not affect the price you pay. Our reviews and ratings are
        independent and not influenced by affiliate relationships.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        All content on this site (text, graphics, logos) is the property of
        GPT Navigator unless otherwise noted. Platform names and logos are
        trademarks of their respective owners.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        GPT Navigator is provided &quot;as is&quot; without warranties. We are
        not liable for any damages arising from your use of this site or from
        your interactions with third-party platforms linked from this site.
      </p>

      <h2>7. Changes to Terms</h2>
      <p>
        We may update these terms at any time. Continued use of the site
        after changes constitutes acceptance of the new terms.
      </p>

      <h2>8. Contact</h2>
      <p>
        For questions about these terms, contact{" "}
        <a href="mailto:admin@ins199.com">admin@ins199.com</a>.
      </p>
    </div>
  );
}
