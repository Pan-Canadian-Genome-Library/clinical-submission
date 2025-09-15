import '../styles/App.css';
import { DictionaryTable, useLecternData } from '@overture-stack/lectern-ui';

function App() {
	const lecternData = useLecternData();
	console.log(lecternData.dictionaries);

	return (
		<div>
			<DictionaryTable lecternUrl={'http://localhost:5173/api'} dictionaryName={'prod_pcgl_schema_6'} />
		</div>
	);
}

export default App;
