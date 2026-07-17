"use client";

import { useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import { useLiveData } from "@/hooks/useLiveData";
import { resourcesApi } from "@/api/resourcesApi";
import { cn } from "@/lib/cn";

type Tip = {
  id: string;
  type: string;
  title: string;
  summary?: string;
  author: string;
  condition: string;
  duration?: string;
};

const DEMO_TIPS: Tip[] = [
  { id: "t1", type: "Article", title: "4-7-8 Breathing Technique", summary: "Helps calm the central nervous system during flare-ups.", author: "Dr. Sarah Chen", condition: "Anxiety", duration: "4 min read" },
  { id: "t2", type: "Article", title: "Pacing Your Energy", summary: "Break large tasks into smaller chunks to avoid the boom-and-bust cycle.", author: "Dr. Priya Patel", condition: "Chronic Pain", duration: "6 min read" },
  { id: "t3", type: "Photo Guide", title: "Gentle Morning Movement", summary: "5-10 minutes of bed-stretching can reduce morning stiffness.", author: "Dr. James Lin", condition: "Fibromyalgia", duration: "5 min" },
];

/** Health tips (the app's HealthTipsScreen) with condition filter chips. */
export default function TipsPage() {
  const [condition, setCondition] = useState<string | null>(null);

  const { data: tips, loading } = useLiveData<Tip[]>(
    ["tips"],
    async () => resourcesApi.getHealthTips(),
    DEMO_TIPS,
  );

  const conditions = Array.from(new Set(tips.map((t) => t.condition)));
  const visible = condition ? tips.filter((t) => t.condition === condition) : tips;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-heading font-bold text-ink">Health Tips</h1>
      <p className="text-step text-muted">Doctor-written guidance for your conditions.</p>

      {conditions.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCondition(null)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-caption font-semibold",
              !condition ? "border-primary bg-primary text-white" : "border-line bg-card text-muted",
            )}
          >
            All
          </button>
          {conditions.map((c) => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-caption font-semibold",
                condition === c ? "border-primary bg-primary text-white" : "border-line bg-card text-muted",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {loading
        ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        : visible.map((tip) => (
            <div key={tip.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center gap-2 text-caption font-semibold">
                <span className="rounded-full bg-light-purple px-2.5 py-0.5 text-primary">{tip.type}</span>
                <span className="text-muted">{tip.condition}</span>
                {tip.duration ? <span className="ml-auto text-muted">{tip.duration}</span> : null}
              </div>
              <h2 className="mt-2 text-step font-bold text-ink">{tip.title}</h2>
              {tip.summary ? <p className="mt-1 text-step leading-snug text-muted">{tip.summary}</p> : null}
              <p className="mt-2 text-caption font-semibold text-muted">By {tip.author}</p>
            </div>
          ))}
      {!loading && visible.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-6 text-center text-step text-muted">
          No tips published yet.
        </p>
      ) : null}
    </div>
  );
}
