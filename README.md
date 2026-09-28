# Wolfie Lists — CSE 316 Homework 3

The Wolfie Lists application from HW2, looking and behaving the same, rebuilt as
a full stack MERN application: **M**ongoDB stores the lists, an **E**xpress server
on **N**ode serves them through a small REST API, and the **R**eact client talks to
it. There are no user accounts yet; those arrive in HW4.

You are given a partly built application. Your job is to finish it, and to write
two small test files. You have the HW2 solution as well, and you are welcome to
look at anything in it.

The one design rule that shapes everything: **the home screen is given metadata,
never lists.** `GET /api/lists` returns `{ id, name, itemCount, completedCount }`
for each list, and a list's items are fetched only when the user opens it. Local
storage now holds only a cached copy of that metadata.

---

## Running it

You need **Node 20.19 or later** and **MongoDB Community Server**, installed and
running on its default port, 27017.

```
npm install                          # installs the client and the server
copy server\.env.example server\.env # macOS/Linux: cp server/.env.example server/.env
npm run seed                         # wipes the database and loads the example lists
npm run dev                          # Express on 4000 and Vite on 9000, together
```

Then open http://localhost:9000. Vite forwards every `/api` request to Express
(see `client/vite.config.js`), so the browser only ever talks to one origin.

The application runs on a fresh checkout. The home screen shows your lists, and
you can open one, edit its items and delete a list. But the **+** button does
nothing, duplicating a list fails, nothing you change inside a list is saved,
Undo and Redo never light up, and every item loses its priority, target date and
completed mark on its way into the database.

---

## The tests are the specification

```
npm test            # the server's tests, then the client's (Vitest)
npm run test:e2e    # the whole application in a real Chrome (Playwright)
```

The whole test suite ships with this project and describes the finished
application. On a fresh checkout many tests fail. **Making them pass is the
assignment**, together with writing the two test files described in part 7.
When `npm test` and `npm run test:e2e` are both green, and your own tests are
written, you are done.

| Tier | Where | What runs |
|---|---|---|
| server unit | `server/tests/unit` | the schema's validation, the DTOs, no database |
| server integration | `server/tests/integration` | real HTTP requests (Supertest) against the real app and a real MongoDB running in memory |
| client unit | `client/tests/unit` | the model, `api.js`, the cache, `useUndoRedo` |
| client integration | `client/tests/integration` | components, contexts and hooks together, against a fake server that stands in for `fetch` |
| end to end | `tests/e2e` | Chrome, Vite, Express and an in-memory MongoDB together |

None of the tests need your MongoDB running, and none of them touch your
`wolfie_lists` database: they start a throwaway MongoDB in memory. The first run
downloads it (several hundred MB, once) into your user cache, so the first
`npm test` is slow.

The end-to-end tests drive the Google Chrome already installed on your machine.
If Playwright says it cannot find a browser, run `npx playwright install chromium`
and delete the `channel: 'chrome'` line in `tests/e2e/playwright.config.js`.

---

## What you have to build

Work through these in order. Each one makes the next easier to see working.

### 1. The item schema and its DTO

Open `server/src/models/List.js`. An item in the database has only an `id`, a
`description` and a `dateEntered`. The client already sends three more fields
with every item, and Mongoose silently drops them, because **Mongoose saves only
the fields a schema names.** That is why the example lists lose their priorities
and completed marks when you run `npm run seed`.

Add the three missing fields to the item schema, with validation:

- `priority`: one of `High`, `Medium` or `Low`, and `Low` when none is given
- `targetDate`: a `YYYY-MM-DD` string like `dateEntered`, or `null` when there is
  none, which is also the default
- `completed`: true or false, and false when none is given

