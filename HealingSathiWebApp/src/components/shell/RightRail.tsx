"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";

type Sathi = { id: string; name: string };
type Group = { id: string; name: string; joined?: boolean };

const DEMO_SATHIS: Sathi[] = [
  { id: "d1", name: "Alex K." },
  { id: "d2", name: "Maya Harrison" },
  { id: "d3", name: "Priya Sharma" },
];
const DEMO_GROUPS: Group[] = [
  { id: "g1", name: "Fibromyalgia Warriors" },
  { id: "g2", name: "Type 2 Diabetes" },
];

/**
 * Desktop right rail — the app's "My Friends / My Groups" directory, always
 * visible: real sathis (row → profile, 💬 → the conversation) and joined
 * groups, with honest empty states.
 */
export default function RightRail() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { data: sathis, isLive } = useLiveData<Sathi[]>(
    ["sathis"],
    async () => resourcesApi.getSathis(),
    DEMO_SATHIS,
  );
  const { data: groups } = useLiveData<Group[]>(
    ["groups"],
    async () => (await resourcesApi.getGroups()).filter((g: Group) => g.joined),
    DEMO_GROUPS,
  );

  const openChat = async (sathi: Sathi) => {
    if (!isLive) return;
    try {
      router.push(`/chats/${await resourcesApi.openChatWith(sathi.id)}`);
    } catch {
      router.push("/chats");
    }
  };

  return (
    <aside className="flex flex-col gap-4 p-4">
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-step font-bold text-ink">My Sathis</h2>
        {sathis.length === 0 ? (
          <p className="mt-2 text-caption text-muted">
            No sathis yet —{" "}
            <Link href="/search" className="font-semibold text-primary hover:underline">
              find your people
            </Link>
            .
          </p>
        ) : (
          <div className="mt-2 space-y-1">
            {sathis.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                {isLive ? (
                  <Link href={`/user/${s.id}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 hover:bg-light-blue">
                    <UserAvatar name={s.name} size={30} />
                    <span className="truncate text-step text-ink">{s.name}</span>
                  </Link>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1">
                    <UserAvatar name={s.name} size={30} />
                    <span className="truncate text-step text-ink">{s.name}</span>
                  </span>
                )}
                <button
                  aria-label={`Message ${s.name}`}
                  onClick={() => openChat(s)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-light-purple text-primary hover:opacity-90"
                >
                  <Icon name="chat" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-step font-bold text-ink">My Groups</h2>
        {groups.length === 0 ? (
          <p className="mt-2 text-caption text-muted">
            Not in any circles yet —{" "}
            <Link href="/groups" className="font-semibold text-primary hover:underline">
              browse groups
            </Link>
            .
          </p>
        ) : (
          <div className="mt-2 space-y-1">
            {groups.slice(0, 6).map((g) => (
              <Link
                key={g.id}
                href={isLive ? `/groups/${g.id}` : "/groups"}
                className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-light-blue"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-light-purple text-primary">
                  <Icon name="people" size={13} />
                </span>
                <span className="truncate text-step text-ink">{g.name}</span>
              </Link>
            ))}
          </div>
        )}
        {!isAuthenticated ? (
          <p className="mt-3 border-t border-line pt-2 text-caption text-muted">Demo data — sign in for yours.</p>
        ) : null}
      </section>
    </aside>
  );
}
