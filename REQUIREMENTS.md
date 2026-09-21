# FavMov — Product Requirements Document

> **Purpose of this document**
> This is a complete, implementation-agnostic specification of the FavMov product, reverse-engineered from the existing frontend and backend code. It is written to be handed to an AI coding agent as a build prompt: everything needed to rebuild the product from scratch — with the same feature set — on any technology stack.
>
> **On technology**
> This document is deliberately stack-agnostic — no language, framework, database, hosting or UI toolkit is prescribed — with **two deliberate exceptions**: **TMDB** (The Movie Database) and **Supabase**. These two are named and specified in detail because they are not implementation details. They determine what data the product can show, what its records look like, how identity works, and where the security boundary sits. A rebuild that swaps either one is a different project; a rebuild that swaps everything else is the same product. See §1.6.
>
> **How to read it**
> - Sections 1–5 define *what the product is* and *how a user moves through it*.
> - Section 6 is the normative feature-by-feature specification. Each feature has behaviours and acceptance criteria.
> - Sections 7–9 cover the conceptual data model and cross-cutting rules.
> - Section 10 lists defects and gaps found in the current build.
> - Section 11 contains **non-binding improvement proposals**, clearly separated so the baseline behaviour stays unambiguous.
> - Blocks marked `NOTE →` are observations or suggestions, not requirements.

---

## 1. Product Overview

### 1.1 What FavMov is

FavMov is a **personal movie and TV show companion**. It lets a person browse and search a global catalogue of films, television shows and the people who make them, and — once signed in — organise the titles they care about into **named collections**, each entry optionally annotated with their own **private notes**.

The product's tagline in the current build is: *"Never forget a movie again! FavMov helps you track your favourite movies and TV shows with ease."*

It is not a streaming service, a review site, or a social network. There is no rating you give, no review you write, no feed, no followers. The single organising idea is: **find a title, put it in a list of your own, and write down why.**

### 1.2 The core value proposition

Most people discover a title (a recommendation from a friend, a trailer, an actor they like) and then forget it. Existing catalogue apps offer a single flat "watchlist". FavMov's differentiator is twofold:

1. **Many collections, not one list.** A title can live in several collections at once ("Watch with Dad", "Rainy Sunday", "Best cinematography", "Already watched — 2025").
2. **Per-collection notes.** The same title can carry a *different* note in each collection. The note is the reason it is there ("the one Sam said has the boat scene"), and it is what the person reads later.

### 1.3 Two modes of use

| Mode | Who | What they can do |
|---|---|---|
| **Browsing (signed out)** | Anyone | Browse trending and popular titles, search movies / TV shows / people, open any title's detail page, open any person's detail page and their full filmography. |
| **Curating (signed in)** | Account holder | Everything above, plus: create collections, add and remove titles, write and edit per-entry notes, see their recently-saved titles on the home screen, view their profile. |

There is no paid tier, no roles, no admin surface, no sharing between users. Every collection is private to its owner.

### 1.4 Platforms

The product is designed as a single experience that runs on **mobile (phone) and on the web**, with a phone-first, single-column, portrait layout. The web build is a public site with a canonical URL; every screen is addressable by a link.

### 1.5 The catalogue

All title, person, cast, crew, rating and artwork data comes from **TMDB — The Movie Database** (`themoviedb.org`), a third-party catalogue of films, television and film-industry people, read through its public web API. FavMov never asks users to enter catalogue data; it only reads it, and it never writes back to TMDB. Section 9 specifies exactly which parts of TMDB the product depends on.

FavMov stores its own **snapshot** of a title (title, artwork reference, rating, rating count, release date) at the moment a user first saves it, so that collections can be displayed without a round-trip to TMDB for every entry.

### 1.6 The two named third-party platforms

| Platform | What it provides | What depends on it |
|---|---|---|
| **TMDB** | Every film, show, person, credit, rating and image in the product. Trending and popular rankings. Search. | F3, F4, F5, F6, F7, F8 — the entire signed-out experience. |
| **Supabase** | Accounts and passwordless email sign-in; session tokens; the database that stores collections, entries and notes; and the row-level rules that make each member's data private. | F1, F2, F9–F15, and the whole ownership model in §3.3. |

**Why these are named when nothing else is.** TMDB's field shapes leak into every screen — the movie/TV split, the 0–10 rating with a vote count, weekly trending windows, the poster and backdrop size variants — so a spec that hid it would under-specify the UI. Supabase's model does the same for the backend: because ownership is enforced by row-level security rather than by application code, "who may read this row" is a database policy, not a service function, and the rebuild has to be designed around that from the start (§8.7).

**Everything else remains free.** Client framework, navigation, styling, state management, the language and shape of the service layer, hosting and build tooling are all open choices, and nothing in this document depends on the current ones.

> `NOTE →` If TMDB is replaced with another catalogue, §9 is the contract the replacement must satisfy. If Supabase is replaced, §7.5 and §8.7 are the parts that must be re-derived; the rest of the document holds unchanged.

---

## 2. Glossary

Consistent vocabulary for the rebuild. Use these terms in code and in the UI.

| Term | Meaning |
|---|---|
| **Title** | A movie or a TV show. The two are handled almost identically throughout the product and differ only by a *kind* flag, which affects which catalogue endpoint is read and how a few fields are labelled. |
| **Kind** | Either `movie` or `tv_show`. Every title reference must carry it; catalogue IDs are only unique *within* a kind, so `(kind, catalogue_id)` is the true identity of a title. |
| **Person** | An actor, director, producer or other crew member in the catalogue. |
| **Credit** | A link between a person and a title — either an *acting credit* (with a character name) or a *crew credit* (with a job name). |
| **Collection** | A user-owned, user-named list of titles. |
| **Entry** | One title inside one collection, together with that entry's notes and the time it was added. The same title in two collections is two entries. |
| **Notes** | Free text the owner attaches to an entry. Private, per entry, optional, editable, may be emptied. |
| **Catalogue** | **TMDB** — the external source of all title, person, credit, rating and artwork data. See §1.6 and §9. |
| **Identity platform** | **Supabase** — supplies accounts, passwordless sign-in, session tokens, the collections database, and the row-level policies that enforce privacy. See §1.6, §7.5 and §8.7. |
| **Snapshot** | FavMov's stored copy of a title's display fields, written when the title is first saved by anyone. |
| **Rating** | The catalogue's aggregate audience score for a title, on a 0–10 scale, shown with the number of votes behind it. FavMov users never set it. |

---

## 3. Actors and Access Rules

### 3.1 Actors

- **Guest** — an unidentified visitor. Has no stored state.
- **Member** — a signed-in person, identified solely by a verified email address.

There are no other roles.

### 3.2 Access matrix

| Screen / capability | Guest | Member |
|---|---|---|
| Home — Trending Movies, Trending TV Shows, Popular Movies | ✅ | ✅ |
| Home — "Your Favourites" strip | ❌ (section not rendered) | ✅ |
| Browse-all (Explore) grid for a home section | ✅ | ✅ |
| Search: movies, TV shows, people | ✅ | ✅ |
| Title detail (synopsis, cast, crew, artwork) | ✅ | ✅ |
| Person detail and full filmography | ✅ | ✅ |
| Save a title / open "Add to collection" | ❌ → must sign in | ✅ |
| Collections list, collection detail | ❌ → redirected to sign-in | ✅ |
| Create a collection | ❌ | ✅ |
| Write / edit entry notes | ❌ | ✅ |
| Profile | ❌ → redirected to sign-in | ✅ |

### 3.3 Ownership rule (non-negotiable)

Every read and every write against a collection, an entry, or a note must be authorised against the **owner** of that collection. A request that names a collection the requester does not own must be answered as **"not found"** (not "forbidden"), so that collection identifiers cannot be probed.

---

## 4. Feature Inventory

