import { useRef, useState, type DragEvent } from 'react';

interface UploadScreenProps {
  onFile: (file: File) => void;
  error: string | null;
  isParsing: boolean;
}

export default function UploadScreen({ onFile, error, isParsing }: UploadScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <main className="upload-screen">
      <h1 className="upload-screen__brand">Instant Analyst</h1>

      <div
        className={`dropzone${isDragging ? ' dropzone--active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="dropzone__icon" aria-hidden="true">
          ↑
        </div>
        <h2 className="dropzone__title">Drag &amp; drop your CSV file here</h2>
        <p className="dropzone__hint">
          or click Browse Files to select from your computer · .csv
        </p>
        <button
          type="button"
          className="button-primary"
          onClick={() => inputRef.current?.click()}
          disabled={isParsing}
        >
          {isParsing ? 'Reading…' : 'Browse Files'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = '';
          }}
        />
      </div>

      {error !== null && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
