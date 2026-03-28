import { InjectionToken } from '@angular/core';

export interface SessionStartPayload {
  sessionId: string;
  uid: string;
  country: string;
  muscleGroup: string;
}

export interface SessionCompletePayload {
  sessionId: string;
  uid: string;
  durationSeconds: number;
}

export interface IAnalyticsRepository {
  trackSessionStarted(payload: SessionStartPayload): Promise<void>;
  trackSessionUpdated(sessionId: string, exerciseNames: string[]): Promise<void>;
  trackSessionCompleted(payload: SessionCompletePayload): Promise<void>;
}

export const ANALYTICS_REPOSITORY =
  new InjectionToken<IAnalyticsRepository>('ANALYTICS_REPOSITORY');
