"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { useChatNotifications } from "@/context/ChatNotificationsContext";
import { useLiveData } from "@/hooks/useLiveData";
import { authApi } from "@/api/authApi";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { tokenStorage } from "@/api/tokenStorage";
import { cn } from "@/lib/cn";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-caption font-bold tracking-wide text-muted uppercase">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

/**
 * Settings — every row here is REAL (same as the app's hardened Settings):
 * theme, chat-notifications toggle (account-level), change password/email,
 * blocked users, admin queue for admins, delete account.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, signOut, updateUser } = useAuth();
  const { notificationsEnabled, setNotificationsEnabled } = useChatNotifications();
  const { theme, setTheme } = useTheme();

  const [openForm, setOpenForm] = useState<"password" | "email" | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: blocked, refresh: refreshBlocked } = useLiveData<{ id: string; name: string }[]>(
    ["blocked"],
    async () => resourcesApi.getBlockedUsers(),
    [],
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const submitPassword = async () => {
    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await authApi.changePassword(currentPassword, newPassword, await tokenStorage.getRefreshToken());
      setFormNotice("Password updated — other devices were signed out.");
      setOpenForm(null);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't change the password"));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async () => {
    setBusy(true);
    setFormError(null);
    try {
      updateUser(await authApi.changeEmail(newEmail.trim(), currentPassword));
      setFormNotice("Email updated.");
      setOpenForm(null);
      setCurrentPassword("");
      setNewEmail("");
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't change the email"));
    } finally {
      setBusy(false);
    }
  };

  const unblock = async (id: string) => {
    try {
      await resourcesApi.unblockUser(id);
      refreshBlocked();
    } catch (err) {
      window.alert(apiErrorMessage(err, "Couldn't unblock"));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-heading font-bold text-ink">Settings</h1>

      <Section title="Appearance">
        <div className="flex gap-2">
          {(["system", "light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={cn(
                "flex-1 rounded-xl border py-2.5 text-step font-semibold capitalize",
                theme === mode ? "border-primary bg-primary text-white" : "border-line bg-page text-muted",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Notifications">
        <label className="flex items-center justify-between">
          <span>
            <span className="block text-step font-medium text-ink">Chat messages</span>
            <span className="block text-caption text-muted">
              Popups & alerts when someone messages you (synced with the app)
            </span>
          </span>
          <button
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors",
              notificationsEnabled ? "bg-primary" : "bg-line",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                notificationsEnabled ? "left-6" : "left-1",
              )}
            />
          </button>
        </label>
      </Section>

      {isAuthenticated ? (
        <>
          <Section title="Account">
            {formNotice ? <p className="text-step font-medium text-success">{formNotice}</p> : null}
            {formError ? <p className="text-step font-medium text-danger">{formError}</p> : null}

            <div className="text-step text-ink">
              Signed in as <span className="font-semibold">{user?.email}</span>
            </div>

            {openForm === "password" ? (
              <div className="space-y-3 rounded-xl bg-light-blue p-3">
                <Field label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Field label="New password" type="password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={submitPassword} disabled={busy}>{busy ? "Saving..." : "Update Password"}</Button>
                  <Button variant="outline" onClick={() => setOpenForm(null)}>Cancel</Button>
                </div>
              </div>
            ) : openForm === "email" ? (
              <div className="space-y-3 rounded-xl bg-light-blue p-3">
                <Field label="New email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Field label="Your password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={submitEmail} disabled={busy}>{busy ? "Saving..." : "Update Email"}</Button>
                  <Button variant="outline" onClick={() => setOpenForm(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="w-auto" onClick={() => { setOpenForm("password"); setFormNotice(null); }}>
                  Change password
                </Button>
                <Button variant="outline" className="w-auto" onClick={() => { setOpenForm("email"); setFormNotice(null); }}>
                  Change email
                </Button>
              </div>
            )}
          </Section>

          <Section title="Blocked users">
            {blocked.length === 0 ? (
              <p className="text-step text-muted">Nobody is blocked.</p>
            ) : (
              blocked.map((b) => (
                <div key={b.id} className="flex items-center gap-3">
                  <UserAvatar name={b.name} size={34} />
                  <span className="flex-1 text-step text-ink">{b.name}</span>
                  <button onClick={() => unblock(b.id)} className="rounded-full bg-light-blue px-3.5 py-1.5 text-caption font-semibold text-muted hover:text-ink">
                    Unblock
                  </button>
                </div>
              ))
            )}
          </Section>

          {user?.role === "admin" ? (
            <Section title="Admin">
              <Link href="/admin" className="block text-step font-semibold text-primary hover:underline">
                Review queue → approve group proposals & consultant applications
              </Link>
            </Section>
          ) : null}
        </>
      ) : (
        <Section title="Account">
          <p className="text-step text-muted">Demo mode — sign in to manage a real account.</p>
        </Section>
      )}

      <button
        onClick={handleSignOut}
        className="w-full rounded-2xl border border-danger bg-card py-3.5 text-step font-semibold text-danger hover:bg-light-blue"
      >
        {isAuthenticated ? "Sign Out" : "Exit demo"}
      </button>

      {isAuthenticated ? (
        <p className="text-center">
          <Link href="/settings/delete-account" className="text-caption text-muted underline hover:text-danger">
            Delete my account
          </Link>
        </p>
      ) : null}
    </div>
  );
}
