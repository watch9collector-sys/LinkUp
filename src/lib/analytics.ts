type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const POSTHOG_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_upRW9f3uSHGs6nYK8CeYPxPapy48WxSXTM44eyv2c5eQ";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

function attribution() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") ?? params.get("source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    content: params.get("utm_content") ?? undefined,
    community_id: params.get("community_id") ?? undefined,
    host_id: params.get("host_id") ?? undefined,
    pilot_id: params.get("pilot_id") ?? undefined,
    invite_code: params.get("invite_code") ?? undefined,
  };
}

export function captureAnalytics(
  event: string,
  distinctId: string,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === "undefined" || !POSTHOG_TOKEN || !distinctId) return;

  const payload = {
    api_key: POSTHOG_TOKEN,
    event,
    properties: {
      distinct_id: distinctId,
      $current_url: window.location.href,
      $pathname: window.location.pathname,
      ...attribution(),
      ...properties,
    },
    timestamp: new Date().toISOString(),
  };

  void fetch(`${POSTHOG_HOST}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the product experience.
  });
}
