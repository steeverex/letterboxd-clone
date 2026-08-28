// ============================================================================
// TMDB-sourced movie shape
// ============================================================================
export interface Movie {
  id: string;
  title: string;
  backdrop_path: string;
  poster_path: string;
  release_date?: string;
}

// Denormalized snapshot embedded in our own docs — avoids N extra TMDB calls
// to render a poster+title on list/profile pages.
export interface MovieSnapshot {
  movieId: string;
  movieTitle: string;
  moviePoster: string;
}

// ============================================================================
// users/{uid}
// ============================================================================
export interface UserStats {
  watchedCount: number;
  reviewCount: number;
  followerCount: number;
  followingCount: number;
  listCount: number;
}

export interface UserProfile {
  uid: string;
  username: string; // unique, lowercase, drives /profile/[username]
  name: string;
  bio: string;
  photoUrl: string;
  createdAt: string; // ISO
  stats: UserStats;
}

// ============================================================================
// users/{uid}/watched/{movieId} — doc ID = movieId (O(1) "have I watched this")
// Current/aggregate state per film. Individual watch events live in diary/.
// ============================================================================
export interface WatchedEntry extends MovieSnapshot {
  rating: number | null;   // 1–10, odd = half-star (Letterboxd's 0.5–5 scale ×2)
  liked: boolean;
  firstWatchedAt: string;  // ISO, immutable
  lastWatchedAt: string;   // ISO, bumped on rewatch
  watchCount: number;
  latestReviewId: string | null; // -> reviews/{id}
}

// ============================================================================
// users/{uid}/diary/{entryId} — one doc per LOG EVENT (rewatch-capable)
// ============================================================================
export interface DiaryEntry extends MovieSnapshot {
  rating: number | null;
  liked: boolean;
  isRewatch: boolean;
  loggedDate: string;      // ISO date, user-editable ("watched on")
  createdAt: string;       // ISO, actual log timestamp
  reviewText: string | null; // inline short text
  reviewId: string | null;   // set if promoted to a full reviews/ doc
}

// ============================================================================
// users/{uid}/watchlist/{movieId} — doc ID = movieId
// ============================================================================
export interface WatchlistEntry extends MovieSnapshot {
  addedAt: string;
}

// ============================================================================
// users/{uid}/lists/{listId}
// users/{uid}/lists/{listId}/items/{movieId}
// (Phase 5+, included now so schema doesn't need to change later)
// ============================================================================
export interface FilmList {
  listId: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  filmCount: number;
}

export interface FilmListItem extends MovieSnapshot {
  addedAt: string;
  rank: number;
}

// ============================================================================
// reviews/{reviewId} — TOP-LEVEL, single source of truth.
// Replaces old dual-write into users.reviews[] + movies/{id}.reviews[].
// Query: where('movieId','==',x).orderBy('createdAt','desc')  -> film page
//        where('uid','==',x).orderBy('createdAt','desc')      -> profile page
// Requires composite indexes: (movieId, createdAt), (uid, createdAt)
// ============================================================================
export interface Review extends MovieSnapshot {
  reviewId: string;
  uid: string;
  userName: string;
  userPhotoUrl: string;
  rating: number | null;
  reviewText: string;
  hasSpoilers: boolean;
  isRewatch: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;

  /** @deprecated Legacy backward compatibility properties */
  movieID?: number | string;
  userURL?: string;
  review?: string;
  timestamp?: string;
}

// reviews/{reviewId}/likes/{uid} — existence-only marker
export interface ReviewLike {
  uid: string;
  createdAt: string;
}

// ============================================================================
// follows/{followerUid}_{followingUid} — composite ID = O(1) "does A follow B"
// (Phase 6+, included now for schema stability)
// ============================================================================
export interface Follow {
  followerUid: string;
  followingUid: string;
  createdAt: string;
}

// ============================================================================
// films/{movieId} — optional aggregate cache, NOT a TMDB copy.
// Updated incrementally via increment() when a rating/watch lands.
// ============================================================================
export interface FilmAggregate {
  movieId: string;
  avgRating: number;
  ratingCount: number;
  watchedCount: number;
  reviewCount: number;
  lastUpdated: string;
}

// ============================================================================
// Legacy Type Aliases (Temporary backward compatibility for unrefactored UI components)
// ============================================================================
export interface UserReview {
  reviewId?: string;
  movieId?: string;
  movieID?: string;
  createdAt?: string;
  timestamp?: string;
  reviewText?: string;
  review?: string;
}

export interface UserFavourite {
  movieID: string;
}

export interface UserWatched {
  movieID: string;
}

export interface User {
  uid: string;
  name: string;
  bio: string;
  photoUrl: string;
  favourites: UserFavourite[];
  watched: UserWatched[];
  reviews: UserReview[];
  stats?: UserStats;
}
