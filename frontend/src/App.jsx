import { useEffect, useState } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import DocumentList from './components/DocumentList';
import FileProgressList from './components/FileProgressList';
import NotificationCenter from './components/NotificationCenter';
import UploadZone from './components/UploadZone';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [uploads, setUploads] = useState([]);
  const [completedDocuments, setCompletedDocuments] = useState([]);
  const [isBulkUpload, setIsBulkUpload] = useState(false);

  useEffect(() => {
    if (token) {
      // Fetch initial files
      fetch('https://swsaiassignment-production.up.railway.app/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formattedData = data.map(doc => ({
            id: doc.id,
            name: doc.original_name,
            size: doc.size,
            uploadDate: doc.created_at,
            url: doc.url,
            public_id: doc.public_id
          }));
          setCompletedDocuments(formattedData);
        }
      })
      .catch(console.error);
    }
  }, [token]);

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
              id: response.file.id,
              name: response.file.name,
              size: response.file.size,
              uploadDate: response.file.uploadDate,
              url: response.file.url,
            };
            setCompletedDocuments(prev => [newDoc, ...prev]);
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

      xhr.open('POST', 'https://swsaiassignment-production.up.railway.app/upload', true);
      xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
      xhr.send(formData);
    });
  };

  const handleFilesSelected = async (files) => {
    if (!token) {
      alert("Please log in to upload files.");
      return;
    }

    const isBulk = files.length > 3;
    if (isBulk) {
      setIsBulkUpload(true);
    }

    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substring(7) + Date.now(),
      file,
      progress: 0,
      status: 'Pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    const uploadPromises = newUploads.map(uploadObj => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setUploads(prev => prev.map(u => 
            u.id === uploadObj.id ? { ...u, status: 'Uploading' } : u
          ));
          uploadFile(uploadObj, token)
            .then(resolve)
            .catch(err => {
              console.error(err);
              if (err.message.includes('Session expired')) {
                alert(err.message);
              }
              resolve(null); // Resolve anyway so Promise.all completes
            });
        }, 100);
      });
    });

    // Wait for all uploads to finish
    await Promise.all(uploadPromises);

    // After a bulk upload completes, notify the backend
    if (isBulk) {
      setTimeout(() => setIsBulkUpload(false), 3000); // hide bulk banner after 3 seconds

      try {
        await fetch('https://swsaiassignment-production.up.railway.app/uploads/batch-complete', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ count: files.length })
        });
      } catch (err) {
        console.error("Failed to report batch completion", err);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header" style={{ position: 'relative' }}>
        <h1>DocVault</h1>
        <p>Secure PDF Storage System</p>
        
        {token && (
          <>
            <NotificationCenter token={token} />
            <button 
              onClick={handleLogout} 
              className="btn logout-btn"
            >
              Logout
            </button>
          </>
        )}
      </header>

      {!token ? (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      ) : (
        <>
          {isBulkUpload && (
            <div className="bulk-banner glass-panel">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload in progress — processing {uploads.filter(u => u.status === 'Pending' || u.status === 'Uploading').length} files in background.
            </div>
          )}

          <div className="welcome-banner glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2>Welcome, {userName}!</h2>
            <p>You are authenticated and ready to upload documents.</p>
          </div>
          
          <UploadZone onFilesSelected={handleFilesSelected} />
          
          <FileProgressList uploads={uploads} isCollapsed={isBulkUpload} />
          
          <DocumentList documents={completedDocuments} />
        </>
      )}
    </div>
  );
}

export default App;
