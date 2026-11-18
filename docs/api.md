# REST API

Base path: `/api`. All collection endpoints require `Authorization: Bearer <Supabase access token>`. Send JSON bodies with `Content-Type: application/json`. The backend verifies the token with Supabase on each request.

## Responses

Success responses contain `success: true`, `message` and `data`. Errors contain `success: false` and `message`, without `data`. `debugMessage` is included only in development. The unauthenticated health checks are an exception: `GET /api/health` and `GET /api/health/db` return `{ "status": "ok" }`, and the database check returns 503 with `{ "status": "error" }` when its query fails.

```json
{
  "success": true,
  "message": "Collection created successfully",
  "data": { "id": "collection-id", "name": "Watch next" }
}
```

## Endpoints

Paths below are relative to `/api`. `collection_id` identifies a collection; title IDs are positive integer TMDB IDs, including `movie_id` in notes and removal paths for TV shows.

| Method | Path                                                             | Purpose                                                  | Notable status codes                                                      |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| GET    | `/health`                                                        | Health check, no authentication                          | 200                                                                       |
| GET    | `/health/db`                                                     | Database health check, no authentication                 | 200; 503 database query failed or timed out                               |
| POST   | `/collections`                                                   | Create a collection with `{ "name": "Watch next" }`      | 201; 400 blank or duplicate name                                          |
| GET    | `/collections`                                                   | List caller's collections                                | 200                                                                       |
| DELETE | `/collections/:collection_id`                                    | Delete an owned collection and its entries               | 200; 404 missing or inaccessible                                          |
| GET    | `/collections/latest_movies`                                     | Latest saved titles for the caller                       | 200                                                                       |
| POST   | `/collections/:collection_id/movies`                             | Add a movie or TV show                                   | 201 new; 200 already saved; 400 invalid body; 404 inaccessible collection |
| GET    | `/collections/:collection_id/movies`                             | Get collection metadata and its titles                   | 200; 404 missing or inaccessible                                          |
| POST   | `/collections/:collection_id/movies/:movie_id/notes`             | Replace the entry's notes                                | 200; 400 invalid body or title ID; 404 no matching owned entry            |
| DELETE | `/collections/:collection_id/movies/:movie_id?is_tv_show=false`  | Remove an entry                                          | 200 even if absent; 400 invalid title ID; 404 inaccessible collection     |
| GET    | `/collections/check_exist/:movie_or_tv_show_id?is_tv_show=false` | List caller's collections containing a title, with notes | 200; 400 invalid title ID                                                 |

## Request bodies

Create takes a nonblank `name`, trimmed before saving; duplicate names are compared without case.

Add a movie:

```json
{
  "is_tv_show": false,
  "movie_id": 550,
  "title": "Fight Club",
  "poster_path": null,
  "notes": "Watch next",
  "rating": 8.4,
  "rating_count": 100,
  "release_date": "1999-10-15"
}
```

For TV, send `is_tv_show: true` and `tv_show_id` instead of `movie_id`. A nonblank `title`, the matching positive integer ID and a JSON boolean `is_tv_show` are required. The other fields are optional: `rating` is a number or numeric string from 0 to 10, `rating_count` a non-negative integer and `release_date` a valid `YYYY-MM-DD` date; null is accepted for each. `poster_path` accepts a string, null or omission; blank strings become null, and other types return 400.

Save notes with `{ "is_tv_show": false, "notes": "Watch again" }`. Notes must be a string and are trimmed, also when adding; omitted or empty notes clear the text. A successful save returns 200 and the updated entry.

## Client behavior

- In request bodies, `is_tv_show` must be a JSON boolean; strings such as `"false"` return 400. In query strings, use `true` or `false`; only the exact string `true` selects TV, with omission and other values selecting movies.
- Add and remove are idempotent. Repeated adds return the existing entry with its notes, including concurrent unique-index conflicts. Repeated removal succeeds while the collection remains accessible. Removal leaves the shared title record intact.
- Collection lists sort by title count, then latest update; detail titles are newest first. Detail and latest-title responses expose a unified `id` and `is_tv_show`. Containing-collection results contain `collection_id`, `collection_name` and `notes`.
- Missing, malformed, invalid or expired authentication returns 401. Missing or inaccessible owned resources return 404; ownership lookup failures also return 404. Unknown API paths return JSON 404.
- Invalid validated fields and malformed JSON return 400. Database write/read failures generally return 500 with an operation-level message; details appear only in development. Unexpected server errors return 500 with a generic message. The server refuses to start with an unsupported `FAVMOV_NODE_ENV`.
