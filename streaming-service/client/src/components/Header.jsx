import React from "react";
import { Link, useLocation } from "react-router-dom";
import ProfileMenu from "./ProfileMenu.jsx";

export default function Header({ search, setSearch }) {
  const loc = useLocation();
  const onHome = loc.pathname === "/";

  return (
    <header className="header">
      <div className="headerInner">
        <Link to="/" className="brand">
          <div className="brandMark" />
          <div className="brandName">Achilles<span>+</span></div>
        </Link>

        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/audiobooks">Audiobooks</Link>
          <Link to="/my-audiobooks">My Books</Link>
          <Link to="/watchlist">My List</Link>
          <Link to="/achievements">Achievements</Link>
          <Link to="/admin">Admin</Link>
        </nav>

        <div className="navRight">
          {onHome && (
            <div className="searchWrap">
              <div className="searchIcon">🔎</div>
              <input
                className="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles…"
              />
            </div>
          )}
          <div className="pill">Ultra HD</div>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
