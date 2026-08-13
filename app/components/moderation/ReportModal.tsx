"use client";

import { useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../ui/Button";
import { SelectField, TextAreaField } from "../ui/FormField";
import {
  REPORT_REASONS,
  submitUserReport,
  type ReportReason,
} from "@/src/lib/moderationApi";

type ReportModalProps = {
  open: boolean;
  onClose: () => void;
  reportedUserId?: string | null;
  reportedLinkUpId?: string | null;
  title?: string;
};

export function ReportModal({
  open,
  onClose,
  reportedUserId = null,
  reportedLinkUpId = null,
  title = "Submit a report",
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClose() {
    setReason("spam");
    setDetails("");
    setError(null);
    setDone(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: submitError } = await submitUserReport({
        reason,
        details,
        reportedUserId,
        reportedLinkUpId,
      });
      if (submitError) {
        setError(submitError.message);
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      {done ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/70">
            Thanks. Your report was submitted for review. No automatic action
            was taken.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="primary" size="md" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-4">
          <SelectField
            id="report-reason"
            label="Reason"
            value={reason}
            onChange={(ev) => setReason(ev.target.value as ReportReason)}
            required
          >
            {REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value} className="bg-slate-900 text-white">
                {item.label}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            id="report-details"
            label="Additional details (optional)"
            value={details}
            onChange={(ev) => setDetails(ev.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Anything that helps us review this report…"
          />
          {error ? (
            <p className="text-sm text-red-300/95" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" size="md" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={busy}>
              Submit report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
