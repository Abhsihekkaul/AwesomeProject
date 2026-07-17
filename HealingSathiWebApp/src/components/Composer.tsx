"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";
import { fileToCompressedDataUri, MAX_PHOTOS_PER_POST } from "@/lib/compressImage";
import { cn } from "@/lib/cn";

/**
 * The app's CreatePostScreen as a modal: title + text, up to 10 photos
 * (file picker OR drag-and-drop, compressed to the app's exact policy),
 * multi-destination chips (My Feed + every joined group), content warning.
 */
export default function Composer({
  open,
  onClose,
  onPosted,
  presetGroupId,
}: {
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
  presetGroupId?: string;
}) {
  const { user, isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [toFeed, setToFeed] = useState(!presetGroupId);
  const [groupIds, setGroupIds] = useState<string[]>(presetGroupId ? [presetGroupId] : []);
  const [contentWarning, setContentWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: groups } = useLiveData<{ id: string; name: string }[]>(
    ["groups"],
    async () =>
      (await resourcesApi.getGroups()).filter(
        (g: { id: string; name: string; joined?: boolean }) => g.joined,
      ),
    [],
  );

  if (!open) return null;

  const addFiles = async (files: FileList | File[]) => {
    setError(null);
    const room = MAX_PHOTOS_PER_POST - images.length;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length > room) {
      setError(`A post can carry at most ${MAX_PHOTOS_PER_POST} photos`);
    }
    try {
      const converted = await Promise.all(list.slice(0, room).map(fileToCompressedDataUri));
      setImages((prev) => [...prev, ...converted]);
    } catch {
      setError("One of those images couldn't be read");
    }
  };

  const toggleGroup = (id: string) =>
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  const submit = async () => {
    const text = content.trim();
    if (!text) {
      setError("Write something first");
      return;
    }
    if (!toFeed && groupIds.length === 0) {
      setError("Pick at least one destination");
      return;
    }
    if (!isAuthenticated) {
      setError("Demo mode can't publish — sign in to post for real");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resourcesApi.createPost({
        title: title.trim() || undefined,
        content: text,
        images,
        toFeed,
        groupIds,
        contentWarning,
      });
      setTitle("");
      setContent("");
      setImages([]);
      setContentWarning(false);
      onPosted();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't publish the post"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-5"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-heading font-bold text-ink">Create post</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <UserAvatar name={user?.name ?? "You"} src={user?.avatarUrl} size={38} />
          <div>
            <p className="text-step font-semibold text-ink">{user?.name ?? "Demo"}</p>
            <p className="text-caption text-muted">
              To: {[...(toFeed ? ["My Feed"] : []), ...groups.filter((g) => groupIds.includes(g.id)).map((g) => g.name)].join(", ") || "nowhere yet"}
            </p>
          </div>
        </div>

        {error ? <p className="mt-3 text-step font-medium text-danger">{error}</p> : null}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={200}
          className="mt-4 w-full rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience..."
          maxLength={5000}
          rows={5}
          className={cn(
            "mt-3 w-full resize-y rounded-xl border bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none",
            dragOver ? "border-primary" : "border-line",
          )}
        />
        <p className="mt-1 text-right text-caption text-muted">{content.length}/5000</p>

        {/* Photos */}
        {images.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((src, i) => (
              <span key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />
                <button
                  aria-label="Remove photo"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-card"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-light-purple px-3 py-2 text-step font-semibold text-primary hover:opacity-90"
          >
            <Icon name="upload" size={16} /> Photos {images.length}/{MAX_PHOTOS_PER_POST}
          </button>
          <span className="text-caption text-muted">or drag &amp; drop into the text box</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Destinations */}
        <p className="mt-4 text-step font-semibold text-ink">Share to</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setToFeed(!toFeed)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-caption font-semibold",
              toFeed ? "border-primary bg-primary text-white" : "border-line bg-card text-muted",
            )}
          >
            My Feed
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => toggleGroup(g.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-caption font-semibold",
                groupIds.includes(g.id)
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-card text-muted",
              )}
            >
              {g.name}
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 text-step text-ink">
          <input
            type="checkbox"
            checked={contentWarning}
            onChange={(e) => setContentWarning(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Add a content warning
        </label>

        <Button className="mt-5" onClick={submit} disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}
