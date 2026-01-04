import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "../api.js";
import { listContinueWatching } from "../watch.js";

// Holiday detection utility
function getHoliday() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  
  // New Year's Day
  if (month === 1 && day === 1) {
    return { name: "Happy New Year!", emoji: "🎉", color: "#FFD700", message: "Wishing you a fantastic year ahead!" };
  }
  // New Year's Eve
  if (month === 12 && day === 31) {
    return { name: "New Year's Eve!", emoji: "🎊", color: "#FFD700", message: "Get ready to celebrate the new year!" };
  }
  // Valentine's Day
  if (month === 2 && day === 14) {
    return { name: "Happy Valentine's Day!", emoji: "💝", color: "#FF69B4", message: "Spread love and joy today!" };
  }
  // St. Patrick's Day
  if (month === 3 && day === 17) {
    return { name: "Happy St. Patrick's Day!", emoji: "🍀", color: "#00FF00", message: "May the luck of the Irish be with you!" };
  }
  // Easter (approximate - varies by year, using April 9 as example)
  if (month === 4 && day >= 7 && day <= 14) {
    return { name: "Happy Easter!", emoji: "🐰", color: "#FF1493", message: "Enjoy this beautiful spring celebration!" };
  }
  // Halloween
  if (month === 10 && day === 31) {
    return { name: "Happy Halloween!", emoji: "🎃", color: "#FF6600", message: "Have a spooky and fun night!" };
  }
  // Thanksgiving (4th Thursday in November - approximate)
  if (month === 11 && day >= 22 && day <= 28) {
    return { name: "Happy Thanksgiving!", emoji: "🦃", color: "#FF8C00", message: "Grateful for you and your watchlist!" };
  }
  // Christmas Eve
  if (month === 12 && day === 24) {
    return { name: "Merry Christmas Eve!", emoji: "🎄", color: "#228B22", message: "The magic is in the air tonight!" };
  }
  // Christmas Day
  if (month === 12 && day === 25) {
    return { name: "Merry Christmas!", emoji: "🎅", color: "#DC143C", message: "Wishing you joy, peace, and great movies!" };
  }
  // Christmas Season (Dec 20-26)
  if (month === 12 && day >= 20 && day <= 26) {
    return { name: "Happy Holidays!", emoji: "⛄", color: "#4169E1", message: "Enjoy the festive season!" };
  }
  
  return null;
}

function HolidayBanner() {
  const holiday = getHoliday();
  const [visible, setVisible] = useState(true);
  
  if (!holiday || !visible) return null;
  
  return (
    <div
      style={{
        position: 'relative',
        margin: '20px 0',
        padding: '24px',
        background: `linear-gradient(135deg, ${holiday.color}22, ${holiday.color}11)`,
        border: `2px solid ${holiday.color}55`,
        borderRadius: '16px',
        boxShadow: `0 8px 32px ${holiday.color}33`,
        overflow: 'hidden',
        animation: 'slideDown 0.6s ease-out',
      }}
    >
      <button
        onClick={() => setVisible(false)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          opacity: 0.6,
          transition: 'opacity 0.3s',
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.6'}
      >
        ×
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div
          style={{
            fontSize: '48px',
            animation: 'bounce 2s infinite',
          }}
        >
          {holiday.emoji}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              fontWeight: 'bold',
              color: holiday.color,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {holiday.name}
          </h3>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
            {holiday.message}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

function posterStyle(posterPath) {
  const u = fileUrl(posterPath);
  if (!u || u === 'null' || u.includes('null')) {
    return {
      background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.2), rgba(0, 0, 0, 0.8))'
    };
  }
  return {
    backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.30)), url(${u})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
}

function Tile({ item }) {
  const isShow = item.type === "SHOW";
  const style = posterStyle(item.posterPath);
  const hasPoster = fileUrl(item.posterPath);
  
  return (
    <Link to={isShow ? `/show/${item.id}` : `/movie/${item.id}`} className="tile">
      <div className="tilePoster" style={style}>
        {!hasPoster && (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '48px',
            opacity: 0.4,
            zIndex: 1
          }}>
            <i className="bi bi-film"></i>
          </div>
        )}
      </div>
      <div className="tileBody">
        <div className="tileTitle">{item.title}</div>
        <div className="tileMeta">
          <span className="badge">{isShow ? "SHOW" : "MOVIE"}</span>
          {item.genre ? <span>{item.genre}</span> : <span className="subtle">—</span>}
          {item.year ? <span>{item.year}</span> : null}
        </div>
      </div>
    </Link>
  );
}


