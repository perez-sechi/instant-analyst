import { useCallback, useState } from 'react';
import Dashboard from './components/Dashboard';
import UploadScreen from './components/UploadScreen';
import { CsvError, parseCsvFile, type Dataset } from './lib/csv';
import { ALL_CATEGORIES } from './lib/analytics';

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const parsed = await parseCsvFile(file);
      setDataset(parsed);
      setSelectedCategory(ALL_CATEGORIES);
    } catch (cause) {
      setError(
        cause instanceof CsvError
          ? cause.message
          : 'Something went wrong reading that file. Try another CSV.',
      );
    } finally {
      setIsParsing(false);
    }
  }, []);

  if (dataset === null) {
    return <UploadScreen onFile={handleFile} error={error} isParsing={isParsing} />;
  }

  return (
    <Dashboard
      dataset={dataset}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      onFile={handleFile}
      error={error}
      isParsing={isParsing}
    />
  );
}
