import React, { useState } from 'react';
import './App.css';
import UploadZone from './components/UploadZone';
import FileProgressList from './components/FileProgressList';
import DocumentList from './components/DocumentList';

function App() {
  const [userName, setUserName] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [completedDocuments, setCompletedDocuments] = useState([]);

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (userName.trim().length > 0) {
      setIsSetupComplete(true);
    }
  };

  const uploadFile = (fileObj) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('document', fileObj.file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => prev.map(u => 
            u.id === fileObj.id ? { ...u, progress: percentComplete } : u
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Update status to complete
            setUploads(prev => prev.map(u => 
              u.id === fileObj.id ? { ...u, status: 'Complete', progress: 100 } : u
            ));
            
            // Add to completed documents
            const newDoc = {
              id: fileObj.id,
              name: fileObj.file.name,
              size: fileObj.file.size,
              uploadDate: new Date().toISOString(),
              url: response.file.url,
            };
            setCompletedDocuments(prev => [...prev, newDoc]);
            resolve(newDoc);
          } catch (err) {
            setUploads(prev => prev.map(u => 
              u.id === fileObj.id ? { ...u, status: 'Failed' } : u
            ));
            reject(err);
          }
        } else {
          setUploads(prev => prev.map(u => 
            u.id === fileObj.id ? { ...u, status: 'Failed' } : u
          ));
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        setUploads(prev => prev.map(u => 
          u.id === fileObj.id ? { ...u, status: 'Failed' } : u
        ));
        reject(new Error('Network Error'));
      });

      xhr.open('POST', 'http://localhost:3000/upload', true);
      xhr.send(formData);
    });
  };

  const handleFilesSelected = (files) => {
    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substring(7) + Date.now(),
      file,
      progress: 0,
      status: 'Pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start upload for each file immediately
    newUploads.forEach(uploadObj => {
      // Small timeout to allow UI to update with 'Pending' status first
      setTimeout(() => {
        setUploads(prev => prev.map(u => 
          u.id === uploadObj.id ? { ...u, status: 'Uploading' } : u
        ));
        uploadFile(uploadObj).catch(err => console.error(err));
      }, 100);
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>DocVault</h1>
        <p>Secure PDF Storage System</p>
      </header>

      {!isSetupComplete ? (
        <div className="user-setup glass-panel">
          <h2>Welcome to DocVault</h2>
          <form onSubmit={handleSetupSubmit} className="input-group">
            <input 
              type="text" 
              placeholder="Enter your name to continue..." 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn" 
              disabled={userName.trim().length === 0}
              style={{ justifyContent: 'center' }}
            >
              Continue
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="welcome-banner">
            <h2>Welcome, {userName}!</h2>
            <p>Upload your PDF documents securely.</p>
          </div>
          
          <UploadZone onFilesSelected={handleFilesSelected} />
          
          <FileProgressList uploads={uploads} />
          
          <DocumentList documents={completedDocuments} />
        </>
      )}
    </div>
  );
}

export default App;
