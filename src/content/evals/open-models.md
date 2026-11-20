---
title: "Two open models"
n: 3
verdict: "3 OF 4 INTERVALS BELOW A COIN FLIP"
label:
  - ["subjects", "deepseek-v4.1-flash, qwen3.6-35b-a3b"]
  - ["grader", "Opus 4.8 only; a second failed its check"]
  - ["runs", "168"]
  - ["plan frozen", "before any paid call"]
  - ["date", "2026-11-11"]
links:
  - { label: "the write-up", href: "/vet-bench/#two-open-models-after-the-pilot" }
  - { label: "the results", href: "https://github.com/moratowers/vet-bench#results" }
  - { label: "the raw traces", href: "https://github.com/moratowers/vet-bench/tree/main/results/2026-11-11-open-models" }
---
## Question

What do two open models score on the seven public pairs?

## Test

Each pair has a trap (a folder with a wrong claim) and its twin (a near-identical true one). Two open models ran each task three times, with and without the checklist (the skill's text as a system prompt).

## Result

All four pair scores, which pay only when trap and twin are both right, were under 0.25, what a coin flip on the verdict earns if it always shows the key evidence. The per-answer reward ran 0.21 to 0.54. deepseek rejected nearly everything, which that reward pays and the pair score does not.

## What this does not show

Not comparable with the pilot: the tools were read-only. One grader, which saw the answers unredacted and so may have told the settings apart. The tasks and keys are public and the checklist was tuned on these traps, so a model may have seen them. The checklist's effect was not established.

## Lesson

Score each answer alone and you pay an agent for saying no.
