import React from 'react';
import { formatFileSize } from '../utils';
import './FileProgressList.css';

const FileProgressList = ({ uploads }) => {
  if (!uploads || uploads.length === 0) return null;

  return (
    <div className="progress-list-container">
      <h3 className="section-title">Upload Progress</h3>
      <div className="progress-list">
        {uploads.map((upload) => (
          <div key={upload.id} className="progress-item glass-panel">
            <div className="progress-info">
              <div className="file-details">
                <svg className="pdf-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
                <div className="file-text">
                  <p className="filename">{upload.file.name}</p>
                  <p className="filesize">{formatFileSize(upload.file.size)} &bull; {upload.status}</p>
                </div>
              </div>
              <div className="percentage">{upload.progress}%</div>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className={`progress-bar-fill ${upload.status.toLowerCase()}`}
                style={{ width: `${upload.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileProgressList;
