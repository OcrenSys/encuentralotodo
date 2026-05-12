---
name: encuentralotodo-backend-engineering-standards
description: 'Use when generating, refactoring, reviewing, or extending backend code in EncuentraloTodo. Applies Express plus tRPC architecture, shared domain contracts and Zod schemas, typed request context, Router to Service to Repository layering, Prisma persistence boundaries, server-side authorization, domain integrity, scalable CRUD, and pragmatic backend testing.'
argument-hint: 'Describe the backend feature, router, service, repository, auth rule, CRUD flow, or standards check you need.'
user-invocable: true
disable-model-invocation: false
---

# EncuentraloTodo Backend Engineering Standards

## When To Use

- Generate or refactor backend code in the API app.
- Add or review routers, services, repositories, authorization logic, or persistence code.
- Extend shared validation, domain rules, or backend-side integrations.
- Review backend code for architecture drift, permission gaps, or weak domain integrity.

## Context

This project uses a backend architecture based on:

- API app with Express plus tRPC
- shared domain contracts and Zod schemas
- Prisma schema already defined
- current runtime still backed mostly by in-memory store logic
- typed request context
- role-aware product needs for SuperAdmin, Owner, Manager, and User

The backend is transitioning from:

- mock or in-memory MVP behavior

to:

- real DB-backed CRUD with Prisma
- real authorization rules
- stronger business integrity

This skill defines the backend standards that must be followed when generating, refactoring, or extending backend code.

## 1. Core Principles

### Mandatory

- Apply Clean Code.
- Apply SOLID when meaningful.
- Prefer KISS.
- Prefer clarity over cleverness.
- Prefer explicitness over magic.
- Prefer consistency over improvisation.

### Backend Philosophy

This project prioritizes MVP delivery with scalable backend foundations.

That means:

- keep implementations simple
- do not introduce shortcuts that damage domain integrity, security, or maintainability

## 2. Canonical Backend Architecture

### Required Flow

```txt
Router -> Service -> Repository
```

### Responsibilities

Router:

- receives request input
- validates input through shared Zod schemas
- resolves auth and permissions through procedures and context
- delegates to a service
- returns the result

Service:

- contains business rules
- orchestrates domain behavior
- validates ownership and authorization at business level
- coordinates repositories and side effects
- must not depend on HTTP concepts

Repository:

- encapsulates persistence access
- owns Prisma queries
- maps DB data to domain or application shapes when needed
- contains no business rules except persistence-specific constraints

### Forbidden Architecture

Do not:

- place business logic directly inside routers
- place authorization decisions only in the frontend
- place domain rules inside Prisma queries
- grow a god store that mixes all domains
- call Prisma directly from routers
- use a store as a long-term replacement for service and repository layering

## 3. Router Rules

### Routers Must Stay Thin

Routers are transport adapters, not business engines.

Routers may:

- parse input
- call procedures
- access context
- call one or more services if justified
- translate known service errors to API errors if needed

Routers must not:

- contain multi-step domain workflows
- enforce ownership logic inline repeatedly
- build complex domain objects manually
- contain large branching business rules
- contain direct persistence logic

### Procedure Usage

Use explicit procedure categories.

Required direction:

- `publicProcedure` only for truly public read-only or public-safe operations
- protected procedures for authenticated behavior
- admin procedures for platform-level actions
- owner and manager-aware procedures must be introduced for business-scoped mutations

Forbidden:

- public mutations for business-critical write operations
- trusting role simulation from the frontend as an authorization source

## 4. Service Layer Rules

### Service Layer Is Mandatory For Meaningful Backend Work

Every domain with non-trivial logic must have a service.

Examples:

- `BusinessService`
- `ProductService`
- `PromotionService`
- `ReviewService`
- `LeadService`
- `MembershipService`
- `AdminService`

### Service Responsibilities

Services should handle:

- business rules
- authorization and ownership checks
- orchestration across repositories
- consistency rules
- domain-specific validation beyond schema shape
- side-effect coordination

Examples:

- whether a manager can edit a business
- whether a product can be featured under the current plan
- whether a promotion can be published
- whether a business can transition status
- whether an owner can invite a manager

### Service Rules

Do:

- keep methods intention-revealing
- keep services domain-focused
- extract reusable rule helpers when needed
- use injected repositories and dependencies

Do not:

- make services depend on Express or tRPC specifics
- return raw DB objects if domain mapping is needed
- mix multiple unrelated domains in one service
- create giant service files with every rule in one place

## 5. Repository Rules

### Repository Layer Is The Persistence Boundary

