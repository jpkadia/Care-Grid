import React, { useEffect, useMemo, useRef, useState } from 'react';

const FileUpload = ({ label, hint, multiple = false, compact = false, required = false, onChange, onDiscard, files, icon = 'fa-cloud-arrow-up', error = '' }) => {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const selectedFiles = useMemo(() => Array.isArray(files) ? files : files ? [files] : [], [files]);
  const hasSelectedFiles = selectedFiles.length > 0;

  useEffect(() => {
    let cancelled = false;

    if (!hasSelectedFiles) return undefined;

    Promise.all(selectedFiles.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, url: reader.result });
      reader.onerror = () => resolve({ name: file.name, url: '' });
      reader.readAsDataURL(file);
    }))).then(nextPreviews => {
      if (!cancelled) setPreviews(nextPreviews);
    });

    return () => {
      cancelled = true;
    };
  }, [hasSelectedFiles, selectedFiles]);

  useEffect(() => {
    if (hasSelectedFiles) return;
    const timer = window.setTimeout(() => setPreviews([]), 0);
    return () => window.clearTimeout(timer);
  }, [hasSelectedFiles]);

  const handleInputChange = event => {
    onChange?.(event);
    event.target.value = '';
  };

  const discard = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    onDiscard?.(index);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={compact ? 'w-full max-w-sm' : 'w-full'}>
      <label className="block cursor-pointer group">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} required={required && !selectedFiles.length} onChange={handleInputChange} className="sr-only" />
        {previews.length ? (
          <div className={`grid ${multiple ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'} gap-3`}>
            {previews.map((preview, index) => (
              <div key={`${preview.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                {preview.url ? (
                  <img src={preview.url} alt={preview.name} className={`w-full ${multiple ? 'aspect-square object-cover' : 'max-h-72 aspect-square object-contain bg-slate-50'} rounded-xl`} />
                ) : (
                  <div className="aspect-square rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center text-center p-3">Preview not available. Choose JPG, PNG or WebP.</div>
                )}
                <button type="button" onClick={(event) => discard(event, index)} className="mt-2 w-full rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                  <i className="fas fa-trash-can mr-2"></i>Discard
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 sm:p-6 text-center group-hover:border-teal-400 group-hover:bg-teal-50/50 transition-all">
            <div className="w-12 h-12 bg-white text-teal-600 rounded-2xl shadow-sm mx-auto flex items-center justify-center text-xl group-hover:-translate-y-1 transition-transform"><i className={`fas ${icon}`}></i></div>
            <p className="font-bold text-slate-800 mt-4">{label}</p>
            <p className="text-xs text-slate-400 mt-1">{hint}</p>
            <span className="inline-block mt-4 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-teal-700">Choose image{multiple ? 's' : ''}</span>
          </div>
        )}
      </label>
      {previews.length > 0 && <p className="mt-2 text-center text-xs font-semibold text-slate-400">Click the preview area to choose different image{multiple ? 's' : ''}.</p>}
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;