function ContinueTile({ rec, lookup }) {
  // rec.key like "movie:12" or "episode:55"
  const [kind, idStr] = rec.key.split(":");
  const id = Number(idStr);
  const meta = lookup.get(rec.key);

  if (!meta) return null;

  const href = kind === "movie" ? `/movie/${meta.movieId}` : `/show/${meta.showId}`;
  const title = meta.title;
  const subtitle =
    kind === "movie"
      ? "Resume movie"
      : `Resume S${meta.seasonNumber}E${meta.episodeNumber}`;

  const pct = Math.round((rec.pct || 0) * 100);

  return (
    <Link to={href} className="tile">
      <div className="tilePoster" style={posterStyle(meta.posterPath)} />
      <div className="tileBody">
        <div className="tileTitle">{title}</div>
        <div className="tileMeta">
          <span className="badge">{subtitle}</span>
          <span>{pct}%</span>
        </div>
      </div>
    </Link>
  );
}

export default function Home({ search: initialSearch }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState(initialSearch || "");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [continueList, setContinueList] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [continueLookup, setContinueLookup] = useState(new Map());

  useEffect(() => {
    api.listAll().then(setItems).catch(e => setErr(e.message));
    api.listGenres().then(setGenres).catch(() => {});
    setContinueList(listContinueWatching(12));
    // For demo, use userId 1. Replace with real user id if available.
    api.getRecommendations(1).then(setRecommendations).catch(() => {});
  }, []);

  const normalized = (search || "").trim().toLowerCase();

  // Filter by search
  const filteredBySearch = useMemo(() => {
    if (!normalized) return items;
    return items.filter(i => (i.title || "").toLowerCase().includes(normalized));
  }, [items, normalized]);

  // Filter by type
  const filteredByType = useMemo(() => {
    if (!typeFilter) return filteredBySearch;
    return filteredBySearch.filter(i => i.type === typeFilter);
  }, [filteredBySearch, typeFilter]);

  // Filter by genre
  const filtered = useMemo(() => {
    if (!selectedGenre || selectedGenre === "All") return filteredByType;
    return filteredByType.filter(i => (i.genre || "").trim() === selectedGenre);
  }, [filteredByType, selectedGenre]);

  const movies = filtered.filter(i => i.type === "MOVIE");
  const shows = filtered.filter(i => i.type === "SHOW");

  const featured = filtered[0] || items[0] || null;

  useEffect(() => {
    let cancelled = false;

    async function hydrateContinue() {
      const map = new Map(continueLookup);

      for (const rec of continueList) {
        if (map.has(rec.key)) continue;

        const [kind, idStr] = rec.key.split(":");
        const id = Number(idStr);

        try {
          if (kind === "movie") {
            const m = await api.getMovie(id);
            map.set(rec.key, {
              title: m.title,
              posterPath: m.posterPath,
              movieId: m.id,
              showId: null
            });
          } else if (kind === "episode") {
            const ep = await api.getEpisode(id);
            const show = await api.getMovie(ep.showId);
            map.set(rec.key, {
              title: show.title,
              posterPath: ep.posterPath || show.posterPath,
              showId: ep.showId,
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.episodeNumber
            });
          }
        } catch {
          // ignore
        }
      }

      if (!cancelled) setContinueLookup(map);
    }

    hydrateContinue();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueList]);

  const byGenre = useMemo(() => {
    const map = new Map();
    
    // Split compound genres by "/" only
    for (const m of filtered) {
      const genreStr = (m.genre || "").trim();
      if (!genreStr) continue;
      
      // Split only by "/" to preserve multi-word genres like "Coming of Age", "Teen Drama"
      const individualGenres = genreStr
        .split('/')
        .map(g => g.trim())
        .filter(g => g.length > 0);
      
      // Add movie to each genre category
      for (const genre of individualGenres) {
        if (!map.has(genre)) {
          map.set(genre, []);
        }
        // Avoid duplicates in the same genre
        if (!map.get(genre).some(item => item.id === m.id)) {
          map.get(genre).push(m);
        }
      }
    }
    
    // Sort genres alphabetically
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filtered]);

  return (
    <div>
      {/* Holiday Banner */}
      <HolidayBanner />
      
      {/* Enhanced Search & Filter UI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0 8px 0', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search titles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
        />
        <span style={{ fontWeight: 500 }}>Genre:</span>
        <select
          value={selectedGenre}
          onChange={e => setSelectedGenre(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}
        >
          <option value="">All</option>
          {genres.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <span style={{ fontWeight: 500 }}>Type:</span>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', minWidth: 100 }}
        >
          <option value="">All</option>
          <option value="MOVIE">Movie</option>
          <option value="SHOW">Show</option>
        </select>
        {(selectedGenre || typeFilter || search) && (
          <button className="btn btnGhost" style={{ marginLeft: 8 }} onClick={() => { setSelectedGenre(""); setTypeFilter(""); setSearch(""); }}>
            Clear All
          </button>
        )}
      </div>
      <div className="hero">
        <div className="heroInner">
          <div className="heroLeft">
            <div className="heroKicker">🎬 Achilles Originals</div>
            <div className="heroTitle">
              Welcome to <span>Achilles+</span>
            </div>
            <div className="heroDesc">
              Your personal streaming empire. Curate your own Netflix-style library with 
              unlimited movies and TV shows. Seamless playback with smart resume, 
              gorgeous posters, and zero subscription fees. Your content, your rules.
            </div>

            <div className="heroActions">
              {featured ? (
                <Link
                  className="btn btnPrimary"
                  to={featured.type === "SHOW" ? `/show/${featured.id}` : `/movie/${featured.id}`}
                >
                  <i className="bi bi-play-fill"></i> Play Featured
                </Link>
              ) : (
                <button className="btn btnPrimary" disabled>
                  <i className="bi bi-play-fill"></i> Play Featured
                </button>
              )}

              <Link className="btn btnSecondary" to="/admin/movies">
                <i className="bi bi-gear-fill"></i> Content Manager
              </Link>

              <a className="btn btnGhost" href="http://localhost:8080/health" target="_blank" rel="noreferrer">
                <i className="bi bi-heart-pulse"></i> Server Status
              </a>
            </div>

            {err && <div className="error" style={{ marginTop: 14 }}>{err}</div>}
          </div>

          <div className="pill"><i className="bi bi-house-heart"></i> Self-Hosted</div>
        </div>
      </div>

      {continueList.length > 0 && (
        <>
          <div className="railHead">
            <h2 className="railTitle"><i className="bi bi-arrow-clockwise"></i> Continue Watching</h2>
            <div className="railHint">Pick up where you left off · {continueList.length} items</div>
          </div>
          <div className="rail">
            {continueList.map((rec) => (
              <ContinueTile key={rec.key} rec={rec} lookup={continueLookup} />
            ))}
          </div>
        </>
      )}



      {/* Recommendations */}
      {recommendations.length > 0 && !selectedGenre && (
        <>
          <div className="railHead">
            <h2 className="railTitle"><i className="bi bi-stars"></i> Recommended For You</h2>
            <div className="railHint">{recommendations.length} picks</div>
          </div>
          <div className="rail">
            {recommendations.slice(0, 20).map(item => <Tile key={item.id} item={item} />)}
          </div>
        </>
      )}

      {/* Genre rows (only if no filter is selected) */}
      {!selectedGenre && Array.from(byGenre.entries()).map(([g, list]) => {
        if (!list?.length) return null;
        return (
          <React.Fragment key={g}>
            <div className="railHead">
              <h2 className="railTitle">
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, var(--accent) 0%, #ff6b9d 100%)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}>
                  🎬 {g}
                </span>
              </h2>
              <div className="railHint" style={{ 
                fontSize: '0.95rem', 
                color: 'var(--textSecondary)',
                fontWeight: '500'
              }}>
                {list.length} {list.length === 1 ? 'title' : 'titles'}
              </div>
            </div>
            <div className="rail">
              {list.slice(0, 20).map(item => <Tile key={item.id} item={item} />)}
            </div>
          </React.Fragment>
        );
      })}

      {/* Filtered results (if a genre is selected) */}
      {selectedGenre && (
        <>
          <div className="railHead">
            <h2 className="railTitle">{selectedGenre}</h2>
            <div className="railHint">{filtered.length} titles</div>
          </div>
          <div className="rail">
            {filtered.length > 0 ? (
              filtered.slice(0, 20).map(item => <Tile key={item.id} item={item} />)
            ) : (
              <div className="notice">
                <i className="bi bi-inbox"></i> No titles found for this genre.
              </div>
            )}
          </div>
        </>
      )}

      <div className="railHead">
        <h2 className="railTitle"><i className="bi bi-film"></i> Movies</h2>
        <div className="railHint">Your cinema collection · {movies.length} titles</div>
      </div>
      <div className="rail">
        {movies.map(m => <Tile key={m.id} item={m} />)}
        {movies.length === 0 && <div className="notice">
          <i className="bi bi-inbox"></i> No movies yet. Head to the <a href="/admin" style={{color: 'var(--accent)', textDecoration: 'underline'}}>Admin Panel</a> to start building your library!
        </div>}
      </div>

      <div className="railHead">
        <h2 className="railTitle"><i className="bi bi-tv"></i> TV Shows</h2>
        <div className="railHint">Binge-worthy series · {shows.length} shows</div>
      </div>
      <div className="rail">
        {shows.map(s => <Tile key={s.id} item={s} />)}
        {shows.length === 0 && <div className="notice">
          <i className="bi bi-tv"></i> No shows yet. Create your first series in the <a href="/admin" style={{color: 'var(--accent)', textDecoration: 'underline'}}>Admin Panel</a>!
        </div>}
      </div>

      <div className="hr" />
      <div className="subtle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="bi bi-info-circle"></i>
        <span><strong>Pro Tip:</strong> For best compatibility, use MP4 format (H.264 + AAC). MKV files may have limited browser support.</span>
      </div>
    </div>
  );
}
