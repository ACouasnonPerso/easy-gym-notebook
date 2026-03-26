import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../../core_logic/shared/models';
import { GetSessionsUseCase } from '../../primary_ports/session-list/get-sessions.usecase';
import { CreateSessionUseCase } from '../../primary_ports/session-list/create-session.usecase';
import { DuplicateSessionUseCase } from '../../primary_ports/session-list/duplicate-session.usecase';
import { DeleteSessionUseCase } from '../../primary_ports/session-list/delete-session.usecase';
import { SessionCardComponent } from './session-card.component';
import { ScrollSentinelDirective } from '../shared/scroll-sentinel.directive';
import { ContextMenuComponent } from '../shared/context-menu.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-session-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SessionCardComponent,
    ScrollSentinelDirective,
    ContextMenuComponent,
    ConfirmDialogComponent,
    TranslateModule,
  ],
  template: `
    <div class="page">
      <div class="page-title">{{ 'sessionList.title' | translate }}</div>

      @if (sessions().length === 0) {
        <p class="empty">{{ 'sessionList.empty' | translate }}</p>
      }

      <div class="session-list">
        @for (session of visibleSessions(); track session.id) {
          <app-session-card
            [session]="session"
            (longPress)="onLongPress(session)"
            (click)="navigateToSession(session.id)"
          />
        }
      </div>

      @if (hasMore()) {
        <div appScrollSentinel (visible)="loadMore()"></div>
      }

      @if (showContextMenu()) {
        <app-context-menu
          [options]="contextMenuOptions"
          (selected)="onContextMenuSelected($event)"
          (closed)="showContextMenu.set(false)"
        />
      }

      @if (showConfirm()) {
        <app-confirm-dialog
          [message]="'sessionList.deleteConfirm' | translate"
          (confirmed)="confirmDelete()"
          (cancelled)="showConfirm.set(false)"
        />
      }
    </div>
  `,
  styles: [`
    .page {
      background: var(--bg);
      min-height: 100vh;
      padding: 20px 16px 100px;
      max-width: 720px;
      margin: 0 auto;
      width: 100%;
    }
    @media (min-width: 640px) {
      .page {
        padding: 28px 24px 100px;
      }
    }
    @media (min-width: 1024px) {
      .page {
        padding: 40px 32px 120px;
      }
    }
    .page-title {
      font-family: 'Syne', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.3px;
      margin-bottom: 20px;
    }
    .empty {
      color: var(--muted);
      text-align: center;
      margin-top: 60px;
      font-size: 15px;
    }
    .session-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `],
})
export class SessionListComponent implements OnInit {
  private readonly getSessionsUseCase = inject(GetSessionsUseCase);
  private readonly createSessionUseCase = inject(CreateSessionUseCase);
  private readonly duplicateSessionUseCase = inject(DuplicateSessionUseCase);
  private readonly deleteSessionUseCase = inject(DeleteSessionUseCase);
  private readonly router = inject(Router);

  readonly sessions = this.getSessionsUseCase.sessions;
  readonly visibleCount = signal(PAGE_SIZE);
  readonly visibleSessions = computed(() => this.sessions().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.visibleCount() < this.sessions().length);

  readonly showContextMenu = signal(false);
  readonly contextMenuSession = signal<Session | null>(null);
  readonly showConfirm = signal(false);

  readonly contextMenuOptions = ['sessionList.duplicate', 'sessionList.delete'];

  ngOnInit(): void {
    this.getSessionsUseCase.execute();
  }

  loadMore(): void {
    this.visibleCount.update(n => n + PAGE_SIZE);
  }

  navigateToSession(id: string): void {
    this.router.navigate(['/sessions', id]);
  }

  onLongPress(session: Session): void {
    this.contextMenuSession.set(session);
    this.showContextMenu.set(true);
  }

  onContextMenuSelected(option: string): void {
    const session = this.contextMenuSession();
    if (!session) return;
    if (option === 'sessionList.duplicate') this.duplicateSessionUseCase.execute(session.id);
    if (option === 'sessionList.delete') this.showConfirm.set(true);
  }

  confirmDelete(): void {
    const session = this.contextMenuSession();
    if (session) this.deleteSessionUseCase.execute(session.id);
    this.showConfirm.set(false);
    this.contextMenuSession.set(null);
  }

  createSession(): void {
    this.createSessionUseCase.execute();
  }
}
