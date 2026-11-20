---
title: "The reward audit"
n: 2
verdict: "PAIR SCORE HELD ON PRE-RUN MARKS"
label:
  - ["subjects", "ten scripted answers, no trained model"]
  - ["graders", "Opus 4.8, Opus 5"]
  - ["registered", "before any run; predictions for two answers revised later"]
  - ["kind", "a description, not a test"]
links:
  - { label: "the write-up", href: "/vet-bench/#a-score-that-shows-both-folders-can-be-gamed" }
  - { label: "the appendix", href: "/vet-bench/appendix/#a17" }
  - { label: "the repository", href: "https://github.com/moratowers/vet-bench" }
---
## Question

Can an answer win the score without checking the claim?

## Test

Before any run, the plan registered ten scripted answers and asked what each would earn under four rewards. Among them: always reject, a hedge, and a skeptic who cites the right evidence and never agrees. No model was trained or run under them.

## Result

Scored on the verdict alone, against the answer key, a fixed answer matched a coin flip. On the pair score, which pays only when both folders of a pair are right, no scripted answer reached a coin flip's 0.25. With both folders in one episode, the reward broke.

## What this does not show

The pair scores are pre-run marks; in the main grading the hedge passed one of its three pairs under both graders and the skeptic one of three under one grader. Predictions for two answers were revised after the first marks, and 5 of the 10 scripted answers missed a registered range.

## Lesson

Form a paired score across separate episodes, never inside one.
