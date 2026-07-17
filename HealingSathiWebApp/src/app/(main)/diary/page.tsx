"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

type Entry = { id: string; date: string; text: string };

const STORAGE_KEY = "healingsathi:diary";

/**
 * Healing Diary — deliberately device-only (localStorage), the same
 * private-by-design contract as the app's AsyncStorage diary. Nothing here
 * ever touches the server.
 */
export default function DiaryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time boot from device storage
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      // Corrupt storage → start fresh.
    }
    setLoaded(true);
  }, []);

  const persist = (next: Entry[]) => {
    setEntries(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addEntry = () => {
    const text = draft.trim();
    if (!text) return;
    persist([
      {
        id: `${Date.now()}`,
        date: new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
        text,
      },
      ...entries,
    ]);
    setDraft("");
  };

  const remove = (id: string) => {
    if (window.confirm("Delete this entry? It only exists on this device.")) {
      persist(entries.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-heading font-bold text-ink">Healing Diary</h1>
      <p className="text-step text-muted">
        Private by design — entries live ONLY in this browser, never on our servers.
      </p>

      <div className="rounded-2xl border border-line bg-card p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="How are you feeling today?"
          className="w-full resize-y rounded-xl border border-line bg-light-blue px-3.5 py-2.5 text-step text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <Button className="mt-3" onClick={addEntry} disabled={!draft.trim()}>
          Save Entry
        </Button>
      </div>

      {loaded && entries.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-6 text-center text-step text-muted">
          Your first entry is waiting to be written. 💜
        </p>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-muted">{entry.date}</span>
              <button onClick={() => remove(entry.id)} className="text-caption font-semibold text-danger hover:opacity-80">
                Delete
              </button>
            </div>
            <p className="mt-2 text-step leading-relaxed whitespace-pre-wrap text-ink">{entry.text}</p>
          </div>
        ))
      )}
    </div>
  );
}
