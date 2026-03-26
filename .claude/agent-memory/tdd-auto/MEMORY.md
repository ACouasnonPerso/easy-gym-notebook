# TDD Auto Agent Memory Index

| File | Type | Description |
|------|------|-------------|
| [feedback_moment_esmoduleinterop.md](feedback_moment_esmoduleinterop.md) | feedback | Fix for moment.js CJS crash in visitor tests: add esModuleInterop to tsconfig.spec.json |
| [feedback_jest_mock_hoisting.md](feedback_jest_mock_hoisting.md) | feedback | firebase-functions/https onCall mock does not intercept module-level calls — test the handler inline |
| [feedback_rate_limit_mock.md](feedback_rate_limit_mock.md) | feedback | Mock RequestValidator entirely in Cloud Function integration tests to bypass rate limiting |
| [project_submit_form_visitor.md](project_submit_form_visitor.md) | project | SubmitFormAccountVisitor feature fully implemented and all 35 tests green as of 2026-03-24 |
| [project_learn_from_history.md](project_learn_from_history.md) | project | "Learn from history" feature: auto-load default exercise params when typed name exactly matches a past exercise |
| [user_profile.md](user_profile.md) | user | User preferences and project tech stack |
| [project_exercise_series_counter.md](project_exercise_series_counter.md) | project | Series counter on ExerciseChronoService — increments on start/goTraining/auto-break, resets on init |
| [project_session_chrono_persistence.md](project_session_chrono_persistence.md) | project | Session-scoped chrono persists to localStorage (egn_chrono_start_{id} / egn_chrono_paused_{id}); restored in _getOrCreateSession |
