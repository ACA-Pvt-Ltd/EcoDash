/**
 * Fixed layer behind the midnight glass UI: a midnight gradient with a faint
 * grid for depth. Purely decorative — no pointer events, hidden from
 * assistive tech.
 */
export function GlassBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-midnight-900)_0%,var(--color-midnight-950)_100%)]" />
      {/* Faint grid for depth */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-white) 1px, transparent 1px), linear-gradient(90deg, var(--color-white) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
