import { Injectable, inject } from '@angular/core';
import { SessionService } from '../../core_logic/session/session.service';

@Injectable({ providedIn: 'root' })
export class DeleteSessionUseCase {
  private readonly sessionService = inject(SessionService);

  execute(sessionId: string): void {
    this.sessionService.delete(sessionId);
  }
}