| # | Feature | Summary |
|---|---|---|
| **F1** | Passwordless sign-in | Email + one-time code. No passwords, no separate registration step. |
| **F2** | Session and route protection | Session survives reloads; protected screens bounce guests to sign-in and return them afterwards. |
| **F3** | Home / discovery screen | Four horizontal strips: Trending Movies, Trending TV Shows, Popular Movies, Your Favourites. |
| **F4** | Browse-all (Explore) | Full paginated grid for any of the three catalogue strips. |
| **F5** | Search | Debounced search across three tabs — Movies, TV Shows, People — with infinite scroll. |
| **F6** | Title detail | Artwork, rating, facts, genres, synopsis, cast, crew; entry point to saving. |
| **F7** | Person detail | Biography, vital facts, and a complete, date-sorted filmography split into acting and crew credits. |
| **F8** | Full-screen image viewer | Tap any poster or backdrop to view it large, zoomable, dismissible. |
| **F9** | Collections list | Grid of the member's collections with item counts; entry point for creating one. |
| **F10** | Create a collection | Named, unique per member. |
| **F11** | Collection detail | The entries in a collection, newest first, each showing its notes. |
| **F12** | Add / remove a title to and from collections | One screen listing all the member's collections with a toggle per collection. |
| **F13** | Per-entry notes | Inline, auto-saving free text on each collection the title belongs to. |
| **F14** | Recently saved ("Your Favourites") | The member's most recently saved titles, surfaced on Home. |
| **F15** | Profile and sign-out | Identity summary and sign-out. |
| **F16** | Freshness / cross-screen refresh | Screens showing collection data refresh themselves after a change made elsewhere. |
| **F17** | Instant detail hand-off | Opening a title from a list renders immediately using data the list already had, then fills in the rest. |
| **F18** | Feedback and empty states | Consistent toasts, loading indicators and illustrated empty states. |
| **F19** | Shareable links and social previews | Every screen has a URL; links unfurl with a title, description and image. |
| **F20** | Environment separation | Development and production data are fully isolated. |

---

## 5. End-to-End Flows

### 5.1 First visit, guest, discovery only

1. The visitor opens the app. A brief full-screen loading indicator is shown while the app initialises.
2. **Home** appears: a top bar reading "FavMov" with a search action, and a vertical scroll of strips. The three catalogue strips each load independently and show a spinner in place of their content until ready. "Your Favourites" does not appear at all.
3. The visitor scrolls a strip horizontally, or taps a strip's heading / "View All" to open the **Explore** grid for that strip and keep scrolling through pages.
4. Tapping a poster opens **Title detail**. The poster, title and rating are already on screen instantly (carried over from the list); the backdrop, synopsis, genres, cast and crew fill in a moment later.
5. From Title detail, the visitor taps a cast or crew member and lands on **Person detail**, where they can browse that person's entire filmography and jump to any other title. This loop (title → person → title → person) has no depth limit.
6. Tapping the poster or backdrop anywhere opens the **full-screen image viewer**; swiping down or tapping close dismisses it.

### 5.2 Guest decides to save a title

1. On Title detail the visitor taps the save (heart) action.
2. Because they are not signed in, they are taken to the **Sign-in** screen.
3. They enter their email and receive a one-time code by email.
4. They enter the code. On success a confirmation appears and they are returned to the screen they came from.
5. They tap save again and continue with flow 5.3.

> `NOTE →` In the current build the save action is **hidden entirely** for guests rather than shown-and-redirecting, so step 1 is not reachable. See defect **D1** and proposal **P1**.

### 5.3 Member saves a title into collections

1. On Title detail the member taps the save action. The app opens **Add to collection**, titled "Add *{title}* to Collection".
2. The screen lists **all** of the member's collections, each with a checkbox. Collections that already contain this title are checked and sorted to the top.
3. Ticking a checkbox adds the title to that collection; the row shows a spinner while the change is in flight. Unticking removes it.
4. As soon as a collection is ticked, a **notes** field appears under it. Typing saves automatically a moment after the member stops typing. Emptying the field clears the note.
5. The member may tick several collections in one visit. There is no explicit "Done" or "Save" button — every action is committed as it is made.
6. Going back returns to Title detail, whose save icon now shows as **filled**, because the title is in at least one collection.

### 5.4 Member with no collections tries to save

1. Steps 1–2 of 5.3, but the list is empty.
2. An illustrated empty state explains "You don't have any collections yet." with a **Create Collection** action.
3. The member creates a collection, then ticks it for this title.

> `NOTE →` In the current build that action navigates to Home instead of opening the create-collection form, stranding the member mid-task. See defect **D2** and proposal **P2**.

### 5.5 Member curates collections

1. The member opens the **Collections** tab. If signed out, they are redirected to sign-in first and land on Collections afterwards.
2. They see a grid of collection cards, each showing the collection's name and how many titles it holds.
3. Tapping **+** in the top bar opens the **Create collection** sheet: a single name field and a Save action. A name already used by that member (ignoring case) is rejected inline with a message. On success the sheet closes, a confirmation toast appears, and the grid refreshes with the new collection.
4. Tapping a card opens **Collection detail**: the titles in that collection, newest addition first, each row showing poster, title with release year, rating, and the member's notes (truncated to two lines with a "See More" expander).
5. Tapping a row opens Title detail, from which the member can adjust which collections it belongs to, or edit its notes (flow 5.3). On returning, the collection reflects the change.
6. If a collection is empty, an illustrated empty state invites the member to **Search Movies or TV Shows**, which opens Search.

### 5.6 Member returns later

1. On opening the app, the session is restored silently — no sign-in prompt.
2. Home now includes a **Your Favourites** strip showing the titles they most recently added to any collection, newest first, each carrying its note.
3. Any change made in one place (adding a title, editing a note, creating a collection) is reflected the next time they land on Home, Collections or Collection detail — those screens re-fetch when they regain focus if a change happened since their last load.

### 5.7 Member signs out

1. **Profile** tab shows an avatar built from the first two letters of their email, the email itself, and the date they joined.
2. Tapping **Logout** ends the session, shows a confirmation, and returns them to Home as a guest. "Your Favourites" disappears.

---

## 6. Feature Specifications

Each feature below states its purpose, its entry points, what is on screen, the rules that govern it, and acceptance criteria.

---

### F1 — Passwordless sign-in

**Purpose.** Let someone prove they own an email address, with no password to create, remember or reset.

**Entry points.** The save action on Title detail (for guests); any attempt to open a protected screen; direct link to the sign-in screen.

**Screen.** A top bar titled "Login" with a back action, and a card containing:
- A heading, "Welcome!".
- An **email** field with an envelope icon.
- A primary action, **Send OTP**.

After a code is requested, the same card also shows:
- A **Change** action beside the email field, which returns to the email-entry state.
- A **code** field with a lock icon, placeholder "Input your OTP here…".
- A **Resend OTP** action, disabled and showing a live `M:SS` countdown from **5:00**, enabled when the countdown reaches zero.
- The primary action changes to **LOGIN**.

**Rules.**
1. Requesting a code for an address that has never been seen **creates the account**. There is no separate registration flow, and the UI never distinguishes "sign up" from "sign in".
2. While a request is in flight the primary action shows a spinner and is not tappable.
3. A successful code request shows a confirmation: *"Check your email — We have sent you an OTP to your email."*
4. A failed request shows the failure reason in an error toast and returns to the previous state.
5. A successful verification shows *"Login success! Welcome {email}"* and, after a short pause, returns the person to the screen they came from; if there is no such screen, to Home.
6. Resend is only possible after the countdown expires. Requesting a new code restarts the countdown. Changing the email address resets the countdown and returns to the email-entry state.

**Acceptance criteria.**
- [ ] A brand-new email address can complete sign-in without any separate registration step.
- [ ] The countdown ticks down once per second and Resend is inert until it reaches zero.
- [ ] Tapping **Change** restores the email-entry state with the address still editable.
- [ ] An incorrect or expired code produces a readable error and leaves the person on the screen, able to retry.
- [ ] After sign-in the person is returned to whatever they were doing, not dumped on Home — unless there is nothing to return to.

**Platform notes (Supabase Auth).**
- Sign-in is Supabase's **email one-time-password** flow: request a code for an address, then verify the address-and-code pair. Account auto-creation is an explicit option on the request and must be **enabled** — it is what removes the separate registration step.
- Supabase's email OTP sends a **code and a magic link in the same message**; the product only uses the code. Either the email template is edited to show the code prominently, or the link path is handled too (see **P23**).
- Code lifetime and delivery are Supabase's; the five-minute countdown in the UI is only FavMov's **resend cooldown** and is independent of the real expiry. Keep the two consistent when configuring the project.
- Supabase's default email sender is rate-limited and unsuitable for production volume; a real sending domain must be configured, or sign-in will silently fail for some people.

> `NOTE →` Proposal **P3** suggests shortening the cooldown to 60 seconds and stating the code's real expiry on screen.

---

### F2 — Session and route protection

**Purpose.** Keep people signed in across visits, and keep guests out of member screens without dead ends.

**Rules.**
1. A session persists across app restarts and page reloads and is refreshed automatically before it expires.
2. The app exposes a single source of truth for *is someone signed in, who are they, and is that still being determined*. Screens must be able to distinguish **"unknown yet"** from **"definitely signed out"** and must not act on the latter until the former resolves.
3. **Protected screens** — Collections, Collection detail, Add to collection, Profile — render a full-screen loading indicator while auth is resolving, and redirect to sign-in (replacing history, so Back does not bounce) once it resolves to signed out. They render nothing in between.
4. Every request to FavMov's own services carries the caller's session credential. Requests from an unauthenticated caller to a member endpoint are rejected as unauthenticated.
5. Signing out clears the session everywhere in the app and returns the person to Home.

