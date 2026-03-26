import { Injectable, inject } from '@angular/core';
import { ISessionRepository } from './session.repository.interface';
import { Session, RawSession } from '../../core_logic/shared/models';
import { SessionMapper } from '../../secondary_adapters/session/session.mapper';

const STORAGE_KEY = 'egn_sessions';

@Injectable()
export class SessionRepository implements ISessionRepository {
  private readonly mapper = inject(SessionMapper);

  async getAll(): Promise<Session[]> {
    const raw = this.readFromStorage();
    return raw.map(r => this.mapper.toDomain(r));
  }

  async getById(id: string): Promise<Session | null> {
    const all = await this.getAll();
    return all.find(s => s.id === id) ?? null;
  }

  async save(session: Session): Promise<void> {
    const all = this.readFromStorage();
    const index = all.findIndex(s => s.id === session.id);
    const raw = this.mapper.toStorage(session);
    if (index === -1)
      all.push(raw);
    else
      all[index] = raw;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  async delete(id: string): Promise<void> {
    const all = this.readFromStorage().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  private readFromStorage(): RawSession[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as RawSession[];
    } catch {
      return [];
    }
  }
}
