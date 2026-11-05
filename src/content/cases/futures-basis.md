---
title: "Futures basis against T-bills"
gate: "not_established"
cause: "blocked"
list_meta: "blocked. The basis came from trade prints, not a book you could trade at."
n: 4
of: 5
reviewed: "2026-09-29"
audit: "NOT ESTABLISHED"
evidence: "result table, no interval"
lesson: "Lesson"
---
## Hypothesis

CME bitcoin futures trade above spot. Buy spot, sell the future, hold to expiry, and the basis beats a T-bill. Cash and carry.

## Test

A kill line was set, and it did not fire. It sits in a private repository, so when it was set cannot be checked from outside. But the basis was measured from trade prints, not from a book you could have traded at.

## Cause of death

Blocked. The kill line not firing says the printed basis cleared the bar. It says nothing about the basis a real order would have got. The audit's check of this cause: consistent with its own record.

## Lesson

Measure a price from a book you could have traded, not from prints.
