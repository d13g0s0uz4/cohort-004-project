import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

interface StarRatingDisplayProps {
  average: number | null;
  count: number;
  className?: string;
}

export function StarRatingDisplay({ average, count, className }: StarRatingDisplayProps) {
  if (average === null || count === 0) return null;

  const rounded = Math.round(average * 10) / 10;

  return (
    <span className={cn("flex items-center gap-1", className)}>
      <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{rounded.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}

interface StarRatingInputProps {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled }: StarRatingInputProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              value !== null && star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}
