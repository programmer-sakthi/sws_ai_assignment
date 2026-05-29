import React from 'react';
import { formatFileSize, formatDate } from '../utils';
import './DocumentList.css';

const DocumentList = ({ documents }) => {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="document-list-container">
      <h3 className="section-title">Uploaded Documents</h3>
      <div className="table-responsive glass-panel">
        <table className="document-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Size</th>
              <th>Upload Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, idx) => (
              <tr key={doc.id || idx}>
                <td>
                  <div className="file-name-cell">
                    <svg className="pdf-icon-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>{doc.name}</span>
                  </div>
                </td>
                <td>{formatFileSize(doc.size)}</td>
                <td>{formatDate(doc.uploadDate)}</td>
                <td>
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-download"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentList;
