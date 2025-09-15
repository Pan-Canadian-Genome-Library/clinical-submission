import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../pages/App.tsx';
import { LecternDataProvider } from '@overture-stack/lectern-ui';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<LecternDataProvider lecternUrl={'http://localhost:5173/api'} dictionaryName={'prod_pcgl_schema_6'}>
			<App />
		</LecternDataProvider>
	</StrictMode>,
);
