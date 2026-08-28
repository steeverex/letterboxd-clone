"use client";
import React, { useState } from "react";

// Ratings are stored as 1–10 integers (see WatchedEntry/Review in app/types.ts).
// The UI renders them as five stars on Letterboxd's 0.5–5 scale: score = stars × 2.
const STARS = 5;
const MAX_SCORE = STARS * 2;

export const toStars = (score: number | null) => (score == null ? 0 : score / 2);

export const RatingInput = ({
  value,
  onChange,
  onClear,
  readOnly = false,
  size = 16,
  label,
}: {
  value: number | null;
  onChange?: (value: number) => void;
  onClear?: () => void;
  readOnly?: boolean;
  size?: number;
  label?: string;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value ?? 0;

  const select = (score: number) => {
    if (readOnly) return;
    onChange?.(score);
  };

  return (
    <div className="flex items-center gap-1" aria-label={label || "Rating"}>
      <div
        className="flex"
        onMouseLeave={() => setHovered(null)}
        role={readOnly ? "img" : "radiogroup"}
        aria-label={
          value == null ? "Not rated" : `Rated ${toStars(value)} out of ${STARS} stars`
        }
      >
        {Array.from({ length: STARS }, (_, starIndex) => {
          const fill = Math.min(Math.max(shown - starIndex * 2, 0), 2) / 2;
          return (
            <span
              key={starIndex}
              className="relative inline-block"
              style={{ width: size, height: size }}
            >
              <Star fill={fill} size={size} />
              {!readOnly &&
                [1, 2].map((half) => {
                  const score = starIndex * 2 + half;
                  return (
                    <button
                      key={half}
                      type="button"
                      role="radio"
                      aria-checked={value === score}
                      aria-label={`${score / 2} star${score === 2 ? "" : "s"}`}
                      className="absolute top-0 h-full w-1/2 cursor-pointer bg-transparent p-0"
                      style={{ left: half === 1 ? 0 : "50%" }}
                      onMouseEnter={() => setHovered(score)}
                      onClick={() => select(score)}
                    />
                  );
                })}
            </span>
          );
        })}
      </div>
      {!readOnly && onClear && value != null && (
        <button
          type="button"
          className="text-sh-grey hover:text-p-white text-xs"
          aria-label="Clear rating"
          onClick={() => {
            setHovered(null);
            onClear();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

// `fill` is 0, 0.5 or 1 — a clipped overlay gives the half-star look.
const Star = ({ fill, size }: { fill: number; size: number }) => (
  <span className="relative block" style={{ width: size, height: size }}>
    <Glyph size={size} color="#455565" />
    <span
      className="absolute left-0 top-0 block overflow-hidden"
      style={{ width: `${fill * 100}%`, height: size }}
    >
      <Glyph size={size} color="#00e054" />
    </span>
  </span>
);

const Glyph = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill={color}
    aria-hidden="true"
    className="block"
  >
    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
  </svg>
);

export const isValidScore = (score: number) =>
  Number.isInteger(score) && score >= 1 && score <= MAX_SCORE;

export default RatingInput;
