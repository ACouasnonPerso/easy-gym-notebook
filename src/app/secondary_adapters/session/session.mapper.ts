import { Injectable } from '@angular/core';
import { Session, RawSession } from '../../core_logic/shared/models';

@Injectable()
export class SessionMapper {
  toDomain(raw: RawSession): Session {
    return {
      id: raw.id,
      date: new Date(raw.date),
      status: raw.status,
      durationSeconds: raw.durationSeconds,
      muscleGroup: raw.muscleGroup,
      exercises: [],
    };
  }

  toStorage(session: Session): RawSession {
    return {
      id: session.id,
      date: session.date.toISOString(),
      status: session.status,
      durationSeconds: session.durationSeconds,
      muscleGroup: session.muscleGroup,
    };
  }
}
