import React, { Dispatch, SetStateAction } from "react";
import { doc, setDoc } from "firebase/firestore";
import favIcon from "./fav.png";
import removeFavIcon from "./remFav.png";
import Image from "next/image";
import { auth, db } from "../../firebase/firebase";
import { createFavouritePopup, PopupAction } from "../../utils";

export const FavouriteButton = ({ id, title, poster, isFavourite, setIsFavourite, setIsWatched, onEvent }: {
  id: string; title: string; poster: string; isFavourite: boolean;
  setIsFavourite: Dispatch<SetStateAction<boolean>>; setIsWatched?: Dispatch<SetStateAction<boolean>>; onEvent?: () => void;
}) => {
  const onFavourite = async () => {
    if (!auth.currentUser) { createFavouritePopup(title, PopupAction.ERROR); return; }
    const watchedRef = doc(db, "users", auth.currentUser.uid, "watched", id);
    const now = new Date().toISOString();
    try {
      await setDoc(watchedRef, isFavourite ? { liked: false } : {
        movieId: id, movieTitle: title, moviePoster: poster, firstWatchedAt: now,
        lastWatchedAt: now, watchCount: 1, liked: true, rating: null, latestReviewId: null,
      }, { merge: true });
      setIsFavourite(!isFavourite);
      if (!isFavourite) setIsWatched?.(true);
      onEvent?.();
      createFavouritePopup(title, isFavourite ? PopupAction.REMOVED : PopupAction.FAVOURITE);
    } catch (err) { console.error("Error updating favourite:", err); createFavouritePopup(title, PopupAction.ERROR); }
  };
  return <div className="p-2" onClick={onFavourite}><Image src={isFavourite ? removeFavIcon : favIcon} width={20} height={20} alt={isFavourite ? "Remove movie from favorites icon" : "Add movie to favorites icon"} aria-label={isFavourite ? "Remove movie from favorites list" : "Add movie to favorites list"} /></div>;
};
export default FavouriteButton;
