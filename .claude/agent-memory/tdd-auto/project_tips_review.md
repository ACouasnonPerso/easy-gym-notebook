---
name: project_tips_review
description: Tips-review feature fully implemented with TDD — in-app review flow wired via ReviewService, ReviewRepository, RequestReviewUseCase, TipsBannerComponent
type: project
---

Tips-review feature implemented 2026-03-27. All 16 tests green across 5 spec files.

**Why:** Engage users who have > 4 sessions to leave a native in-app review via @capacitor-community/in-app-review.

**Files created:**
- `src/app/secondary_ports/review/review.repository.interface.ts` — IReviewRepository + REVIEW_REPOSITORY token
- `src/app/secondary_ports/review/review.repository.ts` — localStorage impl (key: egn_review_requested)
- `src/app/secondary_ports/review/review.repository.spec.ts`
- `src/app/core_logic/review/review.service.ts` — Signal<boolean> hasRequested, initialize(), requestReview() with Capacitor guard
- `src/app/core_logic/review/review.service.spec.ts`
- `src/app/primary_ports/session-list/request-review.usecase.ts`
- `src/app/primary_ports/session-list/request-review.usecase.spec.ts`
- `src/app/primary_adapters/session-list/tips-banner.component.spec.ts`

**Files modified:**
- `src/app/primary_adapters/session-list/tips-banner.component.ts` — added showOnboarding/showReview/showThanks computed, justReviewed local signal, onReviewClick()
- `src/app/primary_adapters/session-list/tips-banner.component.html` — three @if blocks
- `src/app/primary_adapters/session-list/tips-banner.component.scss` — &--clickable modifier
- `src/app/primary_adapters/session-list/session-list.component.ts` — injects ReviewService, calls initialize() in ngOnInit
- `src/app/primary_adapters/session-list/session-list.component.spec.ts` — added RequestReviewUseCase + ReviewService + REVIEW_REPOSITORY fakes
- `src/app/app.config.ts` — added REVIEW_REPOSITORY provider
- `public/i18n/*.json` — added sessionList.reviewTip and sessionList.reviewThanks to all 17 languages

**How to apply:** When referencing this feature or adding related tests, provide ReviewService/RequestReviewUseCase fakes and REVIEW_REPOSITORY token in TestBed providers.
