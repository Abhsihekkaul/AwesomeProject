const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Clamps a client-supplied `first` argument so a single query can't request
// an unbounded number of rows (a cheap DoS vector otherwise).
export const clampFirst = (first: number | undefined | null): number => {
  if (!first || first <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(first, MAX_PAGE_SIZE);
};
