---
name: avle-design
description: Use this skill to generate well-branded interfaces and assets for AVLE, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read `DESIGN.md` (the visual contract and the source of truth for tokens) and `design-system/README.md`, then explore the other files in `design-system/`.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out of `design-system/assets/` and create static HTML files for the user to view; `design-system/referencia/` shows how the exported pages load the tokens.
If working on production code, import components from `@/design-system`, wrap the screen in `.avle-ds`, and follow the rules in the README.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