**Acceptance criteria.**
- [ ] Reloading the app while signed in never shows the sign-in screen.
- [ ] Deep-linking to a protected screen while signed out redirects to sign-in; going Back from sign-in does not return to the protected screen in a redirect loop.
- [ ] No protected screen ever flashes its content before the redirect.
- [ ] After signing out, Home immediately drops the member-only strip.

**Platform notes (Supabase Auth).**
- The session is a **JSON Web Token** issued by Supabase, persisted in device/browser storage, and refreshed automatically before expiry. On the web, the client must also be able to pick a session up out of the URL, which is what makes the magic-link path work at all.
- Every call to FavMov's own service carries that token as a bearer credential. The service **verifies it with Supabase** on each request and then acts *as that member* for the rest of the request (§8.2), which is what makes row-level security the real enforcement point.
- The signed-out state must be distinguishable from "not yet known": on a cold start the session is restored asynchronously, and a screen that treats "not known yet" as "signed out" will bounce a signed-in member to the sign-in screen for a frame. This is the single most common bug in this area.

---

### F3 — Home / discovery screen

**Purpose.** Give an immediate reason to be in the app: what is popular now, and what you saved recently.

**Screen.** Top bar titled **"FavMov"** with a **search** action on the right. Below it, a vertical scroll containing four strips, in this fixed order:

1. **Trending Movies** — the most-watched movies of the week.
2. **Trending TV Shows** — the most-watched TV shows of the week.
3. **Popular Movies** — the currently most popular movies.
4. **Your Favourites** — the member's most recently saved titles (member only).

**Strip anatomy.**
- A heading row: the strip's name in large bold type; for the three catalogue strips, a **"View All"** action on the right. The entire heading row is tappable and opens Explore for that strip. "Your Favourites" has no View All and its heading is inert.
- A horizontally scrolling row of poster cards, without a visible scrollbar.
- A **poster card** shows: the artwork (2:3 aspect ratio, rounded corners), the rating line, and the title on a single line with an ellipsis.

**Strip states.**
| State | Rendering |
|---|---|
| Loading | Heading plus a centred spinner occupying the strip's height. |
| Loaded with results | Heading plus the card row. |
| Loaded but empty | **The whole strip is omitted**, heading included. |
| Failed | **The whole strip is omitted**, heading included. |

**Rules.**
1. Each strip loads independently; one strip failing must not affect the others.
2. "Your Favourites" is not requested at all while signed out and renders nothing.
3. Each strip shows the first page of results only.
4. When Home regains focus, "Your Favourites" re-fetches **only if** a collection change was recorded since it last loaded (see F16). The catalogue strips do not re-fetch on focus.

**Acceptance criteria.**
- [ ] With the catalogue unavailable, Home renders as an empty scroll view without crashing or showing broken headings.
- [ ] Saving a title and returning to Home updates "Your Favourites" without a manual refresh.
- [ ] Signing out removes "Your Favourites" without a reload.

> `NOTE →` Silently hiding a failed strip means a catalogue outage is indistinguishable from an empty catalogue, and the person is given nothing to retry. See defect **D3** and proposal **P4**.

---

### F4 — Browse-all (Explore)

**Purpose.** Let someone go deeper than the ~20 titles a home strip shows.

**Entry point.** Tapping a catalogue strip's heading or "View All" on Home. The screen is addressable by a link that names which strip it is showing.

**Screen.** Top bar titled with the strip's name and a back action. Below it, a **two-column grid** of poster cards, identical to the ones on Home.

**Rules.**
1. The first page loads with a full-screen spinner.
2. Scrolling to within the last 30% of the list loads the next page and appends it; a small spinner is shown at the foot of the list while it loads.
3. Only one page request may be in flight at a time.
4. Paging stops at the catalogue's last page.
5. If there are no results at all, an illustrated empty state reads "No results found."
6. Tapping a card opens Title detail, carrying the card's data over for instant rendering (F17).

**Acceptance criteria.**
- [ ] Scrolling to the bottom repeatedly keeps appending pages without duplicating or skipping entries.
- [ ] Rapid scrolling never fires two concurrent page loads.
- [ ] The grid keeps its scroll position when returning from a title.

> `NOTE →` The current build hard-stops at page 500 and, on some paths, restarts page counting without clearing the list, which can duplicate entries. See defect **D4**.

---

### F5 — Search

**Purpose.** The primary way to find a specific title or person.

**Entry points.** The search action on Home; the "Search Movies or TV Shows" action on an empty collection.

**Screen.** Top bar titled "Search" with a back action. Below it:
- A single-line **search field**, auto-focused on arrival, with a placeholder that changes with the active tab: "Type any Movie title…", "Type any TV Show title…", "Type any name…".
- A row of three **filter chips** — **Movie**, **TV Show**, **People** — of which exactly one is active. Movie is the default. The active chip is filled in the accent colour with white text; the others are grey.
- The results area.

**Result rendering.**
- **Movie / TV Show** — a two-column grid of poster cards.
- **People** — a single-column list of person rows: portrait on the left (3:4), name in bold, and "Known for: *{department}*" beneath.

**Rules.**
1. Typing is **debounced by 300 ms**; only then is a search issued.
2. Changing the active chip re-runs the current query from page one under the new scope and clears previous results.
3. Results paginate on scroll exactly as in F4, bounded by the catalogue's reported total page count.
4. Empty states:
   - No query typed → illustration plus the active tab's placeholder text.
   - Query typed, no matches → illustration plus "No results found."
5. Adult content is excluded from title searches.
6. Tapping a title opens Title detail (with hand-off, F17). Tapping a person opens Person detail.

**Acceptance criteria.**
- [ ] Typing a long query issues one search, not one per keystroke.
- [ ] Switching from Movie to People with a query present replaces the grid with person rows and does not mix result types.
- [ ] Clearing the field returns to the "no query" empty state.
- [ ] Pagination continues to work after a chip change.

> `NOTE →` In the current build the filter chips are hidden while the person is typing and reappear when results arrive, so the row shifts under the finger. See defect **D5** and proposal **P5**. There is also no search history and no suggestions; see **P6**.

---

### F6 — Title detail

**Purpose.** Everything a person needs to decide whether they want this title — and the one place they save it.

**Entry points.** Any poster card anywhere in the app; any credit row on Person detail; a direct link. The link identifies the title by its catalogue identifier **and its kind**, because identifiers are only unique within a kind.

**Screen, top to bottom.**

1. **Top bar** — the title's name, with a back action.
2. **Artwork block** (fixed height):
   - The **backdrop** (wide still) filling the block; if the title has none, a flat grey panel.
   - The **poster** overlaid at the lower-left: 2:3, rounded, with a white border.
   - The **save action**: a circular accent-coloured button at the lower-right holding a heart icon — **filled** when the title is in at least one of the member's collections, **outlined** when it is in none, and a spinner while that status is being refreshed.
3. **Title** in large bold type.
4. **Rating line** — `⭐ {rating} ({vote count})`, where the rating is colour-coded (see §8.4) and the vote count is grey and lighter. Omitted entirely when the title has no rating.
5. **Facts line**, joined by `•`, omitting any part that is unknown: runtime in minutes, release date, "Directed by {name}", and the literal marker "TV Show" for television titles.
6. **Genre chips** — small grey rounded labels.
7. **Synopsis** — heading plus the full overview text. The whole block is omitted if there is no overview.
8. **Cast** — heading plus up to **10** rows, in the catalogue's billing order. Each row: circular portrait, actor's name, character name beneath. Tapping a row opens Person detail.
9. **Crew** — heading plus up to **20** entries in a two-column layout, each showing name and job. Tapping opens Person detail. The ordering is deliberate: **the Director first, then all Producers, then everyone else** in catalogue order.

**Rules.**
1. The title's headline data (name, poster, rating) must be on screen **immediately** when arriving from a list, via the hand-off in F17; the remaining detail fills in when the catalogue responds.
2. The save action's collection status is loaded separately from the title's detail and is refreshed every time the screen regains focus — so returning from "Add to collection" shows the new state.
3. For a guest, the save action leads to sign-in.
4. Tapping the poster or the backdrop opens the full-screen viewer (F8).
5. A failure to load detail is surfaced as an error toast; the screen keeps whatever it already has.

