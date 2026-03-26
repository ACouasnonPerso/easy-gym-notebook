---
name: rate_limit_mock_in_cloud_function_tests
description: Mock RequestValidator entirely in Cloud Function integration tests to avoid rate limiter interference
type: feedback
---

`RequestValidator` internally uses `ValidatorRateLimitRequest` which calls `getDevelopDb().runTransaction()` and `new DBProvider().getDocRef()`. Partially mocking these causes subtle test failures (e.g. rate limit exceeded, unexpected create calls counted).

**Why:** The rate limiter creates its own Firestore documents, polluting `mockCreate` call counts, and its state depends on `mockGetFirst` return values that are also used to simulate user-existence checks.

**How to apply:** In Cloud Function integration tests, mock `RequestValidator` entirely:
```typescript
jest.mock('../../Security/request-validator', () => ({
  RequestValidator: jest.fn().mockImplementation((data: any, auth: any) => ({
    requireParams: jest.fn().mockReturnThis(),
    requireAuth: jest.fn().mockReturnThis(),
    validate: jest.fn().mockImplementation(async () => {
      if (!auth || !auth.uid) throw new HttpsError('unauthenticated', '...');
      if (!data || !data['data']) throw new HttpsError('invalid-argument', '...');
    }),
  })),
}));
```
This bypasses rate limiting while still testing auth and param validation.
