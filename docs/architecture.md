# Architecture (MVP)
1. **server** receives GitHub webhooks.
2. **worker** checks out repo, analyzes changes (ts-morph), updates docs, optionally runs codemods, runs tests, and opens a PR.
3. **web** shows runs + settings.

_Planned queue_: Redis Streams; _DB_: Postgres.