**Acceptance criteria.**
- [ ] Opening a title from a list never shows a blank screen or a placeholder poster for a title that has one.
- [ ] Adding the title to a collection and pressing Back flips the heart from outlined to filled without a manual refresh.
- [ ] A TV show shows "TV Show" in the facts line and its first-air date as the release date.
- [ ] Titles with no backdrop, no rating, no genres, no synopsis or no credits render without empty headings or gaps.
- [ ] The first crew entry is the Director when one exists.

---

### F7 — Person detail

**Purpose.** Explore a person's body of work and hop from it to any title.

**Entry points.** A cast or crew row on Title detail; a person row in Search; a direct link.

**Screen.**

1. **Top bar** — the person's name (or "People" until it loads), with a back action.
2. **Header** — portrait on the left (2:3, rounded); to the right, the name in large bold type, then labelled facts, each falling back to "N/A":
   - **Known For:** their primary department.
   - **Birthday:**
   - **Place of Birth:**
   - **Gender:** rendered as Female / Male / Non-binary / Unspecified.
3. **Biography** — heading plus the text, clamped to **4 lines** with a **See More / See Less** expander. If there is none: "No biography available."
4. **Acting Credits ({count})** — heading with a **Hide / Show** toggle on the right, then the credit rows. If there are none: "No acting credits available." and no toggle.
5. **Crew Credits ({count})** — identical structure. A crew credit shows the **job** where an acting credit shows the **character**.

**Credit row.** Release year (or `----`), small poster (3:4), then: a movie/TV icon followed by the title on one line; beneath it `as {character}` or the job name; beneath that the colour-coded rating and vote count.

**Rules.**
1. Acting and crew credits are **merged across movies and TV** and sorted by release date, **newest first**. Credits with no date sort to the very top (they are unreleased or unannounced).
2. Both sections are expanded by default; the toggle collapses the list while leaving the heading and count visible.
3. Tapping a credit opens Title detail for that title, with the correct kind, carrying the row's data over for instant rendering (F17).
4. The full page shows a full-screen spinner until the person's data arrives.

**Acceptance criteria.**
- [ ] A person with both film and television work shows one merged, correctly date-sorted list per section.
- [ ] A person credited twice on the same title (e.g. writer and director) shows both rows without a key collision.
- [ ] Tapping a television credit opens the TV detail page, not the movie page with the same numeric identifier.
- [ ] A person with no photo shows the placeholder artwork, not a broken image.

---

### F8 — Full-screen image viewer

**Purpose.** Let someone actually look at the artwork.

**Rules.**
1. Tapping a poster or backdrop opens an overlay on a near-black background containing that image, pinch-to-zoomable.
2. A close control sits at the top-left; swiping down also dismisses.
3. Saving the image to the device by long-press is disabled.
4. The viewer opens the **large** variant of the image when one exists, otherwise the small one.
5. Progressive loading: the small variant is shown first and is replaced by the large one as soon as it has loaded, so there is never an empty frame.

**Acceptance criteria.**
- [ ] The viewer opens over the current screen without a navigation transition and restores the screen unchanged on close.
- [ ] Swipe-down dismiss works while zoomed out and does not fight with pan while zoomed in.

---

### F9 — Collections list

**Purpose.** The member's home base for their own data.

**Entry point.** The **Collections** tab. Protected (F2).

**Screen.** Top bar titled "Collections" with an **add** action on the right. Below it, a **two-column grid of square cards**. Each card is filled with a soft pastel colour and centres the collection's **name** in bold with its **item count** in parentheses beside it, in a lighter weight. Long names wrap and centre.

**Rules.**
1. Collections are ordered by **number of titles, descending**; ties keep the most recently touched collection first, where "touched" means the most recent addition to it, falling back to its creation time.
2. A full-screen spinner covers the initial load.
3. The empty state shows an illustration, "You don't have any collections yet.", the subtext "Create a collection to organize your favorite movies.", and a **Create Collection** action.
4. The list re-fetches when the tab regains focus **if** a collection change was recorded since it last loaded (F16).
5. Tapping a card opens Collection detail.

**Acceptance criteria.**
- [ ] The count on each card matches the number of rows in that collection's detail.
- [ ] Creating a collection from the empty state replaces the empty state with a one-card grid.
- [ ] Adding a title to a collection elsewhere and returning to this tab shows the updated count.

> `NOTE →` Card colours are currently random per render, so a collection changes colour every time the grid is drawn — it cannot be recognised by colour. See defect **D6** and proposal **P7**. There is also **no way to rename or delete a collection from the UI**, even though deletion is supported by the service. See gap **D7** and proposal **P8**.

---

### F10 — Create a collection

**Purpose.** Make a new, empty, named list.

**Entry points.** The add action in the Collections top bar; the Create Collection action in either empty state.

**Screen.** A sheet anchored to the bottom of the screen over a dimmed backdrop, with rounded top corners, containing:
- A header, "Create New Collection".
- A **Name** label and a text field, auto-focused, placeholder "Type collection name here…".
- Inline error text, in red, when the save is rejected.
- A **Save** action, disabled while the field is empty or a save is in flight, showing a spinner while saving.

**Rules.**
1. Tapping the dimmed backdrop dismisses the sheet; tapping inside it does not. The sheet cannot be dismissed while a save is in flight.
2. Names are **trimmed**. An empty or whitespace-only name cannot be saved.
3. A name that matches another of the **same member's** collections, **ignoring case**, is rejected with "You already have a collection with the same name." shown inline. Two different members may use the same name.
4. On success the sheet closes, the field is cleared, a toast confirms *"Collection Created — "{name}" has been created successfully"*, and the grid refreshes.

**Acceptance criteria.**
- [ ] "  Sci-Fi  " and "sci-fi" are treated as the same name.
- [ ] Double-tapping Save creates exactly one collection.
- [ ] Dismissing and reopening the sheet starts from an empty field with no stale error.

---

### F11 — Collection detail

**Purpose.** Read back what you saved and, crucially, *why* you saved it.

**Entry point.** A card in the Collections grid; a direct link. Protected (F2).

**Screen.** Top bar showing the collection's name (or "Collection" until loaded), with a back action. Below it, a single-column list of **entry rows**:

- Poster on the left (3:4, rounded on the left edge only).
- To the right: the **title with its release year** in parentheses, on one line with an ellipsis; the colour-coded rating with vote count; and the member's **notes**, clamped to **2 lines** with a **See More / See Less** expander.
- Rows with no notes simply omit that block.

**Rules.**
1. Entries are ordered by **when they were added to this collection, newest first**.
2. A spinner covers the initial load.
3. The empty state shows an illustration, "No movies or TV show in this collection.", the subtext "Browse movies and TV shows to add them to this collection.", and a **Search Movies or TV Shows** action that opens Search.
4. The screen re-fetches when it regains focus if a collection change was recorded since it last loaded (F16).
5. Tapping a row opens Title detail (with hand-off, F17).

**Acceptance criteria.**
- [ ] Notes written on the add screen appear here verbatim.
- [ ] A long note is clamped to two lines and fully expandable in place.
- [ ] Removing the title from this collection elsewhere and returning removes the row.

> `NOTE →` There is no way to remove an entry, edit its notes, or reorder from this screen — the member must open the title and go back through the add screen. See gap **D8** and proposal **P9**.

---

### F12 — Add / remove a title to and from collections

**Purpose.** The single screen where membership of a title in the member's collections is managed.

**Entry point.** The save action on Title detail. Protected (F2).

**Screen.** Top bar titled **"Add {title} to Collection"**, where a title longer than 20 characters is truncated with an ellipsis. Below it, one row per collection:

- The collection's **name** in bold on the left.
- A **checkbox** on the right, in the accent colour, replaced by a spinner while a change for that row is in flight.
- When checked, a **notes** field appears beneath the name (F13).
- A hairline separator between rows.

**Rules.**
1. **Every** collection the member owns is listed, whether or not it contains the title.
2. Collections that already contain the title are pre-checked and **sorted to the top**; the rest keep the default collection order.
3. Checking adds; unchecking removes. Each toggle is committed immediately — there is no save step and no cancel.
4. A failed toggle shows an error toast and the checkbox reverts to its true state.
5. Adding a title the collection already holds is rejected as a duplicate.
6. Every successful change records a collection-change timestamp (F16).
7. The empty state — no collections yet — shows an illustration, "You don't have any collections yet." and a **Create Collection** action.

**Acceptance criteria.**
- [ ] A title can be in several collections at once, each with its own notes.
- [ ] Unchecking removes the entry and its notes for that collection only, leaving other collections untouched.
- [ ] Toggling several collections quickly commits every change, each row spinning independently.
- [ ] Returning to Title detail shows the heart filled if at least one box is ticked.

> `NOTE →` This screen currently depends on state handed over from Title detail and **cannot be opened from a cold link** — it shows an error and navigates away. See defect **D9** and proposal **P10**.