Repositories own:

- Prisma access
- query composition
- persistence reads and writes
- entity lookup helpers
- transactional persistence patterns where needed

### Repository Responsibilities

Examples:

- `findById`
- `findBySlug`
- `listByBusinessId`
- `create`
- `update`
- `delete`
- `exists`
- `findMembership`
- `listPendingApprovals`

### Repository Rules

Do:

- keep queries readable
- keep methods domain-oriented
- centralize repeated Prisma access patterns
- return stable shapes expected by services

Do not:

- place business rules here
- place auth logic here
- place UI-specific formatting here
- leak Prisma implementation details everywhere else

## 6. Prisma And Persistence Standards

### Prisma Is The Runtime Persistence Layer

Prisma must become the real backend persistence path for CRUD.

Rule:

- Do not continue expanding mock or in-memory runtime behavior as a long-term path.

### Transition Rule

During migration from store to Prisma:

- new domains and features should prefer repository-based Prisma integration
- legacy store behavior may remain temporarily only when explicitly transitional
- no new business-critical logic should be added only to the in-memory store

### Data Integrity

Always enforce:

- unique constraints awareness
- ownership relations
- business membership integrity
- valid foreign-key relationships
- explicit handling of missing entities
- consistent enum and state handling

### Transactions

Use Prisma transactions when:

- multiple writes must succeed or fail together
- status changes require related updates
- membership or business ownership changes affect several records

Do not use transactions blindly for simple operations.

## 7. Domain Modeling Rules

### Shared Domain Contracts Are The Backend Language

Use shared domain definitions and shared schemas as the official domain and API contract layer.

Required sources:

- shared domain contracts
- shared Zod schemas
- Prisma schema for persistence model

### Domain Rules

Do:

- keep domain terminology explicit
- model ownership clearly
- keep enums meaningful
- separate transport shape from persistence shape when needed

Do not:

- invent local types that duplicate shared contracts without reason
- blur domain entities with mocks or demo fixtures
- rely on raw string roles or statuses when enums exist

### Critical Note

The shared package currently mixes contracts and mocks.

Going forward:

- contracts should be treated as official
- mocks should be treated as non-authoritative support only
- no new domain rules should depend on mock-driven assumptions

## 8. Validation Rules

### Zod-First Validation Is Mandatory

Shared Zod schemas are the source of truth for API input validation.

Required:

- all router inputs must use shared schemas
- schema updates must happen before or alongside router and service updates
- domain constraints beyond shape validation must be enforced in services

### Validation Layers

Input validation:

- handled by Zod

Business validation:

- handled by services

Persistence validation:

- handled by DB constraints and repository behavior

Forbidden:

- duplicating API shape validation manually
- validating only in the frontend
- relying on Prisma errors as the only validation strategy

## 9. Authorization Rules

### Authorization Must Be Enforced Server-Side

Frontend role switching or UI visibility is never a source of truth.

Mandatory rule:

- every protected write path must enforce authorization in the backend

### Required Authorization Model

At minimum, backend rules must distinguish:

- platform admins
- business owner
- business manager
- end user or public actor

### Required Checks

Examples:

- only admins can approve businesses
- only owners can manage billing or team ownership
- only owner or manager with proper scope can edit business resources
- only authenticated users can perform protected writes
- public users can only access truly public data or actions

Forbidden:

- public procedures for business-critical mutations
- trusting client-provided role or view mode
- partial auth checks in UI only
- skipping ownership checks for convenience

### Recommended Pattern

Introduce reusable authorization helpers such as:

- `assertIsAdmin`
- `assertBusinessAccess`
- `assertOwnerAccess`
- `assertManagerAccess`
- `assertCanManageProducts`
- `assertCanManagePromotions`

These helpers should be invoked by services or procedure wrappers depending on scope.

## 10. Error Handling Standards

### Errors Must Be Explicit And Meaningful

Avoid raw `Error('something failed')` for known domain cases.

Required categories:

- unauthorized
- forbidden
- not found
- conflict
- validation or business rule violation
- unexpected internal error

Rules:

Do:

- throw meaningful typed or domain errors, or mapped API errors
- distinguish not-found from forbidden
- distinguish conflict from invalid input
- keep error messages useful but safe

Do not:

- throw generic string errors for known domain cases
- hide domain conflicts behind vague errors
- rely only on default framework behavior for every case

Recommended direction:

- services may throw domain-specific errors
- routers or a shared error mapper may translate them to `TRPCError` consistently

## 11. Auth And Session Rules

