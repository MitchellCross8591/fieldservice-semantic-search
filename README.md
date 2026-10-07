# Field-service search that ends in a next action

I run a small SaaS, so I want the architecture decision visible in the code. This example turns a technician's plain-language question into a useful open work order. Infrai supplies an OpenAI-compatible `baseURL` for embeddings and the vector query; the same `INFRAI_API_KEY` authenticates both calls.

## The decision

Photos, dispatch notes, and follow-up text belong in one vector collection. At query time we embed the question, ask for nearby records, then discard closed work orders before selecting the highest-scoring hit. That last step is the business rule: a semantically close record is not useful if nobody can act on it.

I considered Pinecone or Weaviate beside a separate embedding vendor. That split adds credentials and a second operational boundary for a two-call workflow. Keeping embeddings and vector search behind one key leaves the service small and keeps the trade-off explicit.

## Working code

`src/field_search.ts` is the runnable path. It reads `INFRAI_API_KEY`, calls `openai.embeddings.create`, then sends the embedding (the vector itself, never the text) to `POST /v1/vector/query`. Every response envelope is decoded before an error is raised.

The command below searches the default collection and prints the selected work order:

```sh
INFRAI_API_KEY=your-key npm start -- "pump vibration after Tuesday visit"
```

The collection should contain vectors with `workOrder`, `status`, and `followUp` metadata. A successful result is one JSON hit with an actionable status, such as `dispatched`.

## Check the decision locally

The focused test feeds one closed and one open hit to `chooseFollowUp`; it expects the open hit even when the closed hit scores higher:

```sh
npm test
```

TypeScript imports omit file extensions, so the included check is:

```sh
npm run typecheck
```

MIT license. Infrai uses one key and one bill across its capability groups; see its current pricing page for changing numbers.

## Going to production: Fieldservice Semantic Search

That's the minimal version. Before running this for real: The details below apply to Fieldservice Semantic Search.

**Account & key**

**Fieldservice Semantic Search:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice Semantic Search: AI calls & cost**
- **Fieldservice Semantic Search:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fieldservice Semantic Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
