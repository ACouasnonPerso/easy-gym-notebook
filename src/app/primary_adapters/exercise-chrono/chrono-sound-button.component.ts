import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";
import { NgClass } from "@angular/common";

@Component({
	selector: "app-chrono-sound-button",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgClass],
	templateUrl: "./chrono-sound-button.component.html",
	styleUrl: "./chrono-sound-button.component.css",
})
export class ChronoSoundButtonComponent {
	readonly soundEnabled = input.required<boolean>();
	readonly toggleSound = output<void>();
}
