"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { cn } from "@/lib/cn";

type Group = {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  memberCount: number;
  joined: boolean;
  coverUrl?: string | null;
};

const DEMO_GROUPS: Group[] = [
  { id: "g1", name: "Fibromyalgia Warriors", tag: "Chronic Pain", memberCount: 128, joined: true, description: "A supportive community for people living with fibromyalgia." },
  { id: "g2", name: "Type 2 Diabetes", tag: "Metabolic", memberCount: 86, joined: false, description: "Managing T2D together — diet, meds, and morale." },
  { id: "g3", name: "Long COVID Recovery", tag: "Post-Viral", memberCount: 54, joined: false, description: "Pacing, recovery and hope after COVID." },
];

/** The groups directory (the app's GroupsScreen) + "Request a group". */
export default function GroupsPage() {
  const [requestOpen, setRequestOpen] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const { data: groups, isLive, loading, refresh } = useLiveData<Group[]>(
    ["groups"],
    async () => resourcesApi.getGroups(),
    DEMO_GROUPS,
  );

  const toggleJoin = async (group: Group) => {
    if (!isLive || busy[group.id]) return;
    setBusy((prev) => ({ ...prev, [group.id]: true }));
    try {
      await resourcesApi.toggleJoinGroup(group.id);
      await refresh();
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't update membership"));
    } finally {
      setBusy((prev) => ({ ...prev, [group.id]: false }));
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-heading font-bold text-ink">Groups</h1>
        <button
          onClick={() => setRequestOpen(true)}
          className="rounded-full bg-light-purple px-4 py-2 text-step font-semibold text-primary hover:opacity-90"
        >
          + Request a group
        </button>
      </div>
      <p className="mt-1 text-step text-muted">Condition-based circles, moderated with care.</p>

      <div className="mt-4 space-y-3">
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
          : groups.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                {/* Cover band — the server always sends one (member photo or healing preset) */}
                {g.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.coverUrl} alt="" className="h-20 w-full object-cover" />
                ) : null}
                <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-light-purple text-primary">
                    <Icon name="people" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {isLive ? (
                      <Link href={`/groups/${g.id}`} className="text-step font-bold text-ink hover:underline">
                        {g.name}
                      </Link>
                    ) : (
                      <span className="text-step font-bold text-ink">{g.name}</span>
                    )}
                    <p className="text-caption text-muted">
                      {g.tag ? `${g.tag} · ` : ""}
                      {g.memberCount} members
                    </p>
                    {g.description ? (
                      <p className="mt-1 text-step leading-snug text-muted">{g.description}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => toggleJoin(g)}
                    disabled={!!busy[g.id]}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-caption font-semibold",
                      g.joined
                        ? "bg-light-green text-success"
                        : "bg-primary text-white hover:bg-primary-dark",
                    )}
                  >
                    {g.joined ? "Joined ✓" : "Join"}
                  </button>
                </div>
                </div>
              </div>
            ))}
        {!isLive && !loading ? (
          <p className="text-center text-caption text-muted">
            Demo groups — sign in to join real circles.
          </p>
        ) : null}
      </div>

      {requestOpen ? (
        <RequestGroupModal
          onClose={() => setRequestOpen(false)}
          canSubmit={isLive}
        />
      ) : null}
    </div>
  );
}

/** "Request a group" — goes to the admin review queue, same as the app. */
function RequestGroupModal({ onClose, canSubmit }: { onClose: () => void; canSubmit: boolean }) {
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!condition.trim() || !description.trim() || !reason.trim()) {
      setError("Please fill in every field");
      return;
    }
    if (!canSubmit) {
      setError("Demo mode can't submit — sign in first");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resourcesApi.requestGroup({
        condition: condition.trim(),
        description: description.trim(),
        reason: reason.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't submit the proposal"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-card shadow-soft p-5" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <h2 className="text-heading font-bold text-ink">Proposal sent 💜</h2>
            <p className="mt-2 text-step text-muted">
              Our team reviews every group so circles stay safe. You&apos;ll get a notification
              either way.
            </p>
            <Button className="mt-4" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <h2 className="text-heading font-bold text-ink">Request a group</h2>
            {error ? <p className="mt-2 text-step font-medium text-danger">{error}</p> : null}
            <input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Condition (e.g. POTS)"
              className="mt-4 w-full rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What would this group be about?"
              rows={3}
              className="mt-3 w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is it needed?"
              rows={2}
              className="mt-3 w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <Button className="mt-4" onClick={submit} disabled={submitting}>
              {submitting ? "Sending..." : "Submit Proposal"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
