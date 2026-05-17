"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LatLngExpression,
  Map as LeafletMap,
  Marker,
  PointTuple,
} from "leaflet";
import { GlassCard } from "./GlassCard";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import type { LinkUpMapPoint } from "@/src/lib/linkupLocations";
import { DEFAULT_LINKUP_MAP_CENTER } from "@/src/lib/linkupLocations";
import { formatLinkUpTime } from "@/src/lib/linkupsApi";

export const linkUpMapFrameClass = [
  "relative w-full overflow-hidden rounded-2xl",
  "min-h-[220px] h-[min(42svh,500px)] max-h-[min(560px,64svh)]",
  "sm:min-h-[280px] sm:h-[min(46svh,540px)] sm:max-h-[min(600px,60svh)]",
  "lg:min-h-[320px] lg:h-[min(50vh,580px)] lg:max-h-[660px]",
].join(" ");

type LinkUpMapProps = {
  points: LinkUpMapPoint[];
  signedIn: boolean;
  busyId?: string | null;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onDetails: (id: string) => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createMarkerHtml(count: number) {
  const label = count > 0 ? String(count) : "";
  return `
    <span class="linkup-marker-shell">
      <span class="linkup-marker-dot">${label}</span>
    </span>
  `;
}

function createPopupHtml(point: LinkUpMapPoint) {
  const locationSuffix = point.approximate ? "Approximate area" : "Location";
  return `
    <div class="linkup-map-popup">
      <p class="linkup-map-popup-title">${escapeHtml(point.title)}</p>
      <p class="linkup-map-popup-meta">${escapeHtml(formatLinkUpTime(point.startsAt))}</p>
      <p class="linkup-map-popup-location">${escapeHtml(point.location)}</p>
      <p class="linkup-map-popup-note">${locationSuffix}</p>
    </div>
  `;
}

export function LinkUpMapSkeleton() {
  return (
    <GlassCard
      className={`${linkUpMapFrameClass} border-emerald-500/10 p-0`}
      aria-busy
      aria-label="Loading interactive map"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b0f14]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(148,163,184,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.4)_1px,transparent_1px)] [background-size:22px_22px] sm:[background-size:28px_28px]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,197,94,0.08),transparent_55%)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Spinner className="h-8 w-8 text-emerald-400/85" />
        <p className="text-xs font-medium text-white/45">Loading map…</p>
      </div>
    </GlassCard>
  );
}

