"use client";

import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import Skeleton from "@/components/ui/Skeleton";

type GroupProposal = {
  id: string;
  condition: string;
  description: string;
  reason: string;
  proposedBy: string;
  submittedAt: string;
};

type ConsultantApplication = {
  id: string;
  fullName: string;
  specialty: string;
  credentials: string;
  yearsExperience?: number;
  bio?: string;
};

type Reviews = {
  groupProposals: GroupProposal[];
  consultantApplications: ConsultantApplication[];
};

/**
 * The admin review queue (Settings → ADMIN in the app) — approve/reject group
 * proposals and consultant applications. The backend enforces the admin role
 * on every call regardless of what renders here.
 */
export default function AdminPage() {
  const { user } = useAuth();

  const { data, loading, refresh } = useLiveData<Reviews>(
    ["admin-reviews"],
    async () => resourcesApi.getAdminReviews(),
    { groupProposals: [], consultantApplications: [] },
  );

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card shadow-soft p-8 text-center">
        <h1 className="text-body font-bold text-ink">Admins only</h1>
        <p className="mt-2 text-step text-muted">This area is for the review team.</p>
      </div>
    );
  }

  const act = async (fn: () => Promise<unknown>, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    try {
      await fn();
      refresh();
    } catch (err) {
      window.alert(apiErrorMessage(err, "Action failed"));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-heading font-bold text-ink">Review queue</h1>

      <section>
        <h2 className="text-caption font-bold tracking-wide text-muted uppercase">Group proposals</h2>
        {loading ? (
          <Skeleton className="mt-2 h-28 w-full rounded-2xl" />
        ) : data.groupProposals.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-line bg-card shadow-soft p-5 text-center text-step text-muted">
            Nothing waiting. ✓
          </p>
        ) : (
          data.groupProposals.map((p) => (
            <div key={p.id} className="mt-2 rounded-2xl border border-line bg-card shadow-soft p-4">
              <h3 className="text-step font-bold text-ink">{p.condition}</h3>
              <p className="mt-1 text-step text-muted">{p.description}</p>
              <p className="mt-1 text-caption text-muted">
                Why: {p.reason} · Proposed by {p.proposedBy}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    act(() => resourcesApi.approveGroupProposal(p.id), `Approve "${p.condition}"? The group goes live for everyone.`)
                  }
                  className="rounded-full bg-primary px-4 py-1.5 text-caption font-semibold text-white hover:bg-primary-dark"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt("Optional reason for the proposer:") ?? undefined;
                    act(() => resourcesApi.rejectGroupProposal(p.id, reason), "Reject this proposal?");
                  }}
                  className="rounded-full border border-line px-4 py-1.5 text-caption font-semibold text-muted hover:bg-light-blue"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 className="text-caption font-bold tracking-wide text-muted uppercase">Consultant applications</h2>
        {loading ? (
          <Skeleton className="mt-2 h-28 w-full rounded-2xl" />
        ) : data.consultantApplications.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-line bg-card shadow-soft p-5 text-center text-step text-muted">
            Nothing waiting. ✓
          </p>
        ) : (
          data.consultantApplications.map((a) => (
            <div key={a.id} className="mt-2 rounded-2xl border border-line bg-card shadow-soft p-4">
              <h3 className="text-step font-bold text-ink">
                {a.fullName} <span className="font-normal text-muted">· {a.specialty}</span>
              </h3>
              <p className="mt-1 text-caption text-muted">
                {a.credentials}
                {a.yearsExperience ? ` · ${a.yearsExperience} yrs experience` : ""}
              </p>
              {a.bio ? <p className="mt-1 text-step text-muted">{a.bio}</p> : null}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    act(() => resourcesApi.approveConsultantApplication(a.id), `Approve ${a.fullName}? Their public consultant profile goes live.`)
                  }
                  className="rounded-full bg-primary px-4 py-1.5 text-caption font-semibold text-white hover:bg-primary-dark"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt("Optional reason for the applicant:") ?? undefined;
                    act(() => resourcesApi.rejectConsultantApplication(a.id, reason), "Reject this application? They may reapply.");
                  }}
                  className="rounded-full border border-line px-4 py-1.5 text-caption font-semibold text-muted hover:bg-light-blue"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
