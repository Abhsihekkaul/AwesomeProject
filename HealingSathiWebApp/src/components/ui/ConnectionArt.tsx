/**
 * Decorative line-art: a small circle of people bonded together (the "sathi"
 * idea) — heads + shoulders joined by soft arcs with hearts on the links.
 * Pure SVG in currentColor, so it tints with the theme and stays crisp at any
 * size. Rendered at low opacity behind the auth card.
 */
export default function ConnectionArt({ className }: { className?: string }) {
  const person = (x: number, y: number, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-14" r="10" fill="currentColor" />
      <path d="M -16 14 a 16 16 0 0 1 32 0 z" fill="currentColor" />
    </g>
  );

  const heart = (x: number, y: number, s = 1) => (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M 0 3 C -1 0 -5 -1 -5 -4 a 2.6 2.6 0 0 1 5 -1 a 2.6 2.6 0 0 1 5 1 C 5 -1 1 0 0 3 z"
      fill="currentColor"
    />
  );

  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label="People connected in a circle of support"
      className={className}
    >
      {/* connecting arcs */}
      <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8">
        <path d="M 80 90 Q 140 40 200 62" />
        <path d="M 200 62 Q 265 40 320 92" />
        <path d="M 320 92 Q 355 160 305 220" />
        <path d="M 305 220 Q 200 275 95 218" />
        <path d="M 95 218 Q 45 155 80 90" />
        <path d="M 80 90 Q 200 150 320 92" />
        <path d="M 95 218 Q 200 140 305 220" />
      </g>

      {/* hearts riding the links */}
      {heart(140, 60, 1.4)}
      {heart(263, 60, 1.4)}
      {heart(342, 158, 1.4)}
      {heart(200, 251, 1.6)}
      {heart(56, 156, 1.4)}
      {heart(200, 122, 1.8)}

      {/* the people */}
      {person(80, 90, 1.15)}
      {person(200, 62, 1.3)}
      {person(320, 92, 1.15)}
      {person(305, 220, 1.2)}
      {person(95, 218, 1.2)}
    </svg>
  );
}
