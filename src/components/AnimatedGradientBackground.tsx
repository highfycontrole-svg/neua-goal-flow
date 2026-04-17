interface AnimatedGradientBackgroundProps {
  children: React.ReactNode;
}

/**
 * Static CSS-only background. The previous version listened to mousemove
 * and animated two blurred motion.divs at 60fps, which caused jank on
 * mid/low-end devices. This version keeps the visual feel via pure CSS.
 */
export function AnimatedGradientBackground({ children }: AnimatedGradientBackgroundProps) {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 20%, hsl(217 95% 62% / 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, hsl(217 95% 62% / 0.05) 0%, transparent 60%)
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
