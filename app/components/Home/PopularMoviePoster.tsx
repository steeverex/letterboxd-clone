import React, { useEffect, useState } from "react";

import Image from "next/image";
import FavouriteButton from "../Buttons/FavoriteButton";
import { WatchButton } from "../Buttons/WatchButton";
import Link from "next/link";
import { auth, db } from "app/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export const PopularMoviePoster = ({
  movie,
  compact = false,
}: {
  movie: any;
  compact?: boolean;
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // @to-do create hook
  const [isFavourite, setIsFavourite] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  const setInitialMovieStatuses = async () => {
    if (!auth || !auth.currentUser) return;
    const watchedEntry = await getDoc(doc(db, "users", auth.currentUser.uid, "watched", movie.id));
    setIsWatched(watchedEntry.exists());
    setIsFavourite(watchedEntry.data()?.liked === true);
  };

  useEffect(() => {
    if (auth && auth.currentUser) {
      setInitialMovieStatuses();
    }
  }, [movie, auth.currentUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsHovered(window.innerWidth <= 768);
      setIsMobile(window.innerWidth <= 768);
    };

    // Set initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={
        (compact ? "w-[32.33%] " : "") +
        `hover:border-3 border-pb-grey/25 hover:border-pb-grey relative aspect-[2/3] basis-1/6 rounded border border-solid shadow-[0_0_1px_1px_rgba(20,24,28,1)] hover:cursor-pointer hover:rounded`
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsHovered(false);
        }
      }}
      key={movie.id}
    >
      <Link href={"/movie/" + movie.id}>
        <div className="relative h-full w-full">
          <Image
            src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
            fill
            alt={movie.title}
            className="rounded border object-cover"
          />
        </div>
      </Link>

      {isHovered && (
        <div
          className="absolute left-[30%] top-[80%] z-10 flex items-center rounded p-0.5 md:left-[25%] md:top-[75%]"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <FavouriteButton
            id={movie.id}
            title={movie.title}
            poster={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
            isFavourite={isFavourite}
            setIsFavourite={setIsFavourite}
            setIsWatched={setIsWatched}
          />
          <WatchButton
            id={movie.id}
            title={movie.title}
            poster={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
            isWatched={isWatched}
            setIsWatched={setIsWatched}
          />
        </div>
      )}
    </div>
  );
};
