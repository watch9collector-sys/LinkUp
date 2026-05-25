import type { LinkUpView } from "@/src/lib/linkupsTypes";

export type LinkUpMapPoint = {
  id: string;
  title: string;
  category: string;
  location: string;
  startsAt: string;
  hostName: string;
  attendeeCount: number;
  youJoined: boolean;
  youHost: boolean;
  lat: number;
  lng: number;
  approximate: boolean;
};

export const DEFAULT_LINKUP_MAP_CENTER = {
  // Safe demo center for MVP until linkups store exact coordinates.
  lat: 39.8283,
  lng: -98.5795,
};

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

function demoCoordinateOffset(id: string): { lat: number; lng: number } {
  const h = hashString(id);
  const latOffset = (((h % 900) / 900) - 0.5) * 0.18;
  const lngOffset = ((((h >> 10) % 900) / 900) - 0.5) * 0.22;
  return { lat: latOffset, lng: lngOffset };
}

export function linkUpMapPoint(linkup: LinkUpView): LinkUpMapPoint {
  const lat = linkup.latitude;
  const lng = linkup.longitude;
  if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      id: linkup.id,
      title: linkup.title,
      category: linkup.category,
      location: linkup.location.trim() || "Location TBD",
      startsAt: linkup.starts_at,
      hostName: linkup.host_display_name.trim() || "Host",
      attendeeCount: linkup.attendee_count,
      youJoined: linkup.you_joined,
      youHost: linkup.you_host,
      lat,
      lng,
      approximate: false,
    };
  }

  const offset = demoCoordinateOffset(linkup.id);

  return {
    id: linkup.id,
    title: linkup.title,
    category: linkup.category,
    location: linkup.location.trim() || "Location TBD",
    startsAt: linkup.starts_at,
    hostName: linkup.host_display_name.trim() || "Host",
    attendeeCount: linkup.attendee_count,
    youJoined: linkup.you_joined,
    youHost: linkup.you_host,
    lat: DEFAULT_LINKUP_MAP_CENTER.lat + offset.lat,
    lng: DEFAULT_LINKUP_MAP_CENTER.lng + offset.lng,
    approximate: true,
  };
}
