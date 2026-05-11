import { JsonLd } from "./JsonLd";

export function WebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gpt-navigator.com";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "GPT Navigator",
        url: baseUrl,
        description:
          "Discover and compare the best get-paid-to (GPT) platforms. Find sites like Freecash, Swagbucks and more.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/platforms?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}
