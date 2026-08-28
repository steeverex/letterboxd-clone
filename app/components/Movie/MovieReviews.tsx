"use client";
import React, { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { createReviewPopup, PopupAction } from "../../utils";
import { MovieReviewCompact } from "../Review/MovieReviewCompact";
import { RatingInput } from "../Rating/RatingInput";
import { Review } from "app/types";

export const MovieReviews = ({ movie }) => {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // The review rating is the film's rating: it is mirrored onto the watched entry,
  // creating it when absent (rating implies watched). An unrated review never
  // clears a rating the user already gave the film.
  const syncWatchedRating = async (uid: string, newRating: number | null, reviewId: string) => {
    const watchedRef = doc(db, "users", uid, "watched", movie.id);
    const existing = await getDoc(watchedRef);
    const now = new Date().toISOString();
    await setDoc(
      watchedRef,
      existing.exists()
        ? {
            ...(newRating == null ? {} : { rating: newRating }),
            lastWatchedAt: now,
            latestReviewId: reviewId,
          }
        : {
            movieId: movie.id,
            movieTitle: movie.title,
            moviePoster: movie.poster_path,
            firstWatchedAt: now,
            lastWatchedAt: now,
            watchCount: 1,
            liked: false,
            rating: newRating,
            latestReviewId: reviewId,
          },
      { merge: true }
    );
  };

  const submitReview = async (e: any, reviewText: string) => {
    e.preventDefault();
    if (!reviewText || !auth.currentUser) {
      createReviewPopup(PopupAction.ERROR);
      return;
    }
    try {
      const now = new Date().toISOString();
      const created = await addDoc(collection(db, "reviews"), {
        uid: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "",
        userPhotoUrl: auth.currentUser.photoURL || "",
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.poster_path,
        rating,
        reviewText,
        hasSpoilers: false,
        isRewatch: false,
        createdAt: now,
        updatedAt: now,
        likeCount: 0,
      });
      await syncWatchedRating(auth.currentUser.uid, rating, created.id);
      createReviewPopup(PopupAction.SUCCESS);
      setReview("");
      setRating(null);
    } catch (err) {
      console.error("Error saving review:", err);
      createReviewPopup(PopupAction.ERROR);
    }
  };

  useEffect(() => {
    const reviewsQuery = query(collection(db, "reviews"), where("movieId", "==", movie.id), orderBy("createdAt", "desc"));
    return onSnapshot(reviewsQuery, (snapshot) => {
      setReviews(snapshot.docs.map((reviewDoc) => ({
        reviewId: reviewDoc.id,
        ...(reviewDoc.data() as Omit<Review, "reviewId">),
      })));
    }, (err) => {
      console.error("Error fetching reviews:", err);
      setReviews([]);
    });
  }, [movie.id]);

  const handleDelete = async (reviewToDelete: Review) => {
    try {
      await deleteDoc(doc(db, "reviews", reviewToDelete.reviewId));
      createReviewPopup(PopupAction.REMOVED);
    } catch (err) {
      console.error(err);
      createReviewPopup(PopupAction.ERROR);
    }
  };

  return (
    <div className="mt-3 flex w-full flex-col justify-between gap-2 md:ml-[6.5rem] md:w-[50%]">
      {reviews.length > 0 ? reviews.map((r) => <MovieReviewCompact key={r.reviewId} review={r} handleDelete={handleDelete} />) : ""}
      {!reviews.length && auth && <p className="text-sh-grey pt-2 text-base">Write the first review!</p>}
      {!review.length && !auth && <p className="text-sh-grey pt-2 text-base">Login and write the first review!</p>}
      {auth && (
        <form className="flex flex-col gap-2" onSubmit={(e) => submitReview(e, review)}>
          <RatingInput
            value={rating}
            onChange={setRating}
            onClear={() => setRating(null)}
            size={20}
            label="Rate this film"
          />
          <textarea className="active-outline-none bg-h-grey text-drop-black rounded p-3 focus:outline-none" value={review} onChange={(e) => setReview(e.target.value)} />
          <button type="submit" className="bg-c-grey text-l-white hover:bg-sh-grey hover:text-b-blue rounded p-1 text-base">Send Review</button>
        </form>
      )}
    </div>
  );
};