export function LinkUpMap({
  points,
  signedIn,
  busyId,
  onJoin,
  onLeave,
  onDetails,
}: LinkUpMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const center: LatLngExpression = useMemo(() => {
    if (points.length > 0) {
      return [points[0].lat, points[0].lng];
    }
    return [DEFAULT_LINKUP_MAP_CENTER.lat, DEFAULT_LINKUP_MAP_CENTER.lng];
  }, [points]);
  const selectedPoint =
    points.find((point) => point.id === selectedId) ?? null;
  const mapBoundsKey = useMemo(
    () => points.map((point) => `${point.id}:${point.lat}:${point.lng}`).join("|"),
    [points],
  );

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      try {
        const L = await import("leaflet");
        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          center: [DEFAULT_LINKUP_MAP_CENTER.lat, DEFAULT_LINKUP_MAP_CENTER.lng],
          zoom: 4,
          minZoom: 3,
          maxZoom: 18,
          scrollWheelZoom: false,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);
      } catch {
        if (!cancelled) {
          setMapError("Map could not load. Check your local network connection.");
        }
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    async function syncMarkers() {
      const map = mapRef.current;
      if (!map) return;

      const L = await import("leaflet");
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (points.length === 0) {
        map.setView(center, 4);
        return;
      }

      const bounds = L.latLngBounds([]);
      points.forEach((point) => {
        const icon = L.divIcon({
          html: createMarkerHtml(point.attendeeCount),
          className: "linkup-leaflet-div-icon",
          iconSize: [34, 42],
          iconAnchor: [17, 39],
          popupAnchor: [0, -36],
        });
        const marker = L.marker([point.lat, point.lng], {
          icon,
          title: point.title,
        })
          .addTo(map)
          .bindPopup(createPopupHtml(point));
        marker.on("click", () => setSelectedId(point.id));
        markersRef.current.push(marker);
        bounds.extend([point.lat, point.lng]);
      });

      setSelectedId((current) => {
        if (current && points.some((point) => point.id === current)) {
          return current;
        }
        return null;
      });

      requestAnimationFrame(() => {
        map.invalidateSize();
      });

      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 13, { animate: true });
      } else {
        const topLeft: PointTuple = window.matchMedia("(max-width: 640px)").matches
          ? [42, 42]
          : [52, 52];
        const bottomRight: PointTuple = window.matchMedia("(max-width: 640px)").matches
          ? [42, 180]
          : [390, 70];
        map.fitBounds(bounds, {
          paddingTopLeft: topLeft,
          paddingBottomRight: bottomRight,
          maxZoom: 13,
          animate: true,
        });
      }
    }

    void syncMarkers();
  }, [center, mapBoundsKey, points]);

  if (mapError) {
    return (
      <GlassCard
        className={`${linkUpMapFrameClass} flex flex-col items-center justify-center border-amber-500/15 bg-amber-500/5 p-6 text-center`}
      >
        <p className="text-sm font-medium text-amber-100/95">{mapError}</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
          LinkUps will still appear below. Refresh once your connection is back.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className={`${linkUpMapFrameClass} border-emerald-500/10 p-0 transition-[box-shadow,border-color] duration-300 ease-out hover:border-emerald-500/20 hover:shadow-[0_0_48px_-12px_rgba(34,197,94,0.12)] motion-reduce:transition-none`}
    >
      {!mapReady ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0B0F14]/70 backdrop-blur-sm">
          <Spinner className="h-8 w-8 text-emerald-400/85" />
          <p className="text-xs font-medium text-white/45">Loading map…</p>
        </div>
      ) : null}
      <div ref={containerRef} className="linkup-leaflet h-full w-full" />
      {selectedPoint ? (
        <div className="absolute bottom-3 left-3 right-3 z-[420] sm:bottom-4 sm:left-4 sm:right-auto sm:w-[22rem]">
          <div className="rounded-2xl border border-emerald-400/15 bg-[#0B0F14]/94 p-4 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl ring-1 ring-white/[0.06]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                  {selectedPoint.category}
                </p>
                <h2 className="mt-1 truncate text-base font-semibold tracking-tight text-white">
                  {selectedPoint.title}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm leading-none text-white/45 transition hover:bg-white/[0.06] hover:text-white/80"
                aria-label="Close LinkUp preview"
                onClick={() => setSelectedId(null)}
              >
                ×
              </button>
            </div>
            <div className="mt-3 grid gap-1.5 text-xs leading-relaxed text-white/58">
              <p>
                <span className="text-white/38">Host:</span>{" "}
                <span className="text-white/82">{selectedPoint.hostName}</span>
              </p>
              <p>
                <span className="text-white/38">When:</span>{" "}
                <span className="text-white/82">
                  {formatLinkUpTime(selectedPoint.startsAt)}
                </span>
              </p>
              <p>
                <span className="text-white/38">Going:</span>{" "}
                <span className="text-white/82 tabular-nums">
                  {selectedPoint.attendeeCount}
                </span>
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {selectedPoint.youHost ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => onDetails(selectedPoint.id)}
                >
                  View your LinkUp
                </Button>
              ) : signedIn && selectedPoint.youJoined ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  loading={busyId === selectedPoint.id}
                  onClick={() => onLeave(selectedPoint.id)}
                >
                  Leave
                </Button>
              ) : signedIn ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  loading={busyId === selectedPoint.id}
                  onClick={() => onJoin(selectedPoint.id)}
                >
                  Join
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => onDetails(selectedPoint.id)}
                >
                  View
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => onDetails(selectedPoint.id)}
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[410] flex flex-col items-end gap-2 sm:bottom-4 sm:left-auto sm:right-4">
        <span className="w-fit rounded-lg bg-[#0B0F14]/88 px-2.5 py-1.5 text-[11px] font-medium text-white/92 backdrop-blur-md ring-1 ring-emerald-500/15 sm:px-3 sm:text-xs">
          Live map
        </span>
        <span className="w-fit rounded-lg bg-[#0B0F14]/82 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-slate-300/90 backdrop-blur-md ring-1 ring-white/[0.06] sm:text-xs">
          {points.length === 0
            ? "No LinkUps yet"
            : points.some((p) => p.approximate)
              ? "Approximate locations"
              : "Nearby LinkUps"}
        </span>
      </div>
    </GlassCard>
  );
}
