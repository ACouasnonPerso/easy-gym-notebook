// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
	testRunner: 'karma',
	coverageAnalysis: 'perTest',
	karma: {
		projectType: 'angular-cli',
		configFile: 'karma.conf.js',
		config: {
			browsers: ['ChromeHeadless'],
		},
	},
	checkers: ['typescript'],
	tsconfigFile: 'tsconfig.stryker.json',
	mutate: [
		'src/app/core_logic/**/*.ts',
		'src/app/primary_ports/**/*.ts',
		'!src/app/**/*.spec.ts',
		'!src/app/**/*.d.ts',
	],
	ignorePatterns: ['.angular', '.stryker-tmp', 'reports', 'android', 'ios', 'dist', 'coverage', 'out-tsc'],
	reporters: ['html', 'clear-text', 'progress'],
	htmlReporter: {
		fileName: 'reports/mutation/mutation.html',
	},
	timeoutFactor: 2,
	timeoutMS: 60000,
	concurrency: 2,
};

export default config;
