import { Injectable, inject } from "@angular/core";
import { doc, setDoc, serverTimestamp, increment, Firestore } from "firebase/firestore";
import { FIRESTORE } from "../../app.config";
import {
	IAnalyticsRepository,
	SessionStartPayload,
	SessionCompletePayload,
} from "../../secondary_ports/analytics/analytics.repository.interface";

const SESSIONS_COLLECTION = "sessions";
const USER_STATS_COLLECTION = "user_stats";

@Injectable({ providedIn: "root" })
export class FirestoreAnalyticsRepository implements IAnalyticsRepository {
	private readonly firestore: Firestore = inject(FIRESTORE);

	trackSessionStarted(payload: SessionStartPayload): Promise<void> {
		return setDoc(doc(this.firestore, SESSIONS_COLLECTION, payload.sessionId), {
			uid: payload.uid,
			country: payload.country,
			startedAt: serverTimestamp(),
			muscleGroup: payload.muscleGroup,
			status: "active",
			exerciseNames: [],
			durationSeconds: 0,
		}).catch(() => {});
	}

	trackSessionUpdated(sessionId: string, exerciseNames: string[]): Promise<void> {
		return setDoc(doc(this.firestore, SESSIONS_COLLECTION, sessionId), { exerciseNames }, { merge: true }).catch(
			() => {}
		);
	}

	trackSessionCompleted(payload: SessionCompletePayload): Promise<void> {
		return Promise.all([
			setDoc(
				doc(this.firestore, SESSIONS_COLLECTION, payload.sessionId),
				{ durationSeconds: payload.durationSeconds, status: "completed" },
				{ merge: true }
			),
			setDoc(
				doc(this.firestore, USER_STATS_COLLECTION, payload.uid),
				{
					totalSessions: increment(1),
					totalDurationSeconds: increment(payload.durationSeconds),
					lastSessionAt: serverTimestamp(),
				},
				{ merge: true }
			),
		])
			.then(() => {})
			.catch(() => {});
	}
}
