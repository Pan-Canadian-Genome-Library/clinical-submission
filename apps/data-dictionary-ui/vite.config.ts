import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
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
});
