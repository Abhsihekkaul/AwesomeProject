"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import UserAvatar, { AVATAR_COLORS } from "@/components/ui/UserAvatar";
import { authApi } from "@/api/authApi";
import { apiErrorMessage } from "@/api/http";
import { useAuth } from "@/context/AuthContext";
import { conditions as ALL_CONDITIONS } from "@/lib/conditions";
import { cn } from "@/lib/cn";

/**
 * The app's post-signup setup flow (ProfileName → HealthJourney →
 * PrivacySafety), web edition — with one upgrade: unlike the app's screens
 * (visual-only today), this one actually persists everything in a single
 * PATCH /auth/me on the final step. Step 3 carries the app's privacy note
 * plus the account's REAL notifyOnMessages flag; the app's public-profile /
 * anonymous-posts toggles have no backend yet, so they aren't shown.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  // Only a signed-in user can be welcomed.
  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isBootstrapping, router]);

  if (isBootstrapping || !isAuthenticated || !user) {
    return <p className="text-center text-step text-muted">Loading…</p>;
  }
  // The wizard mounts only once the account exists, so its state can seed
  // straight from the user in useState initializers (no effects needed).
  return <WelcomeWizard seedName={user.name} seedColor={user.avatarColor} />;
}

function WelcomeWizard({ seedName, seedColor }: { seedName: string; seedColor?: string }) {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(seedName);
  const [avatarColor, setAvatarColor] = useState(seedColor || "purple");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [notifyOnMessages, setNotifyOnMessages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ALL_CONDITIONS.filter((c) => c.toLowerCase().includes(q)) : ALL_CONDITIONS;
  }, [query]);

  const toggle = (item: string) =>
    setSelected((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      updateUser(
        await authApi.updateMe({
          name: name.trim() || user?.name,
          avatarColor,
          conditions: selected,
          notifyOnMessages,
        }),
      );
      router.replace("/feed");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save your profile"));
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Step indicator, same shape as the app's StepIndicator */}
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-line")}
          />
        ))}
      </div>
      <p className="mt-3 text-caption text-muted">Step {step + 1} of 3</p>

      {step === 0 ? (
        <>
          <h1 className="mt-1 text-title font-semibold text-ink">Create your profile</h1>
          <p className="mt-1 text-step text-muted">
            This is how others in your circles will know you.
          </p>

          <div className="mt-6 flex justify-center">
            <UserAvatar name={name.trim() || "?"} color={avatarColor} size={110} />
          </div>

          <p className="mt-4 text-center text-step text-muted">Choose your color</p>
          <div className="mt-2 flex justify-center gap-3">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.key}
                aria-label={`${c.key} avatar color`}
                aria-pressed={avatarColor === c.key}
                onClick={() => setAvatarColor(c.key)}
                style={{ backgroundColor: c.hex }}
                className={cn(
                  "h-10 w-10 rounded-full transition-transform hover:scale-110",
                  avatarColor === c.key && "ring-[3px] ring-ink ring-offset-2 ring-offset-card",
                )}
              />
            ))}
          </div>

          <div className="mt-5">
            <Field
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <p className="mt-2 text-caption text-muted">
              This can be a nickname — your real name is never required.
            </p>
          </div>

          <Button className="mt-6" onClick={() => setStep(1)}>
            Continue
          </Button>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <h1 className="mt-1 text-title font-semibold text-ink">Your health journey</h1>
          <p className="mt-1 text-step text-muted">
            Select the condition(s) you live with. You can add more later.
          </p>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conditions..."
            aria-label="Search conditions"
            className="mt-4 w-full rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          />

          {selected.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.map((item) => (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className="rounded-full bg-primary px-3.5 py-1 text-caption font-medium text-white"
                >
                  {item} ×
                </button>
              ))}
            </div>
          ) : null}

          <ul className="mt-3 max-h-72 overflow-y-auto">
            {visible.length === 0 ? (
              <li className="py-6 text-center text-step text-muted">
                No conditions match &quot;{query.trim()}&quot;.
              </li>
            ) : (
              visible.map((item) => {
                const active = selected.includes(item);
                return (
                  <li key={item} className="border-b border-line last:border-0">
                    <button
                      onClick={() => toggle(item)}
                      aria-pressed={active}
                      className="flex w-full items-center justify-between py-3.5 text-left"
                    >
                      <span className="text-step font-medium text-ink">{item}</span>
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2",
                          active ? "border-primary bg-primary text-white" : "border-line",
                        )}
                      >
                        {active ? "✓" : null}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="mt-5 flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={() => setStep(2)}>Continue</Button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h1 className="mt-1 text-title font-semibold text-ink">Privacy &amp; safety</h1>
          <p className="mt-1 text-step text-muted">
            Choose what feels right for you. You can change this anytime.
          </p>

          <label className="mt-5 flex items-center justify-between rounded-xl border border-line bg-card p-4">
            <span className="pr-3">
              <span className="block text-step font-semibold text-ink">Message notifications</span>
              <span className="block text-caption text-muted">
                Popups &amp; alerts when someone messages you — synced with the app.
              </span>
            </span>
            <button
              role="switch"
              aria-checked={notifyOnMessages}
              onClick={() => setNotifyOnMessages(!notifyOnMessages)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                notifyOnMessages ? "bg-primary" : "bg-line",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                  notifyOnMessages ? "left-6" : "left-1",
                )}
              />
            </button>
          </label>

          <div className="mt-3 rounded-xl bg-light-green p-4">
            <p className="text-step font-semibold text-success">Your privacy is protected</p>
            <p className="mt-1 text-caption leading-relaxed text-success">
              We never share your medical information. You can update these settings anytime from
              your profile.
            </p>
          </div>

          {error ? <p className="mt-3 text-caption font-semibold text-danger">{error}</p> : null}

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
              Back
            </Button>
            <Button onClick={finish} disabled={saving}>
              {saving ? "Saving…" : "Enter HealCircle ›"}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
