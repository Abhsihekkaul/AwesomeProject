import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Post } from "../components/ui/PostCard";

// Saved posts persist on-device so the Profile "Saved" tab survives restarts.
const STORAGE_KEY = "healingsathi.savedPosts";

type SavedPostsContextValue = {
  savedPosts: Post[];
  isSaved: (postId: string) => boolean;
  toggleSave: (post: Post) => void;
};

const SavedPostsContext = createContext<SavedPostsContextValue | null>(null);

export const SavedPostsProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setSavedPosts(JSON.parse(raw));
      } catch {
        // Corrupt cache — start fresh rather than crash.
      }
    });
  }, []);

  const toggleSave = useCallback((post: Post) => {
    setSavedPosts((prev) => {
      const next = prev.some((p) => p.id === post.id)
        ? prev.filter((p) => p.id !== post.id)
        : [post, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (postId: string) => savedPosts.some((p) => p.id === postId),
    [savedPosts],
  );

  const value = useMemo(
    () => ({ savedPosts, isSaved, toggleSave }),
    [savedPosts, isSaved, toggleSave],
  );

  return <SavedPostsContext.Provider value={value}>{children}</SavedPostsContext.Provider>;
};

export const useSavedPosts = () => {
  const ctx = useContext(SavedPostsContext);
  if (!ctx) throw new Error("useSavedPosts must be used within a SavedPostsProvider");
  return ctx;
};
