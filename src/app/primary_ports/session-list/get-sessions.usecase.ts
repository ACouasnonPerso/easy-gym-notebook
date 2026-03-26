import { Injectable, inject } from '@angular/core';
import { SessionService } from '../../core_logic/session/session.service';

@Injectable({ providedIn: 'root' })
export class GetSessionsUseCase {
  private readonly sessionService = inject(SessionService);

  readonly sessions = this.sessionService._sessions;

  execute(): void {
    this.sessionService.loadAll();
  }
}