### Current Demo Behavior Must Not Become Permanent Architecture

The current `x-demo-user` flow is transitional.

Rule:

- do not expand demo-auth shortcuts into new production-oriented features

Required:

- all future real authorization logic must be designed as if demo mode did not exist
- demo paths must remain isolated and replaceable

### Session And Context Rules

The request context should remain:

- typed
- explicit
- dependency-injected

Context may include:

- current user
- repositories, services, or dependency factories
- env and config
- side-effect adapters

Do not overload context with unrelated business logic.

## 12. Side Effects And External Services

### External Side Effects Must Be Abstracted

Examples:

- email
- notifications
- analytics events
- background jobs

These should be accessed through service dependencies or adapters, not hardcoded directly in routers.

Rules:

Do:

- keep side effects behind abstractions
- coordinate them in services
- make them testable and mockable

Do not:

- send emails directly inside multiple routers
- bury side effects inside persistence logic

## 13. CRUD Standards

### CRUD Must Be Domain-Aware, Not Only Table-Aware

Every CRUD implementation must consider:

- authorization
- ownership
- business state
- plan limitations
- status transitions
- integrity constraints

### Minimum Standard For Every CRUD Endpoint

A new CRUD capability is not complete unless it has:

- input schema
- service method
- repository method or methods
- server-side auth check
- not-found handling
- conflict or business-rule handling
- meaningful return shape
- tests where meaningful

### Avoid Naive CRUD

Do not implement CRUD as:

- take input, write Prisma, return success

without checking ownership, validity, or domain rules.

## 14. Testing Standards

### Testing Is Mandatory But Pragmatic

This project does not require maximalist coverage.
It does require meaningful coverage for backend correctness.

Must test:

- service business rules
- role-based access
- ownership checks
- rule enforcement
- domain constraints
- status transitions
- plan restrictions
- critical permission paths

Repository logic should be tested when queries or mapping are non-trivial.

Router tests should stay selective and focus on meaningful integration points.

Not required:

- exhaustive tests for trivial pass-through code
- redundant tests for framework behavior

Forbidden:

- leaving critical backend rules untested
- using `passWithNoTests` as justification for no backend tests
- writing only smoke tests while core domain rules remain uncovered

## 15. Naming And Code Clarity

### Naming Rules

Use explicit backend and domain names.

Good examples:

- `approveBusiness`
- `createPromotionForBusiness`
- `assertManagerCanEditBusiness`
- `findBusinessMembership`
- `listPendingApprovals`

Bad examples:

- `handleData`
- `processItem`
- `doStuff`
- `check`

### Function Rules

- one clear responsibility per function
- prefer early returns
- avoid deep nesting
- extract complex conditional logic into named helpers

## 16. Backend Patterns To Follow

Patterns already aligned with this project:

- thin server entrypoint
- centralized router aggregation
- typed tRPC context
- shared Zod input schemas
- shared domain contracts
- explicit env parsing
- external service abstraction
- thin routers delegating beyond transport layer

These are positive patterns and must be preserved.

## 17. Anti-Patterns

Strictly forbidden:

- public mutations for protected business operations
- demo auth shortcuts as long-term runtime architecture
- direct Prisma usage inside routers
- expanding the in-memory store as the permanent domain layer
- mixing mocks with official domain rules
- plain generic errors for known domain cases
- no ownership or manager checks on protected resources
- backend rules enforced only in the frontend
- duplicate validation logic
- fat routers
- no tests for critical domain rules

## 18. Definition Of Done

A backend feature is not complete unless:

- router is thin
- service handles business rules
- repository handles persistence
- input validation uses shared Zod schemas
- server-side authorization is enforced
- errors are meaningful
- ownership and integrity are checked
- no demo shortcut was introduced as permanent logic
- tests cover meaningful behavior
- types remain explicit and maintainable

## 19. Copilot Output Expectations

Generated backend code must:

- follow Router -> Service -> Repository
- reuse shared schemas and domain contracts
- keep routers thin
- keep Prisma inside repositories
- enforce authorization server-side
- be readable and explicit
- avoid hidden coupling
- avoid mock-first shortcuts in real paths
- support gradual migration from store to Prisma cleanly

## 20. Guiding Principle

Always prefer:

- explicit domain rules
- clear authorization
- safe persistence boundaries
- maintainable layering

Over:

- fast but leaky CRUD
- router-heavy logic
- mock shortcuts
- implicit permissions

## Final Rule

If a backend implementation is fast but weakens:

- authorization
- domain integrity
- persistence boundaries
- long-term maintainability

Do not do it.
