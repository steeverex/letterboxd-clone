import React, { Dispatch } from "react";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import watchIcon from "./watched.png";
import remWatched from "./remWatched.png";
import Image from "next/image";
import { auth, db } from "../../firebase/firebase";
import { createWatchedPopup, PopupAction } from "../../utils";

export const WatchButton = ({ id, title, poster, isWatched, setIsWatched, onEvent }: {
  id: string; title: string; poster: string; isWatched: boolean;
  setIsWatched: Dispatch<React.SetStateAction<boolean>>; onEvent?: () => void;
}) => {
  const onWatched = async () => {
    if (!auth.currentUser) { createWatchedPopup(title, PopupAction.ERROR); return; }
    const watchedRef = doc(db, "users", auth.currentUser.uid, "watched", id);
    try {
      if (isWatched) {
        const entry = await getDoc(watchedRef);
        const data = entry.data();
        if (data?.rating != null || data?.latestReviewId != null) await setDoc(watchedRef, { liked: false }, { merge: true });
        else await deleteDoc(watchedRef);
      } else {
        const now = new Date().toISOString();
        await setDoc(watchedRef, {
          movieId: id, movieTitle: title, moviePoster: poster, firstWatchedAt: now,
          lastWatchedAt: now, watchCount: 1, liked: false, rating: null, latestReviewId: null,
        }, { merge: true });
      }
      setIsWatched(!isWatched);
      onEvent?.();
      createWatchedPopup(title, isWatched ? PopupAction.REMOVED : PopupAction.WATCHED);
    } catch (err) { console.error("Error updating watched status:", err); createWatchedPopup(title, PopupAction.ERROR); }
  };
  return <div onClick={onWatched} className="p-2"><Image src={isWatched ? remWatched : watchIcon} width={20} height={20} alt={isWatched ? "Remove movie from watched icon" : "Add movie to watched icon"} aria-label={isWatched ? "Remove movie from watched list" : "Add movie to watched list"} /></div>;
};
