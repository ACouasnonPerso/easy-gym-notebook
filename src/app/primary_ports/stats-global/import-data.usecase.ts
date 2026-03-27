import { Injectable, inject, signal } from '@angular/core';
import { ImportService } from '../../core_logic/import/import.service';
import { SessionService } from '../../core_logic/session/session.service';

@Injectable({ providedIn: 'root' })
export class ImportDataUseCase {
  private readonly importService = inject(ImportService);
  private readonly sessionService = inject(SessionService);

  readonly importCount = signal<number>(0);
  readonly importError = signal<string | null>(null);
  readonly importPending = signal<boolean>(false);

  async validate(json: string): Promise<void> {
    this.importPending.set(true);
    try {
      const result = await this.importService.validate(json);
      if (!result.valid) {
        this.importError.set(result.error ?? 'unknown_error');
        this.importCount.set(0);
      } else {
        this.importError.set(null);
        this.importCount.set((result.sessionCount ?? 0) + (result.exerciseCount ?? 0));
      }
    } finally {
      this.importPending.set(false);
    }
  }

  async persist(): Promise<void> {
    await this.importService.persist();
    await this.sessionService.loadAll();
  }
}
