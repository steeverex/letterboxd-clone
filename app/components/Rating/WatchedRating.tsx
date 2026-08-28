"use client";
import React, { Dispatch, SetStateAction } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { createRatingPopup, PopupAction } from "../../utils";
import { RatingInput } from "./RatingInput";

/**
 * Rating control bound to users/{uid}/watched/{movieId}.
 * Rating a film implies watched: the write creates the entry when missing.
 */
export const WatchedRating = ({
  id,
  title,
  poster,
  rating,
  setRating,
  setIsWatched,
  onEvent,
  size,
}: {
  id: string;
  title: string;
  poster: string;
  rating: number | null;
  setRating: Dispatch<SetStateAction<number | null>>;
  setIsWatched?: Dispatch<SetStateAction<boolean>>;
  onEvent?: () => void;
  size?: number;
}) => {
  const write = async (nextRating: number | null) => {
    if (!auth.currentUser) {
      createRatingPopup(title, PopupAction.ERROR);
      return;
    }
    const watchedRef = doc(db, "users", auth.currentUser.uid, "watched", id);
    try {
      const existing = await getDoc(watchedRef);
      const now = new Date().toISOString();
      await setDoc(
        watchedRef,
        existing.exists()
          ? { rating: nextRating, lastWatchedAt: now }
          : {
              movieId: id,
              movieTitle: title,
              moviePoster: poster,
              firstWatchedAt: now,
              lastWatchedAt: now,
              watchCount: 1,
              liked: false,
              rating: nextRating,
              latestReviewId: null,
            },
        { merge: true }
      );
      const written = await getDoc(watchedRef);
      setIsWatched?.(written.exists());
      setRating(written.data()?.rating ?? null);
      onEvent?.();
      createRatingPopup(
        title,
        nextRating == null ? PopupAction.REMOVED : PopupAction.RATED
      );
    } catch (err) {
      console.error("Error updating rating:", err);
      createRatingPopup(title, PopupAction.ERROR);
    }
  };

  return (
    <div className="px-1" onClick={(e) => e.stopPropagation()}>
      <RatingInput
        value={rating}
        size={size}
        onChange={(value) => write(value)}
        onClear={() => write(null)}
        label={`Rate ${title}`}
      />
    </div>
  );
};

export default WatchedRating;
