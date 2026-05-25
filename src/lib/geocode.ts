export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "LinkUp/1.0 (profile meetups app)";

/**
 * Resolve a human location label to coordinates via OpenStreetMap Nominatim.
 * Returns null when no match is found or the network fails.
 */
export async function geocodeLocationLabel(
  locationLabel: string,
): Promise<GeocodeResult | null> {
  const query = locationLabel.trim();
  if (query.length < 3) return null;

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  try {
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
  } catch {
    return null;
  }
}
