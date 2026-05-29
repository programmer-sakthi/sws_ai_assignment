import React, { useCallback, useState } from 'react';
import './UploadZone.css';

const UploadZone = ({ onFilesSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const pdfFiles = filesArray.filter(f => f.type === 'application/pdf');
      
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      } else {
        alert('Please select valid PDF files only.');
      }
    }
  }, [onFilesSelected]);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const pdfFiles = filesArray.filter(f => f.type === 'application/pdf');
      
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      } else {
        alert('Please select valid PDF files only.');
      }
      e.target.value = null; // reset input
    }
  }, [onFilesSelected]);

  return (
    <div 
      className={`upload-zone glass-panel ${isDragActive ? 'active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        accept="application/pdf"
        onChange={handleFileChange}
        className="file-input"
      />
      <label htmlFor="file-upload" className="upload-label">
        <div className="upload-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <h3>Drag & Drop your PDFs here</h3>
        <p>or click to browse files</p>
      </label>
    </div>
  );
};

export default UploadZone;