---

### F13 — Per-entry notes

**Purpose.** Capture the *reason* a title is in a collection — the feature the product is built around.

**Where it appears.** As an editable field on each ticked row of the Add-to-collection screen (F12). As read-only, expandable text on each row of Collection detail (F11) and on the "Your Favourites" strip data.

**Rules.**
1. Notes belong to the **entry**, not the title. The same title in three collections has three independent notes.
2. The field is single-line-height but accepts free text of any length, placeholder "Write custom notes…".
3. Saving is **automatic and debounced by 1 second** after the last keystroke — there is no save button.
4. Notes are **trimmed** on save. Clearing the field saves an empty note, which removes it from display.
5. Writing a note to a title that is not in that collection is rejected as "not found".
6. Each successful save records a collection-change timestamp (F16).
7. A failed save shows an error toast.

**Acceptance criteria.**
- [ ] Typing continuously issues one save after typing stops, not one per keystroke.
- [ ] Notes written on one collection do not appear on another collection holding the same title.
- [ ] Reopening the screen shows the saved note in the field.
- [ ] Deleting all text and leaving the screen persists the empty note.

> `NOTE →` Debounced auto-save with no explicit confirmation means a note typed just before the person navigates away can be lost, and there is no "saved" indicator. See defect **D10** and proposal **P11**.

---

### F14 — Recently saved ("Your Favourites")

**Purpose.** Bring the member's own data onto the first screen they see.

**Rules.**
1. Shows the titles the member has most recently added to **any** collection, **newest first**, **de-duplicated across collections** — a title saved to three collections appears once, dated by its most recent addition.
2. Each entry carries the title's display data plus the notes from its most recent entry.
3. Rendered as a horizontal strip of poster cards on Home, identical in appearance to the catalogue strips but with **no "View All"**.
4. Not requested and not rendered for guests.
5. Re-fetched when Home regains focus if a collection change was recorded since it last loaded (F16).

**Acceptance criteria.**
- [ ] Saving a title puts it at the head of the strip.
- [ ] Removing a title from every collection removes it from the strip.
- [ ] A title in multiple collections appears exactly once.

> `NOTE →` The strip is capped by whatever the service returns and has no "see all". Because there is no dedicated "everything I ever saved" view, a member's only route to an old title is to remember which collection it is in. See proposal **P12**.

---

### F15 — Profile and sign-out

**Purpose.** Confirm who is signed in, and let them leave.

**Screen.** Top bar titled "Profile". A card containing:
- A circular avatar showing the **first two letters of the email, uppercased**, in white on a solid colour.
- The **email address**.
- **"Member since {date}"**, the date written out long-form (e.g. "3 February 2025").
- A **Logout** action in a warning colour, full width.

**Rules.**
1. Protected (F2).
2. Signing out clears the session, confirms with a toast, and returns to Home.
3. A failed sign-out shows "Logout Failed — An error occurred while logging out. Please try again." and leaves the session intact.

**Acceptance criteria.**
- [ ] After signing out, protected tabs redirect to sign-in.
- [ ] The join date matches the account's creation date.

> `NOTE →` There is no display name, no avatar upload, no account deletion, no email change, and no data export. See proposal **P13**.

---

### F16 — Freshness and cross-screen refresh

**Purpose.** Never show a member stale data about their own collections after they have just changed something.

**Rules.**
1. The app maintains a single, app-wide **"collections last changed at"** timestamp. Every successful create-collection, add-title, remove-title and save-note updates it.
2. Every screen that displays collection-derived data records **when it last loaded**.
3. When such a screen regains focus, it compares the two and re-fetches **only if** the change timestamp is newer than its own load timestamp.
4. The screens subject to this rule are: Home's "Your Favourites" strip, the Collections list, and Collection detail. Title detail refreshes its save status on **every** focus, unconditionally.

**Acceptance criteria.**
- [ ] Navigating between tabs without changing anything issues no redundant requests.
- [ ] Any change made on the add screen is visible on all three screens the next time each is focused.

> `NOTE →` This marker lives only in memory, so a reload resets it — harmless, because a reload refetches anyway. It is also global rather than per-collection, so a change to one collection refreshes the detail screen of another. See proposal **P14** for replacing the whole mechanism with a query cache keyed by resource.

---

### F17 — Instant detail hand-off

**Purpose.** Eliminate the blank-screen-then-pop that makes list→detail navigation feel slow.

**Rules.**
1. When a list row is tapped, the data that row already holds (identifier, kind, title, artwork reference, rating, vote count, release date, and any notes) is placed in a short-lived, in-memory hand-off store before navigating.
2. The detail screen reads the store on mount, **consumes** the entry (removing it), and renders immediately from it while requesting the full record.
3. Entries expire after **30 minutes**; the store holds at most **100** entries, evicting the oldest.
4. A detail screen opened by a cold link finds nothing in the store and simply renders its loading state — the hand-off is an optimisation, never a dependency.
5. The store is keyed by **kind and identifier together**.

**Acceptance criteria.**
- [ ] Opening a title from any list shows its poster and name with no intermediate blank frame.
- [ ] Opening the same title by pasting its link in a fresh session works correctly.
- [ ] A movie and a TV show sharing a numeric identifier never resolve to each other's cached data.

> `NOTE →` Rule 4 is a requirement, not a description: the current Add-to-collection screen **violates** it by treating handed-over state as mandatory. See defect **D9**.

---

### F18 — Feedback and empty states

**Purpose.** One consistent language for waiting, emptiness, success and failure.

**Rules.**

*Loading.*
- A whole screen that has nothing to show yet: a large centred spinner in the accent colour.
- A section within a screen: a spinner occupying the section's height.
- An action in progress: the control is replaced by a spinner in place and becomes inert.
- Appending a page: a small spinner at the foot of the list.

*Empty.* A centred illustration, a bold one-line explanation, optional grey subtext, and — where there is an obvious next step — a full-width accent-coloured action button. Empty states exist for: search with no query, search with no matches, browse-all with no results, no collections (twice: the Collections tab and the add screen), and an empty collection.

*Success.* A toast at the **bottom** of the screen with a bold first line and optional second line. Used for: code sent, sign-in, sign-out, collection created.

*Failure.* A toast at the bottom with the first line "Error" and the failure message beneath. Used for: sign-in failures, catalogue failures, and every collection operation failure. Exception: the create-collection sheet shows its failure **inline**, because the sheet covers the toast area.

*Placeholders.* A title or person with no artwork renders a standard placeholder image, never a broken or empty frame.

**Acceptance criteria.**
- [ ] Every asynchronous action in the app shows one of these four states — never a frozen, unresponsive control.
- [ ] No screen renders an empty white void when a request fails.

> `NOTE →` The last criterion is **not met today**: several screens swallow errors and render an empty list, and there is nowhere to retry. See defect **D3** and proposal **P4**.

---

### F19 — Shareable links and social previews

**Purpose.** Make the product linkable.

**Rules.**
1. Every screen has a stable, human-readable address: home, search, browse-all-for-a-strip, title detail (identifier + kind), person detail, collection detail, add-to-collection, sign-in.
2. The web build serves a site-wide preview package: a page title, a description, a preview image, and a canonical URL, for both generic link unfurling and the major social formats.
3. Back navigation is safe everywhere: if there is no history to go back to (a cold deep link), the back action goes to Home rather than doing nothing.

**Acceptance criteria.**
- [ ] Pasting any screen's link into a fresh browser opens that screen, subject to the access rules in §3.2.
- [ ] Pasting a link into a chat app shows a preview card.
- [ ] Back from a cold deep link lands on Home.

> `NOTE →` Previews are **site-wide only** — sharing a specific film shows the generic FavMov card, not that film's poster and synopsis. This is an open item in the current build. See proposal **P15**.

---

### F20 — Environment separation

**Purpose.** Keep development traffic out of real members' data.

**Rules.**
1. Member data is stored in **fully separate namespaces per environment** (development, production). No request may ever read or write across the boundary.
2. The environment is configuration, not code. An unrecognised environment value must cause requests to **fail loudly** with a clear message, never to silently fall back to production.
3. Diagnostic details in service responses are included **only** in development; production responses carry the human-readable message alone.

**Acceptance criteria.**
- [ ] Running against development never returns production rows.
- [ ] A misconfigured environment produces an explicit, readable error on the first request.
- [ ] Production error responses contain no internal messages, identifiers or query fragments.

---

## 7. Conceptual Data Model

Entities and the fields the product actually uses. No storage technology is implied.

### 7.1 Member
| Field | Notes |
|---|---|
| Identifier | Stable, internal. |
| Email | Verified; the only identity the product has. |
| Created at | Shown on Profile as "Member since". |

