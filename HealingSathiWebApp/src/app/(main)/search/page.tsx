"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";

type FoundUser = {
  id: string;
  name: string;
  conditions?: string[];
  relation: "none" | "pending" | "sathi";
};

type FoundGroup = { id: string; name: string; tag?: string; memberCount?: number; joined?: boolean };
type FoundConsultant = { id: string; name: string; role?: string };

/**
 * Global search (the app's SearchScreen): debounced people search with live
 * relation status + "+ Add Sathi", plus matching groups and consultants.
 */
export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<FoundUser[]>([]);
  const [groups, setGroups] = useState<FoundGroup[]>([]);
  const [consultants, setConsultants] = useState<FoundConsultant[]>([]);
  const [searching, setSearching] = useState(false);
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  // Debounced search; groups/consultants filter client-side like the app does.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const q = query.trim();
    if (q.length < 2) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- debounce bookkeeping
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [foundUsers, allGroups, allConsultants] = await Promise.all([
          resourcesApi.searchUsers(q),
          resourcesApi.getGroups(),
          resourcesApi.getConsultants(),
        ]);
        const lower = q.toLowerCase();
        setUsers(foundUsers);
        setGroups(
          allGroups.filter(
            (g: FoundGroup) =>
              g.name.toLowerCase().includes(lower) || g.tag?.toLowerCase().includes(lower),
          ),
        );
        setConsultants(
          allConsultants.filter(
            (c: FoundConsultant) =>
              c.name.toLowerCase().includes(lower) || c.role?.toLowerCase().includes(lower),
          ),
        );
      } catch {
        // Keep previous results quietly.
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, isAuthenticated]);

  const addSathi = async (user: FoundUser) => {
    setRequested((prev) => ({ ...prev, [user.id]: true })); // optimistic
    try {
      await resourcesApi.sendSathiRequest(user.id);
    } catch (err) {
      setRequested((prev) => ({ ...prev, [user.id]: false }));
      window.alert(apiErrorMessage(err, "Couldn't send the request"));
    }
  };

  const message = async (user: FoundUser) => {
    try {
      router.push(`/chats/${await resourcesApi.openChatWith(user.id)}`);
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't open the chat"));
    }
  };

  const q = query.trim();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-heading font-bold text-ink">Search</h1>
      <div className="relative mt-3">
        <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">
          <Icon name="search" size={16} />
        </span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="People, groups, consultants..."
          className="w-full rounded-full border border-line bg-card py-3 pr-4 pl-10 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {!isAuthenticated ? (
        <p className="mt-6 rounded-2xl border border-line bg-card p-6 text-center text-step text-muted">
          Search works on real accounts — sign in to find your people.
        </p>
      ) : q.length < 2 ? (
        <p className="mt-6 text-center text-step text-muted">Type at least 2 characters to search.</p>
      ) : (
        <div className="mt-5 space-y-6">
          {searching ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-caption font-bold tracking-wide text-muted uppercase">People</h2>
                {users.length === 0 ? (
                  <p className="mt-2 text-step text-muted">No people match.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {users.map((u) => {
                      const relation = requested[u.id] ? "pending" : u.relation;
                      return (
                        <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                          <Link href={`/user/${u.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                            <UserAvatar name={u.name} size={42} />
                            <span className="min-w-0">
                              <span className="block truncate text-step font-bold text-ink">{u.name}</span>
                              <span className="block truncate text-caption text-muted">
                                {(u.conditions ?? []).slice(0, 3).join(" · ") || "Member"}
                              </span>
                            </span>
                          </Link>
                          {relation === "sathi" ? (
                            <button
                              onClick={() => message(u)}
                              className="rounded-full bg-light-purple px-3.5 py-1.5 text-caption font-semibold text-primary hover:opacity-90"
                            >
                              Message
                            </button>
                          ) : relation === "pending" ? (
                            <span className="rounded-full bg-light-blue px-3.5 py-1.5 text-caption font-semibold text-muted">
                              Requested ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => addSathi(u)}
                              className="rounded-full bg-primary px-3.5 py-1.5 text-caption font-semibold text-white hover:bg-primary-dark"
                            >
                              + Add Sathi
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {groups.length > 0 ? (
                <section>
                  <h2 className="text-caption font-bold tracking-wide text-muted uppercase">Groups</h2>
                  <div className="mt-2 space-y-2">
                    {groups.map((g) => (
                      <Link
                        key={g.id}
                        href={`/groups/${g.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 hover:bg-light-blue"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-light-purple text-primary">
                          <Icon name="people" size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-step font-bold text-ink">{g.name}</span>
                          <span className="block text-caption text-muted">
                            {g.tag ? `${g.tag} · ` : ""}
                            {g.memberCount ?? 0} members
                          </span>
                        </span>
                        {g.joined ? (
                          <span className="rounded-full bg-light-green px-3 py-1 text-caption font-semibold text-success">
                            Joined
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {consultants.length > 0 ? (
                <section>
                  <h2 className="text-caption font-bold tracking-wide text-muted uppercase">Consultants</h2>
                  <div className="mt-2 space-y-2">
                    {consultants.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                        <UserAvatar name={c.name} size={42} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-step font-bold text-ink">{c.name}</span>
                          <span className="block truncate text-caption text-muted">{c.role}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
