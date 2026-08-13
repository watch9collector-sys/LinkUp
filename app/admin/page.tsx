"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { PageLoading } from "../components/ui/LoadingStates";
import { TextLink } from "../components/TextLink";
import { Button } from "../components/ui/Button";
import { useAuthSession } from "@/src/hooks/useAuthSession";
import {
  REPORT_REASONS,
  checkIsPlatformFounder,
  fetchOpenReportsForFounder,
  founderSetReportStatus,
  type UserReportRow,
} from "@/src/lib/moderationApi";

function reasonLabel(reason: string): string {
  return REPORT_REASONS.find((item) => item.value === reason)?.label ?? reason;
}

export default function AdminPage() {
  const { user, ready } = useAuthSession();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [reports, setReports] = useState<UserReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await fetchOpenReportsForFounder();
    if (fetchError) {
      setError(fetchError.message);
      setReports([]);
      return;
    }
    setReports(data);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void (async () => {
      if (!user) {
        if (!cancelled) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }
      const founder = await checkIsPlatformFounder();
      if (cancelled) return;
      setAllowed(founder);
      setChecking(false);
      if (founder) {
        await refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, refresh]);

  async function setStatus(reportId: string, status: UserReportRow["status"]) {
    setBusyId(reportId);
    setError(null);
    try {
      const { error: updateError } = await founderSetReportStatus(reportId, status);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (!ready || checking) {
    return <PageLoading message="Checking access…" />;
  }

  if (!user || !allowed) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-6">
        <TextLink href="/profile">← Back to app</TextLink>
        <GlassCard className="py-10 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Founder access required
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/58">
            This area is only available to the authenticated NYVON Founder/Owner
            account.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextLink href="/profile">← Back to profile</TextLink>
        <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      <GlassCard className="space-y-5 py-8 sm:py-10">
        <h1 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
          Report review
        </h1>
        <p className="mx-auto max-w-lg text-center text-sm leading-relaxed text-white/55">
          Reports are recorded for review. They do not automatically delete
          LinkUps or punish accounts.
        </p>
        {error ? (
          <p className="text-center text-sm text-red-300/95" role="alert">
            {error}
          </p>
        ) : null}
        {reports.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-emerald-500/25 bg-[#0B0F14]/40 px-6 py-14 text-center">
            <p className="text-[15px] font-medium text-white/88">No reports found</p>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              When users submit reports, they will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li
                key={report.id}
                className="rounded-2xl border border-white/[0.06] bg-[#0B0F14]/35 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {reasonLabel(report.reason)}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {new Date(report.created_at).toLocaleString()} · {report.status}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/55">
                    {report.reported_linkup_id ? "LinkUp" : "User"}
                  </span>
                </div>
                {report.details.trim() ? (
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    {report.details}
                  </p>
                ) : null}
                <p className="mt-3 font-mono text-[11px] text-white/40">
                  reporter {report.reporter_id.slice(0, 8)}…
                  {report.reported_user_id
                    ? ` · user ${report.reported_user_id.slice(0, 8)}…`
                    : ""}
                  {report.reported_linkup_id
                    ? ` · linkup ${report.reported_linkup_id.slice(0, 8)}…`
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={busyId === report.id}
                    onClick={() => void setStatus(report.id, "reviewed")}
                  >
                    Mark reviewed
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={busyId === report.id}
                    onClick={() => void setStatus(report.id, "dismissed")}
                  >
                    Dismiss
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={busyId === report.id}
                    onClick={() => void setStatus(report.id, "actioned")}
                  >
                    Mark actioned
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
