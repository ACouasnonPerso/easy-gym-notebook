import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'easy.gym.notebook',
	appName: 'EasyGymNotebook',
	webDir: 'dist/easy-gym-notebook/browser',
	plugins: {
		Keyboard: {
			resize: 'none'
		}
	}
};

export default config;
