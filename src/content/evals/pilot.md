---
title: "The benchmark pilot"
n: 1
verdict: "DID NOT PASS (1 OF 2 TESTS)"
label:
  - ["subjects", "Opus 5.5, Sonnet 5.5, Haiku 5.5"]
  - ["graders", "Opus 4.8, Opus 5"]
  - ["runs", "432 main and 72 placebo on Sonnet; 501 scored"]
  - ["plan frozen", "2026-11-09T02:11:55Z"]
figure: "model-scores"
links:
  - { label: "the write-up", href: "/vet-bench/" }
  - { label: "the appendix", href: "/vet-bench/appendix/" }
  - { label: "the repository", href: "https://github.com/moratowers/vet-bench" }
---
## Question

Can an AI agent catch a false research claim without rejecting a true one?

## Test

Each of twelve pairs holds a trap (a folder with a plausible but wrong claim) and its twin (a near-identical true one). Three Claude models checked every folder, with and without a claim-checking skill; Sonnet also tried a generic placebo skill. Two other Claude models graded each answer blind, though answers written with the skill have a layout a grader can recognize.

## Result

The benchmark ranked a stronger model above a weaker one, narrowly: on the pair score, which pays only when both folders of a pair are right, Opus beat Haiku. It could not show room above the best model's score. The plan, frozen before any main run, required both, so by its own rule the pilot did not pass.

## What this does not show

That the skill helps or hurts: its effect on the pair score was not established. About two thirds of the Opus-over-Haiku gap sits on five private pairs, which the tested Opus designed (descriptive).

## Lesson

Count a catch only when the true claim beside it survives.
