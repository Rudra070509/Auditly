import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [scanText, setScanText] = useState("System ready. Waiting to begin scan.");

  const onDrop = useCallback(acceptedFiles => {
    setFile(acceptedFiles[0]);
    setScanText(`Loaded ${acceptedFiles[0].name}. Ready for anomaly scan.`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full max-w-3xl mx-auto z-10 relative">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-xl transform hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragActive ? 'border-brand-blue bg-blue-50/50' : 'border-slate-300 bg-white/50 hover:bg-slate-50 hover:border-brand-blue'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center mb-2">
            <div className="bg-blue-100 p-2 rounded-full text-brand-blue">
              <UploadCloud size={24} strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {isDragActive ? "Drop ledger here..." : "Upload Client Ledger to Begin"}
          </h3>
          <p className="text-slate-500 text-xs mb-3 max-w-md mx-auto">
            Drag and drop your Excel or CSV transaction export here, or click to browse files.
          </p>
          <button className="bg-brand-blue text-white px-6 py-2 rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors shadow-md pointer-events-none">
            Browse Files
          </button>
          
          {file && (
            <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-medium text-green-600 bg-green-50 py-1.5 px-3 rounded-lg inline-flex">
              <CheckCircle size={14} />
              <span>{file.name} ready for scan</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
