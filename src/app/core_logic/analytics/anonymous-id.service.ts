import { Injectable } from '@angular/core';

const STORAGE_KEY = 'egn_anon_uid';

@Injectable({ providedIn: 'root' })
export class AnonymousIdService {
  getId(): string {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) {
      return existing;
    }
    const uid = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, uid);
    return uid;
  }

  getCountry(): string {
    return navigator.language.split('-')[1]?.toUpperCase() ?? 'unknown';
  }
}
