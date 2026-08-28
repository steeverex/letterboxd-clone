"use client";
import React, { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { createReviewPopup, PopupAction } from "../../utils";
import { MovieReviewCompact } from "../Review/MovieReviewCompact";
import { Review } from "app/types";

export const MovieReviews = ({ movie }) => {
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);

  const submitReview = async (e: any, reviewText: string) => {
    e.preventDefault();
    if (!reviewText || !auth.currentUser) {
      createReviewPopup(PopupAction.ERROR);
      return;
    }
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, "reviews"), {
        uid: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "",
        userPhotoUrl: auth.currentUser.photoURL || "",
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.poster_path,
        rating: null,
        reviewText,
        hasSpoilers: false,
        isRewatch: false,
        createdAt: now,
        updatedAt: now,
        likeCount: 0,
      });
      createReviewPopup(PopupAction.SUCCESS);
      setReview("");
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
          <textarea className="active-outline-none bg-h-grey text-drop-black rounded p-3 focus:outline-none" value={review} onChange={(e) => setReview(e.target.value)} />
          <button type="submit" className="bg-c-grey text-l-white hover:bg-sh-grey hover:text-b-blue rounded p-1 text-base">Send Review</button>
        </form>
      )}
    </div>
  );
};
