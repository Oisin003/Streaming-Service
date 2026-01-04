import React, { useMemo, useRef, useState } from "react";
import { clearAuth, getAuth } from "../api.js";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext.jsx";

export default function ProfileMenu() {
  const nav = useNavigate();
  const adminAuth = getAuth();
  const { user, logout: userLogout } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const label = useMemo(() => {
    if (user) return user.username;
    if (adminAuth) return adminAuth.username === "admin" ? "Admin" : adminAuth.username;
    return "Guest";
  }, [adminAuth, user]);

  const isLoggedIn = user || adminAuth;

  React.useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function logout() {
    if (user) userLogout();
    if (adminAuth) clearAuth();
    setOpen(false);
    nav("/");
  }

  function goToLogin() {
    setOpen(false);
    nav("/login");
  }

  function goToRegister() {
    setOpen(false);
    nav("/register");
  }

  function goToWatchlist() {
    setOpen(false);
    nav("/watchlist");
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btnSecondary btnSmall" onClick={() => setOpen(o => !o)}>
        <i className="bi bi-person-circle me-2"></i>
        {label} 
        <i className="bi bi-chevron-down ms-1"></i>
      </button>

      {open && (
        <div className="profileMenuDropdown">
          <div className="profileMenuHeader">
            <i className="bi bi-person-circle me-2"></i>
            {label}
          </div>

          {!isLoggedIn && (
            <>
              <button className="menuItem" onClick={goToLogin}>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Sign In
              </button>
              <button className="menuItem" onClick={goToRegister}>
                <i className="bi bi-person-plus me-2"></i>
                Create Account
              </button>
            </>
          )}

          {user && (
            <>
              <button className="menuItem" onClick={goToWatchlist}>
                <i className="bi bi-bookmark-heart me-2"></i>
                My Watchlist
              </button>
              <button className="menuItem" onClick={() => { setOpen(false); nav(`/profile/${user.id}`); }}>
                <i className="bi bi-person-gear me-2"></i>
                Profile Settings
              </button>
            </>
          )}

          {isLoggedIn && (
            <button className="menuItem menuItemDanger" onClick={logout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Sign Out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
