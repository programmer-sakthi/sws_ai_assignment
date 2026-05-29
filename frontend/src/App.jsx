import React, { useState, useEffect } from 'react';
import './App.css';
import UploadZone from './components/UploadZone';
import FileProgressList from './components/FileProgressList';
import DocumentList from './components/DocumentList';
import AuthForm from './components/AuthForm';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [uploads, setUploads] = useState([]);
  const [completedDocuments, setCompletedDocuments] = useState([]);

  const handleAuthSuccess = (newToken, newUsername) => {
    localStorage.setItem('jwtToken', newToken);
    localStorage.setItem('userName', newUsername);
    setToken(newToken);
    setUserName(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userName');
    setToken(null);
    setUserName('');
    setUploads([]);
    setCompletedDocuments([]);
  };

  const uploadFile = (fileObj, currentToken) => {
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
        if (xhr.status === 401 || xhr.status === 403) {
          // Token expired or invalid
          handleLogout();
          reject(new Error('Session expired. Please log in again.'));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploads(prev => prev.map(u => 
              u.id === fileObj.id ? { ...u, status: 'Complete', progress: 100 } : u
            ));
            
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
      // Add Authorization header
      xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
      xhr.send(formData);
    });
  };

  const handleFilesSelected = (files) => {
    if (!token) {
      alert("Please log in to upload files.");
      return;
    }

    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substring(7) + Date.now(),
      file,
      progress: 0,
      status: 'Pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach(uploadObj => {
      setTimeout(() => {
        setUploads(prev => prev.map(u => 
          u.id === uploadObj.id ? { ...u, status: 'Uploading' } : u
        ));
        uploadFile(uploadObj, token).catch(err => {
          console.error(err);
          if (err.message.includes('Session expired')) {
            alert(err.message);
          }
        });
      }, 100);
    });
  };

  return (
    <div className="app-container">
      <header className="app-header" style={{ position: 'relative' }}>
        <h1>DocVault</h1>
        <p>Secure PDF Storage System</p>
        
        {token && (
          <button 
            onClick={handleLogout} 
            className="btn logout-btn"
          >
            Logout
          </button>
        )}
      </header>

      {!token ? (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      ) : (
        <>
          <div className="welcome-banner glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2>Welcome, {userName}!</h2>
            <p>You are authenticated and ready to upload documents.</p>
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