### 7.2 Collection
| Field | Notes |
|---|---|
| Identifier | Stable, opaque, used in links. |
| Owner | The member. Every operation is scoped by it. |
| Name | Required, trimmed, unique per owner **ignoring case**. |
| Created at | |
| *Item count* | Derived: number of entries. Shown on the collection card. |
| *Last updated* | Derived: the most recent entry addition, falling back to the creation time. Used for ordering. |

### 7.3 Title snapshot
FavMov's own copy of a title's display fields, written the first time **any** member saves that title, and read whenever collections are rendered.

| Field | Notes |
|---|---|
| Catalogue identifier | Together with kind, the identity. |
| Kind | `movie` or `tv_show`. |
| Title | Required at save time. |
| Artwork reference | Required at save time. |
| Rating | Optional, 0–10. |
| Rating count | Optional. |
| Release date | Optional. |

> `NOTE →` The current build keeps movies and TV shows in **two parallel stores** with a boolean discriminator, which forces every query, every response shape and every screen to branch. One store with a `kind` field removes a whole class of bug. See proposal **P16**.

### 7.4 Entry (title in a collection)
| Field | Notes |
|---|---|
| Identifier | |
| Collection | |
| Owner | Denormalised from the collection; every query filters on it as well. |
| Title reference | Catalogue identifier **plus kind**. |
| Notes | Optional free text, trimmed, may be empty. |
| Created at | Drives "newest first" ordering in collection detail and "Your Favourites". |

**Constraint.** A title may appear **at most once** in a given collection.

**Cascade.** Deleting a collection deletes all of its entries. Deleting an entry never deletes the title snapshot — snapshots are shared.

### 7.5 How this maps onto Supabase today

The conceptual model above is what matters. This subsection records how the current build realises it, because two of its choices are load-bearing and a third is worth **not** repeating.

**Tables.** Four, all prefixed by environment (`dev_` / `prod_` — see F20):

| Table | Holds |
|---|---|
| `collections` | One row per collection: name, owner, created-at. |
| `movies` | Movie snapshots, keyed by TMDB movie id. |
| `tv_shows` | TV snapshots, keyed by TMDB show id. Structurally identical to `movies`. |
| `movies_collections` | Entries: collection, owner, **either** a movie id **or** a show id, a kind flag, notes, created-at. |

**Database functions.** Two aggregations are computed in the database rather than in application code, and the rebuild should keep them there — doing either in application code means fetching every entry to count it:

| Function | Returns |
|---|---|
| `collections_with_movie_count(user_id)` | Each collection with its entry count and the timestamp of its most recent addition. Drives the Collections grid (F9) and its ordering. |
| `latest_movies_added_to_collection(user_id)` | The member's most recently added titles, de-duplicated across collections, with the notes from the most recent entry. Drives "Your Favourites" (F14). |

Both are environment-prefixed like the tables.

**Ownership is enforced by row-level security, not by application code.** The owner column defaults to the authenticated member server-side, so a collection is created by inserting only its name — the caller cannot claim someone else's identity because it never supplies one. Policies scope every select, insert, update and delete to the authenticated member. The application's own owner filters are a second layer, not the first (§8.7).

> `NOTE →` The split between `movies` and `tv_shows`, and the pair of nullable foreign keys in `movies_collections` that follows from it, is the one part of this model worth discarding. It forces every query, every response shape and every screen to branch on kind. See proposal **P16**.

---

## 8. Cross-Cutting Rules

### 8.1 Service response shape

Every response from FavMov's own services carries, uniformly:
- whether the operation succeeded,
- a human-readable message safe to show to a person,
- a diagnostic message **in development only**,
- the payload, on success.

Status conventions: `200` for reads and updates, `201` for creations, `400` for validation failures and duplicates, `401` for missing or invalid credentials, `404` for "not found or not yours", `500` for unexpected failures. An unknown endpoint returns `404` with an explicit message rather than falling through to a page.

### 8.2 Capability surface

The member-facing services must support exactly these operations. All of them require authentication and are scoped to the caller.

| Operation | Notes |
|---|---|
| Create a collection | Name required; duplicate name per owner rejected. |
| List my collections | With item counts and last-updated, in the order defined in F9. |
| Delete a collection | Deletes its entries first. *(Supported by the service; not yet exposed in the UI.)* |
| List my recently saved titles | De-duplicated across collections, newest first, with notes. |
| Add a title to a collection | Creates the title snapshot if this is the first time anyone saved it. |
| Remove a title from a collection | |
| Set the notes on an entry | |
| List the entries of a collection | With the collection's own data and the entries' snapshots and notes. |
| Check which of my collections hold a title | Returns collection identifier, name and that entry's notes, for each hit. Drives the save-state of the heart and the pre-checked boxes on the add screen. |
| Health check | Unauthenticated. |

**How authorisation actually works.** The service does not hold a privileged key and query on the member's behalf. It takes the caller's session token, verifies it with Supabase, and then performs every query **as that member**, so Supabase's row-level policies are the enforcement point for §3.3. Two consequences the rebuild must respect:

1. A missing or wrong policy is a **data breach**, not a bug in a service function. Policies are the security surface and deserve tests of their own.
2. Because the service is a thin validation-and-shaping layer over Supabase rather than a privileged gatekeeper, it can be **thinned further or removed** — see proposal **P24**.

### 8.3 Input validation

| Input | Rule |
|---|---|
| Collection name | Required after trimming. |
| Kind flag | Required, strictly boolean, on every write that names a title. |
| Title reference | The identifier matching the kind must be present. |
| Title (on save) | Required after trimming. |
| Artwork reference (on save) | Required after trimming. |
| Rating, rating count, release date | Optional; absent values stored as unknown, never as zero or an epoch date. |
| Notes | Optional; trimmed; empty permitted. |

Validation failures return the **first** offending message, in plain language.

### 8.4 Rating presentation

A single rule used on every surface that shows a rating:

| Rating | Colour |
|---|---|
| ≥ 7.0 | Green |
| 5.0 – 6.9 | Amber |
| < 5.0 | Red |

Displayed as `⭐ {rating} ({vote count})`, with the rating in its colour and bold, the vote count grey and in normal weight, and rounded to two decimals. Titles without a rating omit the line entirely — they never show "0" or "N/A".

### 8.5 Sorting rules, in one place

| List | Order |
|---|---|
| Collections grid | Item count descending; ties by last-updated descending. |
| Entries in a collection | Added-at descending. |
| "Your Favourites" | Most recent addition descending, de-duplicated by title. |
| Add-to-collection rows | Collections already containing the title first, then the default collection order. |
| Person's credits | Release date descending; undated credits first. |
| Crew on a title | Director, then Producers, then catalogue order. |
| Cast on a title | Catalogue billing order, capped at 10. |
| Search and browse results | Catalogue's own relevance / popularity order. |

> `NOTE →` The collections order is worth revisiting: sorting by size means a member's newest collection sinks to the bottom the moment it is created, which is exactly when they want to see it. See proposal **P17**.

### 8.6 Visual language

- **Accent colour:** a warm tomato-red, used for primary actions, active chips, selected controls, spinners and links.
- **Backgrounds:** white surfaces; a light warm tint behind the sign-in and profile cards; a light grey top bar.
- **Top bar:** fixed height, bold title truncated to one line, optional back action on the left, optional action icons on the right.
- **Cards:** rounded corners, soft shadow.
- **Artwork:** posters at 2:3 in grids and 3:4 in horizontal rows; portraits at 3:4; all with rounded corners.
- **Navigation:** a bottom tab bar with three tabs — **Home**, **Collections**, **Profile** — in that order, the active tab in the accent colour. Detail screens, search, browse-all, sign-in and add-to-collection are pushed **over** the tabs.
- **Orientation:** portrait; the layout must remain usable at tablet and desktop widths.

### 8.7 Keys, secrets and row-level security

Two credentials are involved and they have **opposite** exposure properties. Getting this distinction right matters more than any other security decision in the rebuild, because treating them the same way is wrong in both directions.

**The TMDB read token is a real secret.** It is tied to the operator's TMDB account and carries that account's quota and reputation. Anyone who extracts it can spend both. It must never reach a client build. See proposal **P18**.

**The Supabase anon key is publishable by design.** It identifies the project, not a person, and on its own it grants nothing — *provided* row-level security is enabled on every table with policies that scope each row to the authenticated member. Shipping it in a client is the intended pattern; hiding it achieves nothing. But shipping it with RLS off, or with one permissive policy on one table, exposes the entire database to anyone who reads the bundle. So:

