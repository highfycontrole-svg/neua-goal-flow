import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /** Spinner size. Defaults to 'md' (h-10 w-10). */
  size?: "sm" | "md" | "lg";
  /** Optional extra classes for the spinner element itself. */
  className?: string;
  /** Optional wrapper classes. Defaults to a centered flex container with vertical padding. */
  wrapperClassName?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

/**
 * Standardized loading spinner. Replaces ad-hoc `animate-spin` divs across the app.
 * Visual: same as the previous inline spinners — a primary-colored ring with a
 * transparent top edge.
 */
export function LoadingSpinner({
  size = "md",
  className,
  wrapperClassName,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-12",
        wrapperClassName,
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-primary border-t-transparent",
          sizeMap[size],
          className,
        )}
        role="status"
        aria-label="Carregando"
      />
    </div>
  );
}

export default LoadingSpinner;