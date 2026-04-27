import { TestBed } from "@angular/core/testing";
import { ExerciseChronoService } from "./exercise-chrono.service";

describe("ExerciseChronoService", () => {
	let service: ExerciseChronoService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ExerciseChronoService);
		jasmine.clock().install();
		jasmine.clock().mockDate(new Date(0));
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

	describe("initial state", () => {
		it("should start in initial state", () => {
			expect(service.chronoState()).toBe("initial");
		});
	});

	describe("start()", () => {
		it("should transition from initial to training", () => {
			service.init(60);
			service.start();
			expect(service.chronoState()).toBe("training");
		});
	});

	describe("pause()", () => {
		it("should transition from training to training_paused", () => {
			service.init(60);
			service.start();
			service.pause();
			expect(service.chronoState()).toBe("training_paused");
		});

		it("should transition from break to break_paused", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.pause();
			expect(service.chronoState()).toBe("break_paused");
		});
	});

	describe("resume()", () => {
		it("should transition from training_paused to training", () => {
			service.init(60);
			service.start();
			service.pause();
			service.resume();
			expect(service.chronoState()).toBe("training");
		});

		it("should transition from break_paused to break", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.pause();
			service.resume();
			expect(service.chronoState()).toBe("break");
		});
	});

	describe("reset()", () => {
		it("should stay in training and reset time to 0 when called from training_paused", () => {
			service.init(60);
			service.start();
			jasmine.clock().tick(5000);
			service.pause();
			service.reset();
			expect(service.chronoState()).toBe("training");
			expect(service.timeSeconds()).toBe(0);
		});

		it("should stay in break and reset time to breakDuration when called from break_paused", () => {
			service.init(60);
			service.start();
			service.goBreak();
			jasmine.clock().tick(10000);
			service.pause();
			service.reset();
			expect(service.chronoState()).toBe("break");
			expect(service.timeSeconds()).toBe(60);
		});
	});

	describe("goBreak()", () => {
		it("should transition from training_paused to break", () => {
			service.init(60);
			service.start();
			service.pause();
			service.goBreak();
			expect(service.chronoState()).toBe("break");
		});
	});

	describe("goTraining()", () => {
		it("should transition from break to training", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.goTraining();
			expect(service.chronoState()).toBe("training");
		});

		it("should transition from break_paused to training", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.pause();
			service.goTraining();
			expect(service.chronoState()).toBe("training");
		});
	});

	describe("seriesCount", () => {
		it("should start at 0 after init()", () => {
			service.init(60);

			expect(service.seriesCount()).toBe(0);
		});

		it("should be 1 after start()", () => {
			service.init(60);

			service.start();

			expect(service.seriesCount()).toBe(1);
		});

		it("should increment when goTraining() is called from break", () => {
			service.init(60);
			service.start();
			service.goBreak();

			service.goTraining();

			expect(service.seriesCount()).toBe(2);
		});

		it("should reset to 0 when init() is called again (exercise change)", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.goTraining();

			service.init(90);

			expect(service.seriesCount()).toBe(0);
		});

		it("should increment when the break timer completes automatically", () => {
			service.init(5);
			service.start();
			service.goBreak();

			jasmine.clock().tick(6000);

			expect(service.seriesCount()).toBe(2);
		});
	});

	describe("updateBreakDuration()", () => {
		it("ne modifie pas l'état du chrono quand appelé pendant training", () => {
			service.init(60);
			service.start();

			service.updateBreakDuration(90);

			expect(service.chronoState()).toBe("training");
		});

		it("goBreak() utilise la nouvelle durée après updateBreakDuration", () => {
			service.init(60);
			service.start();

			service.updateBreakDuration(90);
			service.goBreak();

			expect(service.timeSeconds()).toBe(90);
		});

		it("met à jour timeSeconds à la nouvelle durée quand on est en break", () => {
			service.init(60);
			service.start();
			service.goBreak();

			service.updateBreakDuration(90);

			expect(service.timeSeconds()).toBe(90);
			expect(service.chronoState()).toBe("break");
		});
	});

	describe("incrementSeriesCount()", () => {
		it("should increment seriesCount by 1", () => {
			service.init(60);
			service.start();
			expect(service.seriesCount()).toBe(1);

			service.incrementSeriesCount();

			expect(service.seriesCount()).toBe(2);
		});
	});

	describe("decrementSeriesCount()", () => {
		it("should decrement seriesCount by 1 when count is greater than 1", () => {
			service.init(60);
			service.start();
			service.incrementSeriesCount();
			expect(service.seriesCount()).toBe(2);

			service.decrementSeriesCount();

			expect(service.seriesCount()).toBe(1);
		});

		it("should not decrement below 1", () => {
			service.init(60);
			service.start();
			expect(service.seriesCount()).toBe(1);

			service.decrementSeriesCount();

			expect(service.seriesCount()).toBe(1);
		});
	});

	describe("addTime()", () => {
		it("n'a aucun effet quand l'état est training_paused", () => {
			service.init(60);
			service.start();
			jasmine.clock().tick(10000);
			service.pause();
			const before = service.timeSeconds();

			service.addTime(15);

			expect(service.timeSeconds()).toBe(before);
		});

		it("incrémente timeSeconds de 30 quand l'état est break_paused et qu'on appelle addTime(30)", () => {
			service.init(60);
			service.start();
			service.goBreak();
			jasmine.clock().tick(5000);
			service.pause();
			const before = service.timeSeconds();

			service.addTime(30);

			expect(service.timeSeconds()).toBe(before + 30);
		});

		it("n'a aucun effet quand l'état est training (chrono en cours)", () => {
			service.init(60);
			service.start();
			jasmine.clock().tick(5000);
			const before = service.timeSeconds();

			service.addTime(15);

			expect(service.timeSeconds()).toBe(before);
		});

		it("incrémente timeSeconds quand l'état est break_paused", () => {
			service.init(60);
			service.start();
			service.goBreak();
			jasmine.clock().tick(10000);
			service.pause();
			const before = service.timeSeconds();

			service.addTime(15);

			expect(service.timeSeconds()).toBe(before + 15);
		});
	});

	describe("toggleSound()", () => {
		it("désactive le son quand initialement activé", () => {
			expect(service.soundEnabled()).toBe(true);
			service.toggleSound();
			expect(service.soundEnabled()).toBe(false);
		});

		it("réactive le son après deux appels successifs", () => {
			service.toggleSound();
			service.toggleSound();
			expect(service.soundEnabled()).toBe(true);
		});
	});

	describe("mode computed", () => {
		it("retourne 'exercise' à l'état initial", () => {
			expect(service.mode()).toBe("exercise");
		});

		it("retourne 'exercise' pendant l'entraînement", () => {
			service.init(60);
			service.start();
			expect(service.mode()).toBe("exercise");
		});

		it("retourne 'exercise' en training_paused", () => {
			service.init(60);
			service.start();
			service.pause();
			expect(service.mode()).toBe("exercise");
		});

		it("retourne 'pause' pendant la pause", () => {
			service.init(60);
			service.start();
			service.goBreak();
			expect(service.mode()).toBe("pause");
		});

		it("retourne 'pause' en break_paused", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.pause();
			expect(service.mode()).toBe("pause");
		});
	});

	describe("start() garde", () => {
		it("est sans effet quand l'état n'est pas initial", () => {
			service.init(60);
			service.start();
			const count = service.seriesCount();
			service.start();
			expect(service.seriesCount()).toBe(count);
			expect(service.chronoState()).toBe("training");
		});

		it("réinitialise timeSeconds à 0 au démarrage", () => {
			service.init(60);
			service.start();
			expect(service.timeSeconds()).toBe(0);
		});
	});

	describe("pause() sans effet", () => {
		it("ne fait rien depuis l'état initial", () => {
			service.init(60);
			service.pause();
			expect(service.chronoState()).toBe("initial");
		});

		it("ne fait rien depuis training_paused", () => {
			service.init(60);
			service.start();
			service.pause();
			service.pause();
			expect(service.chronoState()).toBe("training_paused");
		});
	});

	describe("resume() sans effet", () => {
		it("ne fait rien depuis training", () => {
			service.init(60);
			service.start();
			service.resume();
			expect(service.chronoState()).toBe("training");
		});

		it("ne fait rien depuis break", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.resume();
			expect(service.chronoState()).toBe("break");
		});
	});

	describe("reset() sans effet", () => {
		it("ne fait rien depuis training", () => {
			service.init(60);
			service.start();
			jasmine.clock().tick(5000);
			service.reset();
			expect(service.chronoState()).toBe("training");
		});

		it("ne fait rien depuis break", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.reset();
			expect(service.chronoState()).toBe("break");
		});
	});

	describe("progression du timer", () => {
		it("incrémente timeSeconds chaque seconde pendant l'entraînement", () => {
			service.init(60);
			service.start();
			jasmine.clock().tick(3000);
			expect(service.timeSeconds()).toBe(3);
		});

		it("décrémente timeSeconds pendant le décompte de pause", () => {
			service.init(30);
			service.start();
			service.goBreak();
			expect(service.timeSeconds()).toBe(30);
			jasmine.clock().tick(10000);
			expect(service.timeSeconds()).toBe(20);
		});

		it("démarre de 0 après goTraining()", () => {
			service.init(60);
			service.start();
			service.goBreak();
			jasmine.clock().tick(5000);
			service.goTraining();
			expect(service.timeSeconds()).toBe(0);
		});
	});

	describe("updateBreakDuration() depuis break_paused", () => {
		it("met à jour timeSeconds quand l'état est break_paused", () => {
			service.init(60);
			service.start();
			service.goBreak();
			service.pause();
			service.updateBreakDuration(120);
			expect(service.timeSeconds()).toBe(120);
			expect(service.chronoState()).toBe("break_paused");
		});
	});

	describe("addTime() en break actif", () => {
		it("incrémente timeSeconds quand l'état est break", () => {
			service.init(60);
			service.start();
			service.goBreak();
			const before = service.timeSeconds();
			service.addTime(30);
			expect(service.timeSeconds()).toBe(before + 30);
		});

		it("sans effet quand l'état est initial", () => {
			service.init(60);
			service.addTime(30);
			expect(service.timeSeconds()).toBe(0);
		});
	});

	describe("persist() et restoreFromPersist()", () => {
		it("persist() écrit l'état dans localStorage", () => {
			service.init(60);
			service.start();
			const raw = localStorage.getItem("egn_exercise_chrono");
			expect(raw).not.toBeNull();
			const data = JSON.parse(raw!);
			expect(data.state).toBe("training");
			expect(data.breakDuration).toBe(60);
		});

		it("persist() écrit l'état break dans localStorage", () => {
			service.init(90);
			service.start();
			service.goBreak();
			const raw = localStorage.getItem("egn_exercise_chrono");
			const data = JSON.parse(raw!);
			expect(data.state).toBe("break");
			expect(data.breakDuration).toBe(90);
		});

		it("restoreFromPersist() restaure training_paused avec timeAtStart correct", () => {
			localStorage.setItem(
				"egn_exercise_chrono",
				JSON.stringify({ breakDuration: 60, timerStartedAtMs: 0, timeAtStart: 15, state: "training_paused" })
			);
			service.restoreFromPersist();
			expect(service.chronoState()).toBe("training_paused");
			expect(service.timeSeconds()).toBe(15);
		});

		it("restoreFromPersist() restaure break_paused avec timeAtStart correct", () => {
			localStorage.setItem(
				"egn_exercise_chrono",
				JSON.stringify({ breakDuration: 60, timerStartedAtMs: 0, timeAtStart: 45, state: "break_paused" })
			);
			service.restoreFromPersist();
			expect(service.chronoState()).toBe("break_paused");
			expect(service.timeSeconds()).toBe(45);
		});

		it("restoreFromPersist() reprend l'entraînement en tenant compte du temps écoulé", () => {
			// mockDate is at epoch 0; timerStartedAtMs 5 seconds ago = -5000
			jasmine.clock().mockDate(new Date(10000));
			localStorage.setItem(
				"egn_exercise_chrono",
				JSON.stringify({ breakDuration: 60, timerStartedAtMs: 0, timeAtStart: 5, state: "training" })
			);
			service.restoreFromPersist();
			// elapsed = floor((10000 - 0) / 1000) = 10; timeSeconds = 5 + 10 = 15
			expect(service.chronoState()).toBe("training");
			expect(service.timeSeconds()).toBe(15);
		});

		it("restoreFromPersist() reprend le décompte si la pause n'est pas terminée", () => {
			jasmine.clock().mockDate(new Date(5000));
			localStorage.setItem(
				"egn_exercise_chrono",
				JSON.stringify({ breakDuration: 60, timerStartedAtMs: 0, timeAtStart: 60, state: "break" })
			);
			service.restoreFromPersist();
			// elapsed = 5, remaining = 60 - 5 = 55
			expect(service.chronoState()).toBe("break");
			expect(service.timeSeconds()).toBe(55);
		});

		it("restoreFromPersist() passe en training si la pause est déjà terminée", () => {
			jasmine.clock().mockDate(new Date(70000));
			localStorage.setItem(
				"egn_exercise_chrono",
				JSON.stringify({ breakDuration: 60, timerStartedAtMs: 0, timeAtStart: 60, state: "break" })
			);
			service.restoreFromPersist();
			// elapsed = 70, remaining = max(0, 60 - 70) = 0 → auto-transition
			expect(service.chronoState()).toBe("training");
			expect(service.timeSeconds()).toBe(0);
		});

		it("restoreFromPersist() ne fait rien si localStorage est vide", () => {
			localStorage.clear();
			service.restoreFromPersist();
			expect(service.chronoState()).toBe("initial");
		});
	});
});