1. RLS is **enabled on every table** holding member data. No exceptions, no "off for now".
2. Policies are written **per operation** — select, insert, update, delete — each scoped to the authenticated member.
3. The **service-role key is never used anywhere a user request can reach**, in a client or in a service, because it bypasses RLS entirely.
4. Owner columns **default to the authenticated member** server-side rather than being accepted from the caller, so a forged owner cannot be written.
5. Application-level owner filters are kept **in addition to** policies, never instead of them.
6. Policies are covered by tests that assert a second member cannot read, write or delete the first member's rows.

> `NOTE →` The current web build ships both the TMDB token and the Supabase anon key in the bundle behind a character-code transformation. For the anon key that is acceptable if RLS is complete, and the obfuscation adds nothing either way. For the TMDB token it is a genuine exposure. See defect **D12**.

---

## 9. The Catalogue: TMDB

### 9.1 What FavMov uses

Every read below is unauthenticated from the member's point of view — TMDB knows nothing about FavMov's members. Requests are authorised by the operator's own TMDB read token, sent as a bearer credential (§8.7).

| Need | TMDB read | Used by |
|---|---|---|
| Trending movies this week | `/trending/movie/week`, paged | F3, F4 |
| Trending TV shows this week | `/trending/tv/week`, paged | F3, F4 |
| Popular movies | `/movie/popular`, paged | F3, F4 |
| Search movies | `/search/movie` — query, page, adult filter **off** | F5 |
| Search TV shows | `/search/tv` — query, page | F5 |
| Search people | `/search/person` — query, page | F5 |
| A movie with its cast and crew in one response | `/movie/{id}` with credits appended | F6 |
| A show with its cast and crew in one response | `/tv/{id}` with credits appended | F6 |
| A person with their complete film **and** television credits in one response | `/person/{id}` with movie and TV credits appended | F7 |

Appending credits to the detail reads is not an optimisation to drop: the title screen (F6) and person screen (F7) are each specified to render in **one** round trip, and splitting them re-introduces the blank-then-pop the hand-off in F17 exists to prevent.

Paged reads return the results for the page plus a **total page count**, which is what bounds the infinite scroll in F4 and F5.

### 9.2 Images

TMDB returns image **paths**, not URLs. A usable URL is the image host, plus a size segment, plus the path. FavMov uses exactly two sizes:

| Size | Used for |
|---|---|
| A fixed width around 500px | Every poster, backdrop and portrait in lists and on detail screens. |
| Original | The full-screen viewer only (F8), and as the second stage of the progressive load on a title's backdrop. |

Any title or person may have a **null** path for any image. Every such case renders the product's own placeholder artwork (F18), never a broken frame.

### 9.3 Field mapping, and the movie/TV asymmetry

TMDB names the same concept differently for films and shows. The product normalises both into one internal shape at the boundary — one function, applied to everything, so that no screen ever branches on kind for these fields:

| Internal field | Movie | TV show |
|---|---|---|
| Title | `title` | `name` |
| Release date | `release_date` | `first_air_date` |
| Rating | `vote_average` (0–10, displayed to 2 decimals) | same |
| Rating count | `vote_count` | same |
| Overview, poster, backdrop, genres, runtime | same names | same names |

Cast entries carry an identifier, name, portrait path and **character**; crew entries carry an identifier, name, portrait path and **job**. Person credits carry the title's identifier, its title-or-name, poster, date, rating, vote count, and character-or-job.

Person records additionally supply: biography, birthday, place of birth, primary department, and gender as a **numeric code** — 1 female, 2 male, 3 non-binary, anything else unspecified — which the product renders as words (F7).

> `NOTE →` A TMDB identifier is unique only **within** a kind: movie 550 and show 550 are unrelated titles. This is the reason every title reference in this document is the pair `(kind, identifier)`, and the reason for proposal **P21**.

### 9.4 Operating constraints

1. **Rate limits.** TMDB has historically enforced per-IP request limits, and its current policy should be confirmed against their documentation before launch. The product's read pattern is bursty — four strips on Home, a page per scroll — which makes the caching in proposal **P18** worth doing on grounds of speed alone, quite apart from the key exposure.
2. **Attribution.** TMDB's API terms require attribution and prohibit implying endorsement. The current build carries none. See defect **D18**.
3. **Adult content** is excluded from title searches by an explicit request flag; it is not filtered afterwards, so the flag must be set on every search.
4. **Availability.** TMDB being down takes the entire signed-out product with it. This is the strongest argument for real error states with retry (**P4**) and for cached catalogue reads (**P18**).
5. **Regional and language variation.** All reads currently use TMDB's defaults, so titles, overviews and artwork come back in the default language. Localisation would be a per-request parameter, and is out of scope here.

### 9.5 If TMDB is replaced

This section is the contract. A replacement catalogue must be able to answer §9.1's nine questions, supply §9.3's fields, expose artwork in at least two sizes, and paginate with a knowable total. A catalogue that cannot return a person's complete cross-medium filmography in one read will force F7 to be re-specified.

## 10. Known Defects and Gaps in the Current Build

These are **not** requirements to reproduce. They are listed so the rebuild does not inherit them, and so that "the same features" is not read as "the same bugs".

