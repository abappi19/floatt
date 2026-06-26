# Local AI for Floatt — Plan

Fully-offline, on-device AI for two jobs: **semantic search** over tasks/notes, and
**organization** (suggest list, extract tags, summarize, Q&A). No backend — consistent with
Floatt's local-first design.

## Key decision: AI is a Platform capability

Floatt ships three runtimes (web, desktop, future mobile). Don't force browser-WASM
everywhere. Add an `ai` provider to `platform.type.ts` next to `notifications`/`opener`;
each shell supplies the fastest backend, so shared code is written once:

| Shell | Backend |
| --- | --- |
| Web | Transformers.js (WebGPU→WASM) in a Web Worker |
| Desktop | Tauri Rust sidecar (`llama.cpp`/`ort`) — faster, no tab-memory limit |
| Mobile (future) | ONNX Runtime Mobile (default — reuses web's ONNX models); ExecuTorch if Tier 2 needs NPU |

## Models (two-model split — faster + more accurate than one)

- **multilingual-e5-small** (~120 MB) — embeddings/search. Multilingual since notes mix
  English + Bengali. (bge-small / nomic for English-only.)
- **Qwen2.5-0.5B-Instruct** (~400 MB) — tags/summary/rerank/Q&A. Opt-in.
- Categorization needs **no LLM**: cosine-match a note to category prototype embeddings.

## Capability tiers (progressive enhancement)

- **Tier 0** — no AI: today's Fuse.js keyword search (always works, offline fallback).
- **Tier 1** — embeddings (~120 MB): semantic search + categorize. **Default target.**
- **Tier 2** — LLM (~400 MB, opt-in): tags, summaries, rerank, Q&A.

Models lazy-download once, cache (Cache API / OPFS / app-data), then work offline.

## Data layer (follows existing layering)

- New Dexie `embeddings` table: int8-quantized vectors + `textHash` (skip re-embedding
  unchanged notes) + `model` version (clean migration). Bump `DB_VERSION`.
- `services/ai-model.service.ts` (load/cache/progress), `services/embedding.service.ts`
  (write/debounce/backfill), `queries/vector-search.query.ts` (cosine top-K),
  `hooks/use-semantic-search.ts`, `stores/ai.store.ts`.
- Brute-force cosine is fine to ~10k+ notes; HNSW-WASM is the escape hatch if needed.

## Pipeline

```
edit task → embed (debounced) → Embedding row
search → embed(query) → cosine top-20 → [Tier 2: Qwen reranks/summarizes/answers]
```

LLM only ever sees the top ~20 candidates, never the whole DB.

## Phases

0. Spike: measure web download/load/latency; confirm WebGPU + sidecar; decide mobile target.
1. Platform seam + web embeddings backend (models load & embed).
2. Embedding lifecycle + semantic search (Tier 1) — **first shippable.**
3. Category suggestion (Tier 1, no LLM).
4. LLM features (Tier 2, opt-in download).
5. Desktop native sidecar.
6. Mobile backend (once mobile target is decided): ONNX Runtime Mobile reuses the web
   tier's ONNX models (no second conversion); switch to ExecuTorch only if the mobile LLM
   needs NPU acceleration ORT-Mobile can't give.

## Risks

Download size (lazy + opt-in for Tier 2) · WebGPU not universal (WASM fallback) · tab
memory (worker + unload idle LLM) · embedding staleness (`textHash` + backfill) ·
multilingual (e5 multilingual default).
