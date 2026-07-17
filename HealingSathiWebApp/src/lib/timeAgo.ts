/**
 * Formats API ISO timestamps into the short relative strings the UI was designed around
 * ("just now", "18m ago", "2h ago", "3d ago", then a date). Dummy data already ships
 * human strings — pass those through untouched.
 */
export const timeAgo = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value); // already a human string

  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};
