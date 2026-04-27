import { TestBed } from "@angular/core/testing";
import { ExercisePhotoMapper } from "./exercise-photo.mapper";

const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const aJpegBlob = new Blob([JPEG_HEADER], { type: "image/jpeg" });

describe("ExercisePhotoMapper", () => {
	let mapper: ExercisePhotoMapper;

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [ExercisePhotoMapper] });
		mapper = TestBed.inject(ExercisePhotoMapper);
	});

	describe("toDataUrl()", () => {
		it("should produce a non-empty data URL when converting a JPEG Blob", async () => {
			const result = await mapper.toDataUrl(aJpegBlob);

			expect(result.length).toBeGreaterThan(0);
		});

		it("should produce a data URL that starts with the JPEG mime prefix", async () => {
			const result = await mapper.toDataUrl(aJpegBlob);

			expect(result.startsWith("data:image/jpeg")).toBeTrue();
		});
	});

	describe("toBlob()", () => {
		it("should produce a Blob with the original byte content when converting a data URL back", async () => {
			const dataUrl = await mapper.toDataUrl(aJpegBlob);
			const resultBlob = mapper.toBlob(dataUrl);
			const resultBytes = new Uint8Array(await resultBlob.arrayBuffer());

			expect(resultBytes).toEqual(JPEG_HEADER);
		});

		it("should produce a Blob whose size matches the original after a full round-trip", async () => {
			const dataUrl = await mapper.toDataUrl(aJpegBlob);
			const resultBlob = mapper.toBlob(dataUrl);

			expect(resultBlob.size).toBe(aJpegBlob.size);
		});
	});
});
