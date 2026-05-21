import { Injectable, signal } from "@angular/core";

const STORAGE_KEY = "highlight-debug";

/**
 * Service pour activer/désactiver le mode debug des highlights.
 *
 * Usage dans la console du navigateur :
 *   window['highlightDebug'].enable()   — active les logs
 *   window['highlightDebug'].disable()  — désactive les logs
 *   window['highlightDebug'].status()   — affiche l'état courant
 *
 * L'état est persisté en localStorage et survit aux rechargements.
 */
@Injectable({ providedIn: "root" })
export class HighlightDebugService {
	private readonly _enabled = signal<boolean>(
		typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true"
	);

	readonly isEnabled = this._enabled.asReadonly();

	constructor() {
		if (typeof window !== "undefined") {
			// Expose sur window pour usage direct depuis la console DevTools
			(window as unknown as Record<string, unknown>)["highlightDebug"] = {
				enable: () => this.enable(),
				disable: () => this.disable(),
				status: () => this.status(),
			};
		}
	}

	enable(): void {
		if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, "true");
		this._enabled.set(true);
		console.log(
			"%c[highlight-debug] Mode debug ACTIVÉ — rechargez la page ou naviguez vers Stats pour voir les logs.",
			"color: #4ade80; font-weight: bold;"
		);
	}

	disable(): void {
		if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
		this._enabled.set(false);
		console.log("%c[highlight-debug] Mode debug DÉSACTIVÉ.", "color: #f87171; font-weight: bold;");
	}

	status(): void {
		const state = this._enabled() ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ";
		console.log(`%c[highlight-debug] État actuel : ${state}`, "font-weight: bold;");
	}
}
