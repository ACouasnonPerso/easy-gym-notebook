import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ImageDownscalerService {
	async downscale(file: File, maxEdgePx: number): Promise<string> {
		return "";
	}
}
