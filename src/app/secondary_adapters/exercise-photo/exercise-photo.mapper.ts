import { Injectable } from "@angular/core";

@Injectable()
export class ExercisePhotoMapper {
	toDataUrl(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(blob);
		});
	}

	toBlob(dataUrl: string): Blob {
		const [header, base64] = dataUrl.split(",");
		const mimeType = header.split(":")[1].split(";")[0];
		const binaryStr = atob(base64);
		const bytes = new Uint8Array(binaryStr.length);
		for (let i = 0; i < binaryStr.length; i++) {
			bytes[i] = binaryStr.charCodeAt(i);
		}
		return new Blob([bytes], { type: mimeType });
	}
}
