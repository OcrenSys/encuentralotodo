---
name: encuentralotodo-frontend-engineering-standards
description: 'Use when generating, refactoring, reviewing, or extending frontend code in EncuentraloTodo. Applies Nx monorepo structure, thin Next.js routes, AppShell layout, ui primitives, Tailwind plus global.css design tokens, tRPC plus React Query, React Hook Form plus Zod, clean code, SOLID when meaningful, KISS, and pragmatic testing.'
argument-hint: 'Describe the frontend feature, screen, refactor, component, or standards check you need.'
user-invocable: true
disable-model-invocation: false
---

# EncuentraloTodo Frontend Engineering Standards

## When To Use

- Generate or refactor frontend code in the web app.
- Build management screens, discovery screens, forms, layout pieces, or shared UI.
- Review code for architecture drift, design system violations, or duplicated patterns.
- Extend the design system, primitives, or layout system without creating parallel patterns.

## Project Context

This project is a Nx monorepo with:

- apps:
  - web: Next.js App Router for management and discovery
  - api: Express plus tRPC
  - mobile: Expo
- shared packages:
  - ui: design system and primitives
  - types: Zod schemas and domain contracts
  - utils: helpers like `cn`
  - config and auth

The frontend follows:

- thin route pages plus feature screens
- `AppShell` as the canonical management layout
- tRPC plus React Query for data
- Zod as the domain validation source
- Tailwind plus `global.css` tokens as the design system

## 1. Core Principles

### Mandatory

- Apply Clean Code.
- Apply SOLID when meaningful.
- Prefer KISS over abstraction.
- Prefer readability over cleverness.
- Prefer consistency over personal style.

### Philosophy

This project prioritizes MVP speed with scalable foundations.

That means:

- no overengineering
- no shortcuts that break the system

## 2. Architecture Rules

### Structure

- Routes in `app/` must remain thin.
- Logic lives in screens under `modules/` when working on management areas.
- Shared logic goes to hooks, utils, or service-like helpers.

### Separation

- Never mix presentation, business logic, and data fetching in one place unless the logic is truly trivial.

### Composition Pattern

```ts
// GOOD
page.tsx -> Screen -> components

// BAD
page.tsx with logic + UI + data
```

## 3. Design System

### Single Source Of Truth

For the web app, the design system is driven by:

- `apps/web/src/app/global.css`
- `tailwind.shared.cjs`

`packages/config/src/lib/theme.ts` is not the source of truth for web styling decisions.

### Mandatory Rules

Never:

- hardcode colors
- use arbitrary gradients
- use random rgba values
- define spacing outside the Tailwind scale
- create new visual patterns ad hoc

Always:

- use semantic classes
- use existing primitives
- extend the system if needed instead of bypassing it

### Surface System

Use only the system-defined surface variants:

- `surface-default`
- `surface-soft`
- `surface-elevated`
- `surface-inset`
- `surface-brand` when a dark branded surface is intentionally required by the system

Do not invent new card styles locally in screens.

### Radius And Shadow

Use only system-defined values.

Forbidden examples:

- `rounded-[22px]`
- `shadow-[random]`

## 4. UI Primitives

### Mandatory Usage

Official primitives from `ui` include:

- `Button`
- `Card`, `Panel`, `Surface`
- `Badge`
- `Input`, `Select`, `Textarea`
- `FormField`, `FormSection`
- `LoadingSkeleton`, `EmptyState`
- navigation primitives used by public discovery flows

Rule:

- If a primitive exists, you must use it.
- If it does not exist, create it in `packages/ui`, not locally in a screen.

Forbidden:

- duplicating UI patterns in screens
- styling inputs manually in pages
- repeating inline Tailwind styling everywhere

## 5. Layout System

### Canonical Shell

`AppShell` is the only management shell.

It includes:

- `Sidebar`
- `Topbar`
- `BottomNav` for mobile
- `RoleSwitcher`

### Rules

- All management pages must use `AppShell`.
- Do not create new shells.
- Do not duplicate navigation logic.

## 6. Forms System

### Mandatory Stack

- React Hook Form
- Zod schemas from `types`
- Shared form primitives from `ui`

### Required Pattern

- `useForm` plus `zodResolver`
- `FormField`
- `Input`, `Select`, `Textarea`
- consistent error handling

Forbidden:

- manual form styling
- inconsistent validation rules defined only in the frontend
- duplicated field markup

## 7. Data And Fetching

### Standard

- tRPC plus React Query

### Rules

- No raw `fetch` in components when the data belongs to the app contract.
- Do not mix data logic directly into presentational UI when it can be isolated.
- Always handle loading, error, and empty states where meaningful.

### Types

- Always use shared types and schemas from `types`.
- Never redefine domain schemas in the frontend.

## 8. State Management

### Rules

- Keep state minimal.
- Avoid duplication.
- Derive state when possible.
- Avoid unnecessary `useEffect`.

Avoid:

- effect-based logic that could be computed
- large state objects without structure

## 9. Naming Conventions

### Rules

- Names must be semantic and explicit.

Good examples:

- `selectedRole`
- `promotionStatus`
- `resolvePermissions`

Bad examples:

- `data`
- `item`
- `value`
- `temp`

## 10. Accessibility Baseline

Required:

- semantic HTML
- labels in forms
- buttons for actions
- keyboard support
- visible focus states

Forbidden:

- clickable divs
- missing labels
- hidden focus states

## 11. Performance

### Rules

- Avoid unnecessary rerenders.
- Split large components when responsibilities drift.
- Avoid heavy logic in render.
- Use client components only when needed.

### Next.js

- Prefer server components when possible.
- Avoid overusing `use client`.

## 12. Testing

### Required

Testing is mandatory but selective.

Must test:

- meaningful logic
- data transformations
- critical UI behavior

Not required:

- trivial UI rendering
- static components with no meaningful logic

Avoid:

- overtesting
- brittle tests

## 13. Patterns To Follow

Mandatory patterns:

- thin routes plus screens
- centralized navigation in `management-navigation.ts`
- role simulation via provider
- shared schemas via Zod
- primitives-based UI
- semantic Tailwind tokens

## 14. Anti-Patterns

Strictly forbidden:

- hardcoded styles in screens
- arbitrary Tailwind values
- duplicated tokens between `theme.ts` and `global.css`
- ad hoc UI outside primitives
- duplicated form logic
- oversized components with mixed responsibilities
- mixing UI and business logic
- creating new layout systems
- bypassing the tRPC pattern
- missing loading or empty states where they matter
- unnecessary client components
- leaving demo or mock logic in production paths

## 15. Definition Of Done

A feature is not complete unless it:

- uses the design system correctly
- uses shared primitives
- follows the established architecture
- has proper loading, error, and empty states when meaningful
- is responsive
- is readable and maintainable
- has no hardcoded styling drift
- has tests where meaningful
- passes lint and type checks

## 16. Copilot Expectations

Generated code must:

- follow existing architecture
- reuse primitives
- avoid hardcoding
- be minimal and scoped
- be readable and explicit
- not introduce drift
- not break the design system
- not create parallel patterns

## 17. Guiding Principle

Always prefer:

- simple
- clear
- consistent
- scalable

Over:

- clever
- complex
- fast but dirty
