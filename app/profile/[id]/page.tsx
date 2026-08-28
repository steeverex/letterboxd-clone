"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "app/firebase/firebase";
import { ProfileBio } from "app/components/Profile/ProfileBio";
import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import { ProfileMoviesHighlight } from "app/components/Profile/ProfileMoviesHighlight";
import { ProfileReviews } from "app/components/Profile/ProfileReviews";
import { Review, UserProfile, WatchedEntry } from "app/types";
import { Footer } from "app/components/Navigation/Footer";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserProfile>({} as UserProfile);
  const [isAuthor, setIsAuthor] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [favourites, setFavourites] = useState<WatchedEntry[]>([]);
  const [watched, setWatched] = useState<WatchedEntry[]>([]);

  const router = useRouter();

  const initProfilePage = async () => {
    setLoading(true);

    const userSnap = await getDoc(doc(db, "users", id));
    if (userSnap.exists()) {
      const user = userSnap.data() as UserProfile;
      setUser(user);

      await Promise.all([setMovies(), setReviewsForProfile()]);
    }

    setLoading(false);
  };

  const setMovies = async () => {
    const watchedRef = collection(db, "users", id, "watched");
    const [watchedSnap, favouritesSnap] = await Promise.all([
      getDocs(watchedRef),
      getDocs(query(watchedRef, where("liked", "==", true))),
    ]);
    setWatched(watchedSnap.docs
      .map((entry) => entry.data() as WatchedEntry)
      .sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt)));
    setFavourites(favouritesSnap.docs
      .map((entry) => entry.data() as WatchedEntry)
      .sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt)));
  };

  const setReviewsForProfile = async () => {
    const reviewsSnap = await getDocs(query(collection(db, "reviews"), where("uid", "==", id)));
    setReviews(
      reviewsSnap.docs
        .map((reviewDoc) => ({ reviewId: reviewDoc.id, ...(reviewDoc.data() as Omit<Review, "reviewId">) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6)
    );
  };

  const onEvent = () => {
    setMovies();
  };

  useEffect(() => {
    initProfilePage();
  }, [id, router]);

  useEffect(() => {
    setIsAuthor(auth.currentUser?.uid === user.uid);
  }, [auth.currentUser, user]);

  if (loading) return <p>Loading...</p>;
  if (!loading && !user) return <p>Error loading user.</p>;

  return (
    <>
      <LayoutNavbar />
      <div className="site-body min-h-[78vh] py-5">
        <div className="flex flex-col px-4 font-['Graphik'] md:mx-auto md:my-0 md:w-[950px] md:py-8">
          <ProfileBio user={user} isAuthor={isAuthor} favouriteCount={favourites.length} watchedCount={watched.length} />
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div>
              <ProfileMoviesHighlight
                user={user}
                movies={favourites}
                watched={watched}
                favourites={favourites}
                type="favourites"
                onEvent={onEvent}
              />

              <ProfileMoviesHighlight
                user={user}
                movies={watched}
                watched={watched}
                favourites={favourites}
                type="watched"
                onEvent={onEvent}
              />
            </div>

            <ProfileReviews reviews={reviews} />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
