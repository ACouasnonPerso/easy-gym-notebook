import { Injectable } from "@angular/core";
import { ExercisePhoto } from "../../core_logic/shared/models";
import { IExercisePhotoRepository } from "./exercise-photo.repository.interface";

const DB_NAME = "easy-gym-photos";
const STORE_NAME = "exercise-photos";
const INDEX_NAME = "exerciseName";

interface RawExercisePhoto {
	id?: number;
	exerciseName: string;
	dataUrl: string;
	capturedAt: string;
}

@Injectable()
export class ExercisePhotoRepository implements IExercisePhotoRepository {
	private dbPromise: Promise<IDBDatabase> | null = null;

	async close(): Promise<void> {
		if (this.dbPromise) {
			const db = await this.dbPromise;
			db.close();
			this.dbPromise = null;
		}
	}

	private getDb(): Promise<IDBDatabase> {
		if (!this.dbPromise) {
			this.dbPromise = new Promise((resolve, reject) => {
				const request = indexedDB.open(DB_NAME, 1);
				request.onupgradeneeded = (event) => {
					const db = (event.target as IDBOpenDBRequest).result;
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
						store.createIndex(INDEX_NAME, "exerciseName", { unique: false });
					}
				};
				request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
				request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
			});
		}
		return this.dbPromise;
	}

	async getAllPhotos(): Promise<ExercisePhoto[]> {
		const db = await this.getDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const request = tx.objectStore(STORE_NAME).getAll();
			request.onsuccess = () => {
				const rows: RawExercisePhoto[] = request.result;
				resolve(rows.map((r) => ({ exerciseName: r.exerciseName, dataUrl: r.dataUrl, capturedAt: new Date(r.capturedAt) })));
			};
			request.onerror = () => reject(request.error);
		});
	}

	async getAll(exerciseName: string): Promise<ExercisePhoto[]> {
		const db = await this.getDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const index = tx.objectStore(STORE_NAME).index(INDEX_NAME);
			const request = index.getAll(exerciseName);
			request.onsuccess = () => {
				const rows: RawExercisePhoto[] = request.result;
				resolve(rows.map((r) => ({ exerciseName: r.exerciseName, dataUrl: r.dataUrl, capturedAt: new Date(r.capturedAt) })));
			};
			request.onerror = () => reject(request.error);
		});
	}

	async save(photo: ExercisePhoto): Promise<void> {
		const db = await this.getDb();
		const existing = await this.getAll(photo.exerciseName);
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			const store = tx.objectStore(STORE_NAME);
			const raw: RawExercisePhoto = {
				exerciseName: photo.exerciseName,
				dataUrl: photo.dataUrl,
				capturedAt: photo.capturedAt.toISOString(),
			};
			if (existing.length > 0) {
				const findRequest = tx.objectStore(STORE_NAME).index(INDEX_NAME).getAll(photo.exerciseName);
				findRequest.onsuccess = () => {
					const rows: RawExercisePhoto[] = findRequest.result;
					raw.id = rows[0].id;
					store.put(raw);
				};
			} else {
				store.add(raw);
			}
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	async delete(exerciseName: string, capturedAt: Date): Promise<void> {
		const db = await this.getDb();
		const all = await this.getAllRaw(exerciseName);
		const toDelete = all.filter((r) => new Date(r.capturedAt).getTime() === capturedAt.getTime());
		if (toDelete.length === 0) return;
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			const store = tx.objectStore(STORE_NAME);
			for (const row of toDelete) {
				if (row.id !== undefined) store.delete(row.id);
			}
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	private async getAllRaw(exerciseName: string): Promise<RawExercisePhoto[]> {
		const db = await this.getDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const index = tx.objectStore(STORE_NAME).index(INDEX_NAME);
			const request = index.getAll(exerciseName);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
}
