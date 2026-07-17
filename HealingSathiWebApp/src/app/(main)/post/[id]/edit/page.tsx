"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { resourcesApi } from "@/api/resourcesApi";
import { apiErrorMessage } from "@/api/http";

/**
 * Edit your own post (title + text) — the app's EditPostScreen. Photos and the
 * posting destination stay fixed, same rule the backend enforces.
 */
export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    resourcesApi
      .getPost(id)
      .then(({ post }) => {
        setTitle(post.title ?? "");
        setContent(post.content ?? "");
        setLoaded(true);
      })
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load the post")));
  }, [id, isAuthenticated]);

  const save = async () => {
    const text = content.trim();
    if (!text) {
      setError("The post can't be empty — write something, or delete it instead.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await resourcesApi.updatePost(id, { title: title.trim(), content: text });
      router.back();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the changes"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-line bg-card p-5">
        <h1 className="text-heading font-bold text-ink">Edit post</h1>
        {error ? <p className="mt-3 text-step font-medium text-danger">{error}</p> : null}
        {!isAuthenticated ? (
          <p className="mt-3 text-step text-muted">Sign in to edit your posts.</p>
        ) : !loaded && !error ? (
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-light-blue" />
        ) : (
          <>
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
              maxLength={5000}
              rows={7}
              className="mt-3 w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <p className="mt-2 text-caption text-muted">
              Photos and the place you posted to can&apos;t be changed — delete and repost for that.
            </p>
            <div className="mt-4 flex gap-3">
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
