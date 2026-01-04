import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api, fileUrl } from "../api.js";
import { useUser } from "../UserContext.jsx";
import Reviews from "../components/Reviews.jsx";
import { startReading } from "../audiobook/tts.js";
import { pauseReading } from "../audiobook/pause.js";
import { skipForward, skipBackward } from "../audiobook/skip.js";
import { scrollToWord } from "../audiobook/utils.js";

export default function AudiobookReader() {
  const { id } = useParams();
  const { user } = useUser();
  const [document, setDocument] = useState(null);
  const [text, setText] = useState("");
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [stats, setStats] = useState({ totalTimeSeconds: 0, wordsRead: 0, sessionsCount: 0 });
  // For runtime input
  const [runHours, setRunHours] = useState(0);
  const [runMinutes, setRunMinutes] = useState(0);
  const [runSeconds, setRunSeconds] = useState(0);

  // Update stats.totalTimeSeconds when any input changes
  useEffect(() => {
    const total = Number(runHours) * 3600 + Number(runMinutes) * 60 + Number(runSeconds);
    setStats((prev) => ({ ...prev, totalTimeSeconds: total }));
  }, [runHours, runMinutes, runSeconds]);
  const [sessionStart, setSessionStart] = useState(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const WORDS_PER_PAGE = 500; // Show 500 words at a time
  
  const utteranceRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const textRef = useRef(null);
  const isPlayingRef = useRef(false);
  const pendingRestartRef = useRef(null);

  useEffect(() => {
    loadDocument();
    loadVoices();

    // Listen for voices changed event (some browsers load voices async)
    const onVoicesChanged = () => loadVoices();
    if (synthRef.current && typeof synthRef.current.addEventListener === 'function') {
      synthRef.current.addEventListener('voiceschanged', onVoicesChanged);
    }

    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      // Don't trigger if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case ' ':
          e.preventDefault();
          if (isPlayingRef.current) {
            handlePauseReading();
          } else {
            handleStartReading(currentWordIndex, true);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkipForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBackward();
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowSearch(true);
          }
          break;
        case 'b':
        case 'B':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowBookmarks((prev) => !prev);
          }
          break;
        case 'Escape':
          setShowSearch(false);
          setShowBookmarks(false);
          setShowVoiceMenu(false);
          setShowKeyboardHelp(false);
          break;
        case '?':
          setShowKeyboardHelp((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      // Cleanup: stop speech when unmounting
      if (synthRef.current) {
        if (typeof synthRef.current.cancel === 'function') {
          synthRef.current.cancel();
        }
        if (typeof synthRef.current.removeEventListener === 'function') {
          synthRef.current.removeEventListener('voiceschanged', onVoicesChanged);
        }
      }
      window.removeEventListener('keydown', handleKeyPress);
      // Save final session stats
      if (sessionStart && user) {
        saveSessionStats();
      }
    };
  }, [id]);

  async function loadDocument() {
    setLoading(true);
    setErr("");
    try {
      console.log("Loading document:", id);
      const doc = await api.getDocument(id);
      console.log("Document loaded:", doc);
      setDocument(doc);
      
      const extractedText = doc.extractedText || "";
      console.log("Text length:", extractedText.length);
      
      if (!extractedText) {
        setErr("No text content available for this document. The document may need to be re-uploaded.");
        setLoading(false);
        return;
      }
      
      setText(extractedText);
      
      // Split text into words with positions
      const wordArray = extractedText.split(/(\s+)/).filter(w => w.trim().length > 0);
      console.log("Words count:", wordArray.length);
      setWords(wordArray);

      // Load saved reading progress
      if (user) {
        try {
          const progress = await api.getReadingProgress(user.id, id);
          if (progress && progress.currentPosition) {
            const position = progress.currentPosition;
            setCurrentWordIndex(position);
            // Set to the page containing this word
            setCurrentPage(Math.floor(position / WORDS_PER_PAGE));
          }
        } catch (progressErr) {
          console.warn("Could not load progress:", progressErr);
        }
        
        // Load bookmarks and highlights
        loadBookmarks();
        loadHighlights();
      }
    } catch (error) {
      console.error("Error loading document:", error);
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  function loadVoices() {
    if (!synthRef.current) return;
    const availableVoices = synthRef.current.getVoices();
    setVoices(availableVoices);
    // Select first English voice by default
    if (!selectedVoice && availableVoices.length > 0) {
      const englishVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      setSelectedVoice(englishVoice);
    }
  }



  // Use imported startReading
  function handleStartReading(fromIndex = currentWordIndex, isUserAction = false) {
    startReading({
      synthRef, utteranceRef, words, fromIndex, rate, selectedVoice, setCurrentWordIndex, setIsPlaying, isPlayingRef, pendingRestartRef, sessionStart, setSessionStart, user, id, saveProgress, setErr, currentWordIndex, currentPage, setCurrentPage, WORDS_PER_PAGE
    });
  }

  // Use imported pauseReading
  function handlePauseReading() {
    pauseReading({ synthRef, isPlayingRef, setIsPlaying, user, currentWordIndex, saveProgress });
  }

  // Use imported skipForward/skipBackward
  function handleSkipForward() {
    skipForward({ currentWordIndex, words, setCurrentWordIndex, setCurrentPage, WORDS_PER_PAGE, isPlayingRef, pendingRestartRef, synthRef });
  }
  function handleSkipBackward() {
    skipBackward({ currentWordIndex, setCurrentWordIndex, setCurrentPage, WORDS_PER_PAGE, isPlayingRef, pendingRestartRef, synthRef });
  }

  function handleWordClick(index) {
    setCurrentWordIndex(index);
    if (isPlayingRef.current) {
      pendingRestartRef.current = index;
      synthRef.current.cancel();
    }
  }

  function nextPage() {
    if ((currentPage + 1) * WORDS_PER_PAGE < words.length) {
      setCurrentPage(prev => prev + 1);
    }
  }

  function prevPage() {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }

  function changeRate(newRate) {
    setRate(newRate);
    if (isPlayingRef.current) {
      pendingRestartRef.current = currentWordIndex;
      synthRef.current.cancel();
    }
  }

  async function saveProgress(position) {
    if (!user || !id) return;
    try {
      await api.saveReadingProgress({
        userId: user.id,
        documentId: id,
        currentPosition: position
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }

  async function saveSessionStats() {
    if (!user || !id || !sessionStart) return;
    const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000);
    const wordsThisSession = Math.max(0, currentWordIndex - (stats.wordsRead || 0));
    
    try {
      await api.saveReadingStats({
        userId: user.id,
        documentId: id,
        timeSeconds: sessionDuration,
        wordsRead: wordsThisSession
      });
    } catch (error) {
      console.error("Failed to save stats:", error);
    }
  }

  async function addBookmark() {
    if (!user || !id) return;
    const note = prompt("Add a note for this bookmark (optional):");
    try {
      await api.createBookmark({
        userId: user.id,
        documentId: id,
        position: currentWordIndex,
        note
      });
      loadBookmarks();
    } catch (error) {
      console.error("Failed to create bookmark:", error);
    }
  }

  async function loadBookmarks() {
    if (!user || !id) return;
    try {
      const bm = await api.getBookmarks(user.id, id);
      setBookmarks(bm);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  }

  function searchText() {
    if (!searchTerm.trim() || !text) return;
    const results = [];
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    let index = 0;
    
    while ((index = lowerText.indexOf(lowerSearch, index)) !== -1) {
      // Convert character index to word index
      const beforeText = text.substring(0, index);
      const wordIndex = beforeText.split(/\s+/).length - 1;
      results.push({ wordIndex, text: text.substring(index, index + searchTerm.length) });
      index += searchTerm.length;
      if (results.length >= 100) break; // Limit results
    }
    
    setSearchResults(results);
  }

  function jumpToSearch(wordIndex) {
    setCurrentWordIndex(wordIndex);
    setCurrentPage(Math.floor(wordIndex / WORDS_PER_PAGE));
    setShowSearch(false);
    scrollToWord(wordIndex);
  }

  async function loadHighlights() {
    if (!user || !id) return;
    try {
      const hl = await api.getHighlights(user.id, id);
      setHighlights(hl);
    } catch (error) {
      console.error("Failed to load highlights:", error);
    }
  }

  function handleWordSelection(wordIndex) {
    if (selectionStart === null) {
      setSelectionStart(wordIndex);
      setSelectionEnd(wordIndex);
    } else {
      setSelectionEnd(wordIndex);
    }
  }

  async function createHighlight(color = '#ffeb3b') {
    if (!user || !id || selectionStart === null || selectionEnd === null) return;
    
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    const note = prompt("Add a note for this highlight (optional):");
    
    try {
      await api.createHighlight({
        userId: user.id,
        documentId: id,
        startPosition: start,
        endPosition: end,
        note,
        color
      });
      setSelectionStart(null);
      setSelectionEnd(null);
      setShowHighlightMenu(false);
      loadHighlights();
    } catch (error) {
      console.error("Failed to create highlight:", error);
    }
  }

  function cancelSelection() {
    setSelectionStart(null);
    setSelectionEnd(null);
    setShowHighlightMenu(false);
  }

  function isWordHighlighted(wordIndex) {
    return highlights.find(h => wordIndex >= h.startPosition && wordIndex <= h.endPosition);
  }

  function isWordSelected(wordIndex) {
    if (selectionStart === null || selectionEnd === null) return false;
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    return wordIndex >= start && wordIndex <= end;
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <h2>Loading Audiobook...</h2>
        <p className="subtle">Please wait while we prepare your book</p>
      </div>
    );
  }
  
  if (!document) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div className="error" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2>Document Not Found</h2>
          <p>The requested audiobook could not be found.</p>
          <button onClick={() => window.history.back()} className="btn btnPrimary" style={{ marginTop: 16 }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const progress = words.length > 0 ? ((currentWordIndex / words.length) * 100).toFixed(1) : 0;

  return (
    <div className="audiobook-reader-container">
      {/* Runtime Input Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Set Run Time:</label>
        <input
          type="number"
          min="0"
          value={runHours}
          onChange={e => setRunHours(e.target.value)}
          style={{ width: 50, padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}
          aria-label="Hours"
        />
        <span>h</span>
        <input
          type="number"
          min="0"
          max="59"
          value={runMinutes}
          onChange={e => setRunMinutes(e.target.value)}
          style={{ width: 50, padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}
          aria-label="Minutes"
        />
        <span>m</span>
        <input
          type="number"
          min="0"
          max="59"
          value={runSeconds}
          onChange={e => setRunSeconds(e.target.value)}
          style={{ width: 50, padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}
          aria-label="Seconds"
        />
        <span>s</span>
        <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-subtle)' }}>
          Total: {stats.totalTimeSeconds} seconds
        </span>
      </div>
      {/* Show error as dismissible banner instead of blocking UI */}
      {err && (
        <div className="error" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{err}</span>
          <button onClick={() => setErr("")} className="btn btnSmall btnGhost" style={{ padding: '4px 8px' }}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="audiobook-header">
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {document.coverPath ? (
            <img 
              className="audiobook-cover"
              src={fileUrl(document.coverPath)} 
              alt={document.title}
              loading="lazy"
              style={{background: '#222', marginBottom: 8}}
            />
          ) : (
            <div className="audiobook-cover" style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#222',color:'#fff',fontSize:48,letterSpacing:2}}>
              <span role="img" aria-label="No cover">🎧</span>
            </div>
          )}
        </div>
        <div className="audiobook-header-details">
          <h1 className="audiobook-title">{document.title}</h1>
          {document.author && <p className="audiobook-author">by {document.author}</p>}
          {document.description && <p className="audiobook-desc">{document.description}</p>}
        </div>
      </div>

      {/* Audio Controls */}
      <div className="audiobook-controls">
        <div className="audiobook-controls-row">
          <button 
            className="btn btnSecondary" 
            onClick={handleSkipBackward}
            title="Rewind 50 words"
          >
            <i className="bi bi-skip-backward"></i>
          </button>
          
          {!isPlaying ? (
            <button 
              className="btn btnPrimary" 
              onClick={() => handleStartReading(currentWordIndex, true)}
              style={{ padding: "12px 24px" }}
            >
              <i className="bi bi-play-fill"></i> Play
            </button>
          ) : (
            <button 
              className="btn btnPrimary" 
              onClick={handlePauseReading}
              style={{ padding: "12px 24px" }}
            >
              <i className="bi bi-pause-fill"></i> Pause
            </button>
          )}
          
          <button 
            className="btn btnSecondary" 
            onClick={handleSkipForward}
            title="Forward 50 words"
          >
            <i className="bi bi-skip-forward"></i>
          </button>

          <button 
            className="btn btnSecondary" 
            onClick={addBookmark}
            title="Add Bookmark (Ctrl+B)"
          >
            <i className="bi bi-bookmark-plus"></i>
          </button>

          <button 
            className="btn btnSecondary" 
            onClick={() => setShowSearch(!showSearch)}
            title="Search (Ctrl+F)"
          >
            <i className="bi bi-search"></i>
          </button>

          <button 
            className="btn btnSecondary" 
            onClick={() => setShowBookmarks(!showBookmarks)}
            title="View Bookmarks"
          >
            <i className="bi bi-bookmark-fill"></i> {bookmarks.length > 0 && `(${bookmarks.length})`}
          </button>

          <button 
            className="btn btnSecondary" 
            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
            title="Change Voice"
          >
            <i className="bi bi-mic"></i>
          </button>

          <button 
            className={`btn ${selectionStart !== null ? 'btnPrimary' : 'btnSecondary'}`}
            onClick={() => {
              if (selectionStart !== null) {
                cancelSelection();
              } else {
                setSelectionStart(0);
                alert("Click on words to start and end your highlight selection");
              }
            }}
            title="Highlight Text"
          >
            <i className="bi bi-highlighter"></i> {selectionStart !== null ? 'Cancel' : 'Highlight'}
          </button>

          <button 
            className="btn btnSecondary" 
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            title="Keyboard Shortcuts (?)"
          >
            <i className="bi bi-question-circle"></i>
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>Speed:</span>
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
              <button
                key={speed}
                className={`btn btnSmall ${rate === speed ? 'btnPrimary' : 'btnGhost'}`}
                onClick={() => changeRate(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="audiobook-progress">
          <span className="audiobook-progress-label">
            Word {currentWordIndex + 1} / {words.length}
          </span>
          <div className="audiobook-progress-bar">
            <div 
              className="audiobook-progress-bar-inner"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="audiobook-progress-label">{progress}%</span>
        </div>
      </div>

      {/* Voice Selection Menu */}
      {showVoiceMenu && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "var(--panel)",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 1000,
          maxWidth: 400,
          maxHeight: "70vh",
          overflow: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Select Voice</h3>
            <button onClick={() => setShowVoiceMenu(false)} className="btn btnGhost">
              <i className="bi bi-x"></i>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {voices.map((voice, idx) => (
              <button
                key={idx}
                className={`btn ${selectedVoice === voice ? 'btnPrimary' : 'btnSecondary'}`}
                onClick={() => {
                  setSelectedVoice(voice);
                  setShowVoiceMenu(false);
                }}
                style={{ textAlign: "left", justifyContent: "flex-start" }}
              >
                {voice.name} ({voice.lang})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Panel */}
      {showSearch && (
        <div style={{
          backgroundColor: "var(--panel)",
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          border: "1px solid var(--border)"
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchText()}
              placeholder="Search in document..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)"
              }}
              autoFocus
            />
            <button onClick={searchText} className="btn btnPrimary">
              Search
            </button>
            <button onClick={() => setShowSearch(false)} className="btn btnSecondary">
              Close
            </button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ maxHeight: 300, overflow: "auto" }}>
              <p style={{ marginBottom: 8, fontSize: 14, opacity: 0.7 }}>
                Found {searchResults.length} results
              </p>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => jumpToSearch(result.wordIndex)}
                  style={{
                    padding: 8,
                    cursor: "pointer",
                    borderRadius: 4,
                    marginBottom: 4,
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--border)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg)"}
                >
                  Word {result.wordIndex}: "{result.text}"
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div style={{
          backgroundColor: "var(--panel)",
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          border: "1px solid var(--border)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Bookmarks</h3>
            <button onClick={() => setShowBookmarks(false)} className="btn btnGhost">
              <i className="bi bi-x"></i>
            </button>
          </div>
          {bookmarks.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No bookmarks yet. Add one with the bookmark button!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  style={{
                    padding: 12,
                    backgroundColor: "var(--bg)",
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setCurrentWordIndex(bookmark.position);
                    setCurrentPage(Math.floor(bookmark.position / WORDS_PER_PAGE));
                    setShowBookmarks(false);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                        Word {bookmark.position} • {new Date(bookmark.createdAt).toLocaleDateString()}
                      </div>
                      {bookmark.note && <div style={{ fontSize: 14 }}>{bookmark.note}</div>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        api.deleteBookmark(bookmark.id).then(loadBookmarks);
                      }}
                      className="btn btnSmall btnGhost"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Highlight Selection Menu */}
      {showHighlightMenu && selectionStart !== null && selectionEnd !== null && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "var(--panel)",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 1000,
          minWidth: 300
        }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>Choose Highlight Color</h3>
            <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>
              {Math.abs(selectionEnd - selectionStart) + 1} words selected
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { color: '#ffeb3b', name: 'Yellow' },
              { color: '#4caf50', name: 'Green' },
              { color: '#2196f3', name: 'Blue' },
              { color: '#f44336', name: 'Red' },
              { color: '#9c27b0', name: 'Purple' },
              { color: '#ff9800', name: 'Orange' },
              { color: '#00bcd4', name: 'Cyan' },
              { color: '#e91e63', name: 'Pink' }
            ].map(({ color, name }) => (
              <button
                key={color}
                onClick={() => createHighlight(color)}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: "2px solid var(--border)",
                  backgroundColor: color,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#000"
                }}
                title={name}
              >
                {name}
              </button>
            ))}
          </div>
          <button onClick={cancelSelection} className="btn btnSecondary" style={{ width: "100%" }}>
            Cancel
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "var(--panel)",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 1000,
          maxWidth: 500
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Keyboard Shortcuts</h3>
            <button onClick={() => setShowKeyboardHelp(false)} className="btn btnGhost">
              <i className="bi bi-x"></i>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><kbd>Space</kbd></span>
              <span>Play / Pause</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><kbd>→</kbd></span>
              <span>Skip forward 50 words</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><kbd>←</kbd></span>
              <span>Skip backward 50 words</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><kbd>Ctrl+F</kbd></span>
              <span>Search text</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><kbd>Ctrl+B</kbd></span>
              <span>Toggle bookmarks</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><kbd>Esc</kbd></span>
              <span>Close panels</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><kbd>?</kbd></span>
              <span>Show this help</span>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {words.length > WORDS_PER_PAGE && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          gap: 16, 
          padding: "16px 0",
          borderBottom: "1px solid var(--border)"
        }}>
          <button 
            className="btn btnSecondary btnSmall" 
            onClick={prevPage}
            disabled={currentPage === 0}
          >
            <i className="bi bi-chevron-left"></i> Previous
          </button>
          <span style={{ fontSize: 14 }}>
            Page {currentPage + 1} / {Math.ceil(words.length / WORDS_PER_PAGE)}
          </span>
          <button 
            className="btn btnSecondary btnSmall" 
            onClick={nextPage}
            disabled={(currentPage + 1) * WORDS_PER_PAGE >= words.length}
          >
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Text Display */}
      <div 
        ref={textRef}
        style={{ 
          fontSize: 18, 
          lineHeight: 1.8, 
          padding: 24,
          backgroundColor: "var(--panel-bg)",
          borderRadius: 8,
          maxHeight: "calc(100vh - 450px)",
          overflowY: "auto"
        }}
      >
        {words.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.5 }}>No text available for this document.</p>
        ) : (
          (() => {
            const startIndex = currentPage * WORDS_PER_PAGE;
            const endIndex = Math.min(startIndex + WORDS_PER_PAGE, words.length);
            const pageWords = words.slice(startIndex, endIndex);
            
            return pageWords.map((word, pageIndex) => {
              const actualIndex = startIndex + pageIndex;
              const highlight = isWordHighlighted(actualIndex);
              const isSelected = isWordSelected(actualIndex);
              
              return (
                <span
                  key={actualIndex}
                  id={`word-${actualIndex}`}
                  onClick={() => {
                    if (selectionStart !== null) {
                      handleWordSelection(actualIndex);
                      setShowHighlightMenu(true);
                    } else {
                      handleWordClick(actualIndex);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: 3,
                    backgroundColor: 
                      actualIndex === currentWordIndex ? "var(--primary)" : 
                      isSelected ? "rgba(255, 235, 59, 0.4)" :
                      highlight ? highlight.color + "40" : 
                      "transparent",
                    color: actualIndex === currentWordIndex ? "#fff" : "inherit",
                    transition: "all 0.2s ease",
                    fontWeight: actualIndex === currentWordIndex ? 600 : 400,
                    borderBottom: highlight ? `2px solid ${highlight.color}` : "none"
                  }}
                >
                  {word}{" "}
                </span>
              );
            });
          })()
        )}
      </div>

      {/* Reviews Section */}
      <Reviews contentType="document" contentId={parseInt(id)} />
    </div>
  );
}
