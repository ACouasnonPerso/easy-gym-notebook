import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class AppVersionService {
	readonly version = "1.0.6";
}
