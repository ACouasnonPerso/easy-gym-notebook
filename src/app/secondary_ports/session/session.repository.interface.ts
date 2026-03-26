import { InjectionToken } from '@angular/core';
import { Session } from '../../core_logic/shared/models';

export interface ISessionRepository {
  getAll(): Promise<Session[]>;
  getById(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
}

export const SESSION_REPOSITORY = new InjectionToken<ISessionRepository>('SESSION_REPOSITORY');
