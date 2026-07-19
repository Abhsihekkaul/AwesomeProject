"use client";

import { useState } from "react";
import UserAvatar, { AVATAR_COLORS } from "@/components/ui/UserAvatar";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { authApi } from "@/api/authApi";
import { apiErrorMessage } from "@/api/http";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

/**
 * The app's EditProfileScreen, web edition: display name, avatar color and
 * health conditions, saved together via PATCH /auth/me. Mount only while
 * open (parent conditionally renders) so state re-seeds from the user.
 * Bottom sheet on phones, centered dialog on desktop — same as ShareDialog.
 */
export default function EditProfileDialog({ onClose }: { onClose: () => void }) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? "purple");
  const [conditions, setConditions] = useState<string[]>(user?.conditions ?? []);
  const [conditionDraft, setConditionDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCondition = () => {
    const value = conditionDraft.trim();
    if (value && !conditions.includes(value)) setConditions([...conditions, value]);
    setConditionDraft("");
  };

  const save = async () => {
    if (!name.trim()) {
      setError("Your profile needs a display name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      updateUser(await authApi.updateMe({ name: name.trim(), avatarColor, conditions }));
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save"));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto animate-fade-up rounded-t-2xl border border-line bg-card p-5 shadow-lift sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-subtitle font-bold text-ink">Edit profile</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-full px-2 py-0.5 text-body text-muted hover:bg-light-purple hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <UserAvatar name={name.trim() || "?"} src={user?.avatarUrl} color={avatarColor} size={72} />
        </div>

        <div className="mt-4 space-y-4">
          <Field
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">Avatar color</span>
            <div className="flex gap-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c.key}
                  aria-label={`${c.key} avatar color`}
                  aria-pressed={avatarColor === c.key}
                  onClick={() => setAvatarColor(c.key)}
                  style={{ backgroundColor: c.hex }}
                  className={cn(
                    "h-9 w-9 rounded-full transition-transform hover:scale-110",
                    avatarColor === c.key && "ring-[3px] ring-ink ring-offset-2 ring-offset-card",
                  )}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-ink">My conditions</span>
            <p className="mb-2 text-caption text-muted">Click a condition to remove it.</p>
            {conditions.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setConditions(conditions.filter((x) => x !== c))}
                    className="rounded-full bg-light-purple px-3 py-1 text-caption font-semibold text-primary hover:bg-primary hover:text-white"
                  >
                    {c} ✕
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field
                  label="Add a condition"
                  value={conditionDraft}
                  onChange={(e) => setConditionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCondition();
                    }
                  }}
                  placeholder="e.g. Fibromyalgia"
                />
              </div>
              <Button variant="outline" className="w-auto" onClick={addCondition}>
                Add
              </Button>
            </div>
          </div>

          {error ? <p className="text-caption font-semibold text-danger">{error}</p> : null}

          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