The rules already on `description` and `dateEntered` are the examples to
follow, and the Mongoose documentation on
[validation](https://mongoosejs.com/docs/validation.html) lists every built-in
rule.

The schema is not the only place an item's shape is written down. Open
`server/src/dto/listDTO.js`: `toItemJSON` decides exactly which fields of an item
cross the network, and it names only the same three. It works in **both
directions**. `toListJSON` uses it on the way out, so the client never *sees* a
field it leaves out, and `fromRequest` uses it on the way in, so the server never
*accepts* one. Add the three fields there too. Until both the schema and the DTO
name a field, it cannot make the round trip from the client to the database and
back.

Run `npm run seed` again afterward.

### 2. Three routes on the server

`GET /api/lists`, `GET /api/lists/:id` and `DELETE /api/lists/:id` are written, in
`server/src/routes/listRoutes.js` and `server/src/controllers/listController.js`.
Add the other three, a route and a controller function for each:

| Method and path | Does | Answers |
|---|---|---|
| `POST /api/lists` | makes a new, empty list at the bottom of the home screen, named `Untitled List`, or `Untitled List 2`, `3` and so on if that is taken | 201, the new list's metadata |
| `PUT /api/lists/:id` | replaces the list's name and items with the ones sent | 200, the list's new metadata |
| `POST /api/lists/:id/duplicate` | copies the list, items and all, directly beneath the original, named after it with ` (Copy)` on the end, or the next name that is free | 201, the copy's metadata |

Everything you need is already written. `List.js` exports `buildUnusedName`,
`DEFAULT_LIST_NAME`, `MAX_NAME_LENGTH` and `newItemId`; `listDTO.js` exports
`toMetadata`, `toItemJSON` and `fromRequest`; and a list's place on the home
screen is its `position` field, lowest first. Some details the tests hold you to:

- a PUT whose body lacks a `name` string or an `items` array answers **400**, and
  a PUT never moves a list, whatever it sends
- every copied item gets a new id of its own (`newItemId`), and a copy's name is
  cut to 60 characters
- an id no list has answers **404**, exactly as the given routes do

You do not need `try`/`catch` in a controller. Express 5 passes anything thrown to
the error handler in `server/src/middleware/errorHandlers.js`, which turns a
failed validation into a 400 and an unknown id into a 404.

### 3. Three calls in `api.js`

`client/src/api/api.js` is the only file in the client that knows the server
exists. It has `getAllMetadata`, `getList` and `deleteList`. Add the three that
match part 2: `createList()`, `saveList(list)` and `duplicateList(id)`.
`saveList` sends only the list's `name` and `items`.

### 4. Creating and duplicating a list

In `client/src/context/ListsContext.jsx`, add `createList()` and
`duplicateList(listId)`, and put them in the context's value, where `HomeView`
already looks for them. `deleteList` is the example to follow.

- A new list **opens straight away**, with its name selected so the user can type
  over it. `listNeedingNameFocus` is how `ListView` knows to do that.
- A copy appears **directly beneath its original** and is **not** opened.
- Both wait for the server's answer before the screen changes, and neither is
  undoable. If the server refuses, show an alert titled
  `The List Could Not Be Created` or `The List Could Not Be Duplicated`, and
  change nothing.

### 5. Saving the open list

In `client/src/context/CurrentListContext.jsx`, the list is fetched when it is
opened, but nothing is ever sent back. Add an effect that saves the whole list
with `saveList` **after every change, undo and redo included**, and then passes
the server's answer to `updateMetadata`, so the card on the home screen shows the
new name and counts.

- Send exactly **one save per change**. In particular, do not send a list back to
  the server just because it was loaded from there.
- If a save fails, keep the change on screen and show an alert titled
  `Changes Were Not Saved`.

### 6. Undo and redo: `useUndoRedo`

HW2 used jsTPS and the **Command** pattern: every kind of edit was a class that
knew how to do itself and how to undo itself. HW3 uses the **Memento** pattern
instead: before every edit, keep the old version of the list. Undo does not
reverse anything; it goes back to the snapshot before.

`client/src/hooks/useUndoRedo.js` is a placeholder that keeps only the present
value. Replace its insides with a real history:

```
past      [oldest, ..., newest]   what undo can go back to
present   the value on screen
future    [next, ..., furthest]   what redo can go forward to
```

- `set(updater)` moves the present into the past, makes `updater(present)` the
  new present, and throws the future away
- `undo()` and `redo()` step back and forward, and do nothing when there is
  nowhere to go; `canUndo` and `canRedo` say whether there is
- `reset(value)` starts again with nothing to undo or redo
- the past holds at most `LIMIT` (100) snapshots, oldest forgotten first

Keep what the hook returns exactly as it is. `useListEditor` already makes every
edit through `change`, which is `set`, so nothing else has to change for undo to
work everywhere. Keeping a snapshot is cheap because the model never changes a
list in place: every edit builds a new list that shares its unchanged items with
the old one.

### 7. Two test files

Each file is already set up, with its imports and helpers written, and holds a
list of `it.todo('...')` entries. Each one names a test you write: change
`it.todo('name')` to `it('name', () => { ... })` and write the body. **Keep the
names exactly as they are**, because they are how your tests are graded. Your
tests must pass against a correct server, and each should fail against a server
that gets the behavior in its name wrong.

- **A unit test: `server/tests/unit/toMetadata.test.js`.** `toMetadata` is a pure
  function, so each test makes a list, calls `toMetadata` and checks the answer.
  No database is needed. `listDTO.test.js` tests the other DTO functions and
  shows how.
- **An integration test: `server/tests/integration/duplicateList.test.js`.** Each
  test puts lists in the in-memory database, sends a real request to the real app
  with Supertest, and checks the response and what the database now holds.
  `listsApi.test.js` tests every other route the same way.

Some of these tests cannot pass until the schema has its missing fields, so do
part 1 first.

---

## The names your code has to use

The tests find things by name, so these must be spelled exactly as they appear
here. Everything else is yours.

| Where | Name |
|---|---|
| `List.js`'s item schema, and `toItemJSON` in `listDTO.js` | `priority`, `targetDate`, `completed` |
| the three routes | `POST /api/lists`, `PUT /api/lists/:id`, `POST /api/lists/:id/duplicate` |
| `client/src/api/api.js` | `createList()`, `saveList({ id, name, items })`, `duplicateList(id)` |
| `ListsContext`'s value | `createList()`, `duplicateList(listId)` |
| alert titles | `The List Could Not Be Created`, `The List Could Not Be Duplicated`, `Changes Were Not Saved` |
| `useUndoRedo` | returns `{ present, set, undo, redo, reset, canUndo, canRedo }`, and exports `LIMIT` |
| your test files | the names in their `it.todo` entries |

---

## What you have been given

| Provided | |
|---|---|
| `server/src/app.js`, `server.js` | the middleware chain, and connecting to MongoDB before listening |
| `server/src/models/List.js` | the list schema, and the item schema without its last three fields |
| `server/src/controllers/`, `routes/` | the three routes that read and delete |
| `server/src/dto/listDTO.js` | exactly what crosses the network, in both directions, with `toItemJSON` missing the same three fields |
| `server/src/middleware/` | the request logger, the 404, and the error handler |
| `server/scripts/seed.js`, `data/` | `npm run seed` and the example lists |
| `client/src/components/` | every component, already changed for HW3 |
| `client/src/context/` | `ModalContext`; `ListsContext` without create and duplicate; `CurrentListContext` without saving |
| `client/src/hooks/` | `useListEditor`, `useUndoRedoShortcuts`, and the `useUndoRedo` placeholder |
| `client/src/api/api.js` | the request plumbing, and three of the six calls |
| `client/src/model/`, `data/`, `common/` | the list model, the metadata cache, dates and ids |

---

## How the code is arranged

```
client/                the React app (Vite, Tailwind v4)
  src/api/api.js         the only file that knows the server exists
  src/data/              the local storage metadata cache
  src/context/           ListsContext (metadata), CurrentListContext (the open list)
  src/hooks/             useUndoRedo, useListEditor, useUndoRedoShortcuts
  src/model/             pure functions over plain list and item objects
  tests/                 unit/ and integration/
server/                the Express API
  src/models/            M: the Mongoose schema
  src/controllers/       C: one function per kind of request
  src/routes/            which URL goes to which controller
  src/dto/               exactly what crosses the network
  src/middleware/        request logger, 404, error handler
  src/app.js             builds the app (the middleware chain); server.js starts it
  data/                  starter_lists.json, read by npm run seed
  tests/                 unit/ and integration/
tests/e2e/             Playwright specs and config
```

Errors from the API are always `{ error: "message" }`: 400 for invalid data or
malformed JSON, 404 for an unknown list or route, and 500 for anything else.

**Three rules the design depends on.**

1. **The server decides what a list is.** Names like `Untitled List 2` and
   `(Copy)`, positions, and the validation of every field all live on the
   server, because only it sees every list.
2. **Nothing changes a list or an item in place.** Every function in
   `client/src/model` returns a new object. React needs that to redraw, and
   `useUndoRedo` needs it so an old snapshot stays as it was.
3. **Every change inside a list sends the whole list.** Undo is just another
   change: the server never knows an undo happened.

