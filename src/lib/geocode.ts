export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "LinkUp/1.0 (profile meetups app)";
const NOMINATIM_RETRY_DELAY_MS = 1100;
const NOMINATIM_MAX_ATTEMPTS = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function geocodeOnce(locationLabel: string): Promise<GeocodeResult | null> {
  const query = locationLabel.trim();
  if (query.length < 3) return null;

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;

  const hit = rows[0];
  if (!hit?.lat || !hit?.lon) return null;

  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    displayName: hit.display_name?.trim() || query,
  };
}

/**
 * Resolve a human location label to coordinates via OpenStreetMap Nominatim.
 * Retries once to improve reliability on publish/edit (Nominatim rate limits).
 */
export async function geocodeLocationLabel(
  locationLabel: string,
): Promise<GeocodeResult | null> {
  for (let attempt = 0; attempt < NOMINATIM_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(NOMINATIM_RETRY_DELAY_MS);
    }
    try {
      const result = await geocodeOnce(locationLabel);
      if (result) return result;
    } catch {
      // try again on next attempt
    }
  }
  return null;
}

export const GEOCODE_FAILED_MESSAGE =
  "We could not map that address. Use a street address, neighborhood, or landmark (for example, “123 Main St, Oakland”) so your LinkUp appears on the map.";
