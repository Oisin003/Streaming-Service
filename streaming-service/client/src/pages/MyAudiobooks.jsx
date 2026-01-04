import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "../api.js";
import { useUser } from "../UserContext.jsx";

export default function MyAudiobooks() {
  const { user } = useUser();
  const [documents, setDocuments] = useState([]);
  const [readingProgress, setReadingProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [docs, progress] = await Promise.all([
        api.listDocuments(),
        api.getUserReadingProgress(user.id)
      ]);
      setDocuments(docs);
      setReadingProgress(progress);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
        <i className="bi bi-person-circle" style={{ fontSize: 64 }}></i>
        <h2 style={{ marginTop: 16 }}>Sign In Required</h2>
        <p>Please sign in to track your audiobook progress</p>
        <Link to="/audiobooks" className="btn btnPrimary" style={{ marginTop: 16 }}>
          Browse All Audiobooks
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Get documents user has started reading
  const inProgress = readingProgress.filter(p => p.currentPosition > 0);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="pageTitle" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          <i className="bi bi-book"></i>
          My Audiobooks
        </h1>
        <div className="pill" style={{ marginTop: 8 }}>
          {inProgress.length} book{inProgress.length !== 1 ? 's' : ''} in progress
        </div>
      </div>

      {inProgress.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
          <i className="bi bi-book" style={{ fontSize: 64 }}></i>
          <h2 style={{ marginTop: 16 }}>No Books Started Yet</h2>
          <p>Start listening to build your reading history</p>
          <Link to="/audiobooks" className="btn btnPrimary" style={{ marginTop: 16 }}>
            Browse Audiobooks
          </Link>
        </div>
      ) : (
        <>
          <h2 style={{ marginBottom: 16, fontSize: 20 }}>Continue Reading</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
            {inProgress.map((progress) => {
              const doc = documents.find(d => d.id === progress.documentId);
              if (!doc) return null;
              
              return (
                <Link 
                  key={progress.documentId} 
                  to={`/audiobook/${progress.documentId}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {doc.coverPath ? (
                      <img 
                        src={fileUrl(doc.coverPath)} 
                        alt={doc.title}
                        style={{ width: '100%', height: 300, objectFit: 'cover', backgroundColor: 'var(--border)' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: 300, 
                        backgroundColor: 'var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="bi bi-file-earmark-text" style={{ fontSize: 60, opacity: 0.3 }}></i>
                      </div>
                    )}
                    <div style={{ padding: 12 }}>
                      <h3 style={{ margin: 0, marginBottom: 4, fontSize: 16 }}>{doc.title}</h3>
                      {doc.author && (
                        <p style={{ margin: 0, fontSize: 14, opacity: 0.6 }}>{doc.author}</p>
                      )}
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                        Last read: {new Date(progress.lastRead).toLocaleDateString()}
                      </div>
                      <div className="btn btnPrimary btnSmall" style={{ marginTop: 8, width: '100%', textAlign: 'center' }}>
                        <i className="bi bi-play-circle"></i> Continue
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
