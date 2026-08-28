import React, { useEffect, useState } from "react";
import Image from "next/image";
import { auth } from "../../firebase/firebase";

import Link from "next/link";
import { Review } from "app/types";

export const MovieReviewCompact = ({
  review,
  handleDelete,
}: {
  review: Review;
  handleDelete?: (review: Review) => Promise<void>;
}) => {
  const [avatar, setAvatar] = useState("");
  const [isAuthor, setIsAuthor] = useState(false);

  const avatarUrl = review.userPhotoUrl || review.userURL || "";
  const displayReviewText = review.reviewText || review.review || "";
  const displayTimestamp = review.createdAt || review.timestamp;

  useEffect(() => {
    // Hardcoded fix for the bad demo img when i used the discord CDN :/
    if (avatarUrl.includes("discord")) {
      setAvatar(
        "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=3098&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      );
    } else {
      setAvatar(avatarUrl);
    }

    // can show delete button
    if (auth.currentUser) {
      setIsAuthor(auth.currentUser.uid === review.uid);
    }
  }, [avatarUrl, review.uid]);

  return (
    <div className="flex w-full">
      {avatar && (
        <Image
          src={avatar}
          className="border-sb-grey mr-2 max-h-[30px] max-w-[30px] rounded-full border border-solid"
          height={30}
          width={30}
          alt="Avatar"
        />
      )}
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-wrap items-baseline gap-1">
            <Link
              href={"/profile/" + review.uid}
              className="text-p-white hover:text-hov-blue"
            >
              {review.userName}
            </Link>
            {displayTimestamp && (
              <p className="text-sh-grey text-xs">, {displayTimestamp}</p>
            )}
          </div>
          {isAuthor && handleDelete && (
            <p
              className="hover:text-sh-grey hover:cursor-pointer"
              onClick={() => handleDelete(review)}
            >
              x
            </p>
          )}
        </div>{" "}
        <p className="text-sh-grey pt-2">{displayReviewText}</p>
      </div>
    </div>
  );
};
