type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const POSTHOG_TOKEN = (
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
  "phc_upRW9f3uSHGs6nYK8CeYPxPapy48WxSXTM44eyv2c5eQ"
).trim();
const POSTHOG_HOST = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
)
  .trim()
  .replace(/\/$/, "");

function attribution() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    // Only approved UTM marketing fields may be attributed. Never forward
    // host IDs, community IDs, pilot IDs, invite codes or recovery parameters.
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    content: params.get("utm_content") ?? undefined,
  };
}

export function captureAnalytics(
  event: string,
  distinctId: string,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === "undefined" || !POSTHOG_TOKEN || !distinctId) return;
  // Disposable accounts/events in isolated QA must not contaminate live analytics.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL === "https://kxwechptoaituppkmcjr.supabase.co") return;

  const payload = {
    api_key: POSTHOG_TOKEN,
    distinct_id: distinctId,
    event,
    properties: {
      // Full URLs may contain password-recovery tokens, invite codes, or PII.
      // Keep only origin + pathname; never send query strings or fragments.
      $current_url: `${window.location.origin}${window.location.pathname}`,
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
