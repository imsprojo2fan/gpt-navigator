import { JsonLd } from "./JsonLd";
import type { PlatformWithFeatures } from "@/types/platform";

export function PlatformSchema({ platform }: { platform: PlatformWithFeatures }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gpt-navigator.com";
  const features = platform.features[0];

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: platform.name,
        description:
          platform.description ||
          `${platform.name} is a get-paid-to platform where you can earn money completing tasks.`,
        url: `${baseUrl}/platforms/${platform.slug}`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        ...(platform.rating != null && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: platform.rating.toFixed(1),
            bestRating: "5",
            worstRating: "0",
            ratingCount: 1,
          },
        }),
        ...(features && {
          featureList: [
            ...features.taskTypes.map((t) => `Task: ${t}`),
            ...features.paymentMethods.map((p) => `Payment: ${p}`),
            features.hasMobileApp ? "Mobile App Available" : null,
            features.isBeginnerFriendly ? "Beginner Friendly" : null,
          ].filter(Boolean).join(", "),
        }),
      }}
    />
  );
}
