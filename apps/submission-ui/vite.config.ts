import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const API_PROXY_PATH = '/api';

export default ({ mode }: { mode: string }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd(), ['VITE', 'API']) };
	const apiHost = process.env.API_URL || 'http://localhost:3000';
	const dictionarySchema = process.env.VITE_DICTIONARY_SCHEMA || 'VITE_DICTIONARY_SCHEMA';

	// https://vitejs.dev/config/
	return defineConfig({
		plugins: [react()],
		build: {
			outDir: 'dist',
			emptyOutDir: true,
			rollupOptions: {
				output: {
					format: 'es',
					globals: {
						react: 'React',
						'react-dom': 'ReactDOM',
					},
					manualChunks: {
						react: ['react', 'react-dom'],
					},
				},
			},
		},
		define: {
			__API_PROXY_PATH__: JSON.stringify(API_PROXY_PATH),
			__BASE_DICTIONARY_SCHEMA__: JSON.stringify(dictionarySchema),
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		server: {
			proxy: {
				[API_PROXY_PATH]: {
					target: apiHost,
					changeOrigin: true,
					rewrite: (path) => path.replace(API_PROXY_PATH, ''),
				},
			},
		},
	});
};
