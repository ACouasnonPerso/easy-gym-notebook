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
import { SetLanguageUseCase } from '../../primary_ports/language/set-language.usecase';
import { ActiveLang } from '../../core_logic/language/language.service';
import { SessionCardComponent } from './session-card.component';
import { LanguageSelectorComponent } from '../shared/language-selector.component';
import { ScrollSentinelDirective } from '../shared/scroll-sentinel.directive';
import { ContextMenuComponent } from '../shared/context-menu.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { TipsBannerComponent } from './tips-banner.component';
import { TranslateModule } from '@ngx-translate/core';
import { ReviewService } from '../../core_logic/review/review.service';
import { HapticService } from '../../core_logic/shared/haptic.service';

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
    TipsBannerComponent,
    TranslateModule,
    LanguageSelectorComponent,
  ],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent implements OnInit {
  private readonly getSessionsUseCase = inject(GetSessionsUseCase);
  private readonly createSessionUseCase = inject(CreateSessionUseCase);
  private readonly duplicateSessionUseCase = inject(DuplicateSessionUseCase);
  private readonly deleteSessionUseCase = inject(DeleteSessionUseCase);
  private readonly setLanguageUseCase = inject(SetLanguageUseCase);
  private readonly reviewService = inject(ReviewService);
  private readonly haptic = inject(HapticService);
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
    this.reviewService.initialize();
  }

  loadMore(): void {
    this.visibleCount.update(n => n + PAGE_SIZE);
  }

  navigateToSession(id: string): void {
    this.router.navigate(['/sessions', id]);
  }

  onLongPress(session: Session): void {
    this.haptic.vibrate();
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

  changeLanguage(lang: ActiveLang): void {
    this.setLanguageUseCase.execute(lang);
  }
}
