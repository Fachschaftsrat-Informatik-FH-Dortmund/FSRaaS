# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo does **not** use the generic `CONTEXT.md` / `docs/adr/` convention. It has its own spec-anchored system, documented fully in `CLAUDE.md` at the repo root — read that file first, it is the authoritative map. The summary below is only a quick-reference for skills.

## Before exploring, read these

- **`CLAUDE.md`** at the repo root — the entry point; explains the spec-anchored workflow and where everything lives.
- **`openspec/specs/<capability>/spec.md`** — current, in-force requirements for a feature capability. This is the equivalent of a "spec" in other repos and takes priority over reading the code to infer intent.
- **`openspec/specs/integrations/spec.md`** — the only place external-system calls (endpoints, auth) are described. Never trust a feature-capability spec for endpoint details.
- **`openspec/specs/api-contract.yaml`** — the contract between app and backend; types are generated from it, never hand-written.
- **`openspec/changes/<name>/`** — in-flight change proposals (Proposal → Spec-Delta → Design → Tasks), the equivalent of a design doc / RFC in progress. Check here before assuming a capability spec is final.
- **`specs/decisions/*.md`** — this repo's ADRs. Read ones that touch the area you're about to work in. Numbered, not renumbered once assigned.
- **`specs/product/glossary.md`** — the domain vocabulary. If a term conflicts with prose elsewhere, the glossary wins.
- **`specs/product/roadmap.md`** and **`specs/product/legacy-inventory.md`** — what's planned next, and what the two predecessor apps (under `alte apps/`) could and couldn't do. Useful context, not something to copy from.

If a spec, ADR, or the glossary doesn't have an answer, **proceed silently** — don't flag the absence or suggest creating generic `CONTEXT.md`/`docs/adr/` files instead; that would create a second, competing source of truth. Use the `openspec-propose` / `opsx:propose` skill (or `/schnitt`) to add missing specs the way this repo already does it.

## Requirement provenance

Every requirement in `openspec/specs/` carries exactly one provenance marker, given as a closing "Herkunft: …" sentence in the requirement text: `Alt: <pfad>:<zeile>`, `NEU`, `Android: unbekannt`, `Alt: bewusst verworfen`, or `Recherche: <quelle>, <datum>`. When citing or writing a requirement, preserve or add this marker — it signals how trustworthy the requirement is.

## The core rule

> **Keine Verhaltensänderung ohne Spec-Delta im selben Merge.**

No behavior change without a spec delta in the same merge. A skill proposing or implementing a code change in this repo should propose the matching `openspec/changes/<name>/` spec delta alongside it, not after.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `specs/product/glossary.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap worth raising with the user.

## Flag decision conflicts

If your output contradicts an existing ADR in `specs/decisions/`, surface it explicitly rather than silently overriding:

> _Contradicts ADR 0010 (OIDC gegen Authentik), but worth reopening because…_
