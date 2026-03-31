import { Injectable, inject } from "@angular/core";
import { Session } from "../shared/models";
import { AnonymousIdService } from "./anonymous-id.service";
import { ANALYTICS_REPOSITORY } from "../../secondary_ports/analytics/analytics.repository.interface";

@Injectable({ providedIn: "root" })
export class AnalyticsService {
	private readonly idService = inject(AnonymousIdService);
	private readonly repo = inject(ANALYTICS_REPOSITORY);

	trackSessionStarted(session: Session): void {
		this.repo
			.trackSessionStarted({
				sessionId: session.id,
				uid: this.idService.getId(),
				country: this.idService.getCountry(),
				muscleGroup: session.muscleGroup ?? "unknown",
			})
			.catch(() => {});
	}

	trackSessionUpdated(session: Session, exerciseNames: string[]): void {
		this.repo.trackSessionUpdated(session.id, exerciseNames).catch(() => {});
	}

	trackSessionCompleted(session: Session): void {
		this.repo
			.trackSessionCompleted({
				sessionId: session.id,
				uid: this.idService.getId(),
				durationSeconds: session.durationSeconds,
			})
			.catch(() => {});
	}
}
