import '../styles/App.css';
import { DictionaryTable } from '@overture-stack/lectern-ui';

function App() {
	return (
		<div>
			<DictionaryTable lecternUrl={__API_PROXY_PATH__} dictionaryName={__BASE_DICTIONARY_SCHEMA__} />
		</div>
	);
}

export default App;