| # | Severity | Issue |
|---|---|---|
| **D1** | High | **Guests never see the save action.** The heart is rendered only once collection status is known, and collection status is never requested for guests — so the sign-in prompt behind it is unreachable. The product's main conversion path is effectively dead. |
| **D2** | High | **"Create Collection" from the add screen's empty state navigates to Home**, not to the create form, abandoning the member mid-task. |
| **D3** | High | **Failed loads are silently hidden.** Home strips that fail render nothing; Search and Browse-all swallow errors and show "No results found." Nothing is retryable, and an outage looks like an empty catalogue. (Tracked in the repository's own to-do list as "handle error states".) |
| **D4** | Medium | **Browse-all paging.** The page counter is not reset when the strip changes, and the list is appended to rather than replaced, so entries can duplicate. The 500-page ceiling is arbitrary and is not the catalogue's real limit. |
| **D5** | Medium | **Search filter chips are hidden while typing** and reappear when results arrive, shifting the layout under the person's finger mid-interaction. |
| **D6** | Medium | **Collection card colours are random on every render**, so a collection has no stable visual identity. |
| **D7** | Medium | **No rename or delete for collections in the UI**, although deletion is implemented in the service. A mistyped collection name is permanent. |
| **D8** | Medium | **No remove or edit from Collection detail.** To remove a title or fix a note, the member must open the title and go back through the add screen. |
| **D9** | Medium | **Add-to-collection cannot be deep-linked.** It requires state handed over from the previous screen and, when opened cold, shows "Movie collections are needed" and navigates away. |
| **D10** | Medium | **Notes can be lost.** Auto-save fires a second after the last keystroke; navigating away sooner discards the edit, with no indication that anything was unsaved. |
| **D11** | Medium | **Title snapshots are written once and never refreshed.** A title saved early keeps its original rating, vote count and artwork forever, so collection rows drift out of date against the catalogue. |
| **D12** | Medium | **The TMDB read token is shipped in the client bundle**, behind a character-code transformation that anyone can undo by reading the bundle. It is tied to the operator's TMDB account and quota. *(The Supabase anon key is in the bundle too; that is by design and is safe **provided** row-level security is complete on every table — see §8.7.)* |
| **D13** | Low | **The collections order is applied twice**, with the size sort overriding the recency sort entirely — the recency pass has no observable effect except on ties. |
| **D14** | Low | **A removal error message is mis-assembled**, producing "Movie not found in collection." vs. a bare "TV Show" depending on kind. |
| **D15** | Low | **Duplicate checks are read-then-write**, not atomic; two rapid taps can race. The uniqueness rules should be enforced by a constraint, not by a prior read. |
| **D16** | Low | **No per-title link previews** — sharing a specific film shows the generic site card. (Tracked in the repository's own to-do list.) |
| **D17** | Low | **No pagination on collection detail or on "Your Favourites"** — a large collection is fetched and rendered whole. |
| **D18** | Low | **No TMDB attribution.** TMDB's API terms require crediting them as the data source and not implying endorsement; the product displays neither the attribution nor the mark. Confirm the current wording against TMDB's terms and add it — typically in an About or footer surface, which the product does not yet have. |
| **D19** | Low | **The sign-in email contains both a code and a magic link**, but only the code path is implemented. A member who taps the link rather than copying the code gets an inconsistent experience. See **P23**. |

---

## 11. Improvement Proposals

**Non-binding.** Each proposal names the problem, the change, and the cost. A rebuild can take all, some, or none — the baseline in Section 6 stands on its own.

### 11.1 Flow changes

**P1 — Always show the save action; sign in only at the moment of commitment.** *(fixes D1)*
Render the heart for everyone, outlined by default. A guest tapping it goes to sign-in **with the intent recorded**, and on return the add screen opens automatically for the title they were looking at. This turns the product's most motivated moment into its sign-up funnel instead of hiding it.

**P2 — Create a collection without leaving the flow.** *(fixes D2)*
Put "+ New collection" as the **first row** of the add screen, always visible — not only in the empty state. Creating one there checks it for the current title immediately. This removes the only dead end in the product and collapses flow 5.4 from five screens to one.

**P3 — Shorten the resend cooldown to 60 seconds** and state the code's real expiry on screen. Five minutes is long enough that a person who never received the email will assume the product is broken and leave.

**P5 — Keep the search filter chips fixed.** *(fixes D5)*
Show them always, above the results and below the field. Nothing about them needs to move. Better still, show a result count per scope so the person can see that their query matches a person even though the Movie tab is active.

**P6 — Remember recent searches, and suggest as you type.**
Keep the member's last handful of queries and show them under an empty search field, and surface title suggestions inline while typing. Search is the only route to a specific title, and it currently starts from nothing every time.

**P9 — Make Collection detail editable.** *(fixes D8)*
Add a swipe or overflow action per row for **Remove from this collection** and **Edit notes** (opening the note inline). The read screen is where people notice a wrong note; sending them through the title and the add screen to fix it is three navigations too many.

**P8 — Rename and delete collections.** *(fixes D7)*
Long-press or overflow on a collection card → Rename / Delete, with a confirmation naming the collection and its item count. The delete capability already exists in the service and only needs a surface.

**P10 — Make every screen deep-linkable.** *(fixes D9, enforces F17.4)*
The add screen should accept a title identifier and kind in its address and load everything it needs itself. Handed-over state stays a pure optimisation. This is also a precondition for P1's post-sign-in resume.

**P12 — Add an "All saved" view.** *(addresses the gap behind F14)*
A single chronological, searchable list of everything the member has ever saved, across all collections, reachable from the "Your Favourites" heading. Today, a member who cannot remember which collection a title is in has no way to find it. This is a small screen that changes the product from "lists" to "a library organised into lists".

### 11.2 Correctness and resilience

**P4 — Real error states with retry.** *(fixes D3)*
Every strip, grid and detail screen gets an explicit error state: a short human-readable line and a **Retry** action. Distinguish three cases — offline, service failing, genuinely empty — because the useful response differs for each. This is the single highest-value change in this list; it is also already on the project's own to-do list.

**P11 — Make note-saving visible and safe.** *(fixes D10)*
Keep the debounce, but: flush the pending save when the field loses focus or the screen is dismissed; show a quiet "Saving…" / "Saved" marker; and keep the local value if the save fails, with a retry. People type notes and leave immediately — that is the normal case, not the edge case.

**P15 — Per-title link previews.** *(fixes D16)*
Serve each title's and person's page with its own title, description and poster in the preview package, which requires the page to be rendered server-side or pre-rendered. A shared film link showing that film's poster is a meaningful acquisition channel for a product built around recommending titles to friends.

**P19 — Optimistic toggles with rollback.**
On the add screen, flip the checkbox immediately and reconcile with the service in the background, rolling back with a toast on failure. The current per-row spinner makes ticking four collections feel like four separate operations.

**P22 — Enforce uniqueness with constraints, not prior reads.** *(fixes D15)*
Make "one title per collection" and "one collection name per member (case-insensitive)" database-level constraints, and translate the violation into the user-facing message. Removes the race and one round-trip per write.

### 11.3 Model and architecture

**P16 — One title store with a `kind` field.** *(fixes the root cause behind several defects)*
Replace the parallel movie/TV stores and the boolean discriminator with a single store keyed by `(kind, catalogue_id)`. Every branch of the form "if it is a TV show, use this column, this table, this parameter" disappears — including the response-shaping code that merges two nullable joins into one row, and the whole family of bugs where a movie and a show sharing a numeric identifier collide.

**P18 — Proxy TMDB through FavMov's own service; leave Supabase direct.** *(fixes D12; enables P20)*
The client should never hold the TMDB token. Route catalogue reads through the backend, which holds it and can additionally:
- **cache** trending and popular results — they change at most daily, and this removes the large majority of TMDB traffic and most of Home's latency,
- normalise films and shows into one response shape at the boundary (§9.3), so the client never branches on kind,
- degrade gracefully, serving the last good response when TMDB is unavailable instead of an empty screen.

The opposite conclusion applies to Supabase: the anon key is meant to be public and policies are the real boundary (§8.7), so there is no security reason to proxy it, and doing so only adds a hop.

**P20 — Refresh snapshots on read.** *(fixes D11)*
When a collection is rendered, refresh any snapshot older than, say, a week from the catalogue in the background. With P18's proxy in place this is nearly free, and it keeps ratings and artwork from going stale in the one place the member looks at them most.

**P14 — Replace the change-timestamp mechanism with a keyed cache.** *(supersedes F16)*
A conventional client cache keyed by resource — with invalidation on the mutations that affect it — gives the same freshness guarantee with less bespoke code, adds request de-duplication and background revalidation, and makes optimistic updates (P19) straightforward. F16 exists to solve a problem this solves better.

**P17 — Order collections by recency, not size.** *(addresses D13)*
Sort by last-updated, newest first, and offer size as an explicit alternative if it is wanted. A newly created collection currently sorts last, which is the opposite of what the member expects at the moment they create it. Pick one sort and apply it once.

**P7 — Give each collection a stable colour.** *(fixes D6)*
Derive it deterministically from the collection's identifier, or let the member pick. Optionally, build the card from a mosaic of its first four posters, which both identifies the collection and shows what is in it.

**P13 — Minimal account management.**
Display name, and account deletion with an export of the member's collections and notes. The notes are the member's own writing; they should be able to take them with them and to erase them.

**P21 — Consistent identifier handling.**
Treat every title reference as the pair `(kind, identifier)` throughout — in links, in the hand-off store, in requests and in storage — rather than an identifier plus an optional flag that is sometimes a boolean, sometimes the string `"true"`, and sometimes absent. Most of the low-severity defects above are symptoms of this one inconsistency.

**P23 — Decide the magic-link question deliberately.** *(fixes D19)*
Supabase's email OTP sends a code *and* a link. Either edit the email template so the code is the obvious action and the link is absent, or implement the link path as a first-class route that lands the member back where they started. Shipping both while supporting one is the current state and it confuses people who tap rather than copy.

**P24 — Reconsider whether the middle tier is needed at all.**
Because authorisation is enforced by row-level policies rather than by service code (§8.2), the backend today is a thin layer doing four things: validating input, shaping responses, calling two database functions, and holding the TMDB token. Three of those can move — validation into database constraints (**P22**), shaping into the database functions, and the function calls into the client. The **TMDB token is the one thing that genuinely requires a server** (**P18**). A rebuild has a real choice here: keep a full service tier for future non-database work, or reduce the server to a thin cached TMDB proxy and let the client talk to Supabase directly. This document does not pick one; it only records that the current tier is not load-bearing for security, which is the usual reason to keep one.

---

## 12. Build Checklist

A suggested order for the rebuild, each step leaving a demonstrable product.

1. **Foundations** — navigation shell with the three tabs, the top bar, the visual language of §8.6, the loading / empty / error vocabulary of F18.
2. **Catalogue reads** — Home strips (F3), browse-all (F4), title detail (F6), person detail (F7), image viewer (F8), hand-off (F17). Ships as a complete guest-usable product.
3. **Search** (F5).
4. **Identity** — sign-in (F1), session and route protection (F2), profile (F15).
5. **Collections** — the data model (§7), the capability surface (§8.2), the ownership rule (§3.3), collections list (F9), create (F10), collection detail (F11).
6. **Saving** — add / remove (F12), notes (F13), save state on title detail, "Your Favourites" (F14), freshness (F16).
7. **Polish** — link addresses and previews (F19), environment separation (F20), TMDB attribution (D18), and whichever proposals from §11 are adopted.

**Two platform tasks sit outside this order and should be done first.** Before step 2, stand up TMDB access behind a server-side proxy with caching (**P18**) so no client build ever carries the token. Before step 5, write and test the row-level policies (§8.7) — they are the security boundary, and retro-fitting them to an application that already assumes open tables is far harder than starting with them on.

---

*Document derived from a full read of the existing frontend and backend source. Behaviours described in Sections 1–9 are observed from the code, not assumed; Sections 10 and 11 are analysis. TMDB and Supabase are named throughout as deliberate exceptions to the otherwise stack-agnostic framing, for the reasons set out in §1.6.*
