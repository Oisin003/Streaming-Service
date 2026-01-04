import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div>
          <div className="footerTitle">Achilles+ <i className="bi bi-play-circle-fill" style={{ color: 'var(--accent)' }}></i></div>
          <div className="footerSmall">
            The ultimate self-hosted streaming platform. Build your personal Netflix, 
            no monthly fees, no content limits, complete privacy.
          </div>
          <div className="footerSmall" style={{ marginTop: 8 }}>
            © {new Date().getFullYear()} Achilles · Made with ❤️ for streamers
          </div>
        </div>

        <div className="footerCols">
          <div>
            <div className="footerTitle"><i className="bi bi-collection-play"></i> Discover</div>
            <div><a href="/">Browse Library</a></div>
            <div><a href="/admin">Content Manager</a></div>
            <div className="footerSmall">Explore unlimited entertainment</div>
          </div>
          <div>
            <div className="footerTitle"><i className="bi bi-lightning-charge"></i> Features</div>
            <div className="footerSmall">Instant Resume</div>
            <div className="footerSmall">Multi-Season Shows</div>
            <div className="footerSmall">HD Streaming</div>
          </div>
          <div>
            <div className="footerTitle"><i className="bi bi-code-slash"></i> Tech Stack</div>
            <div className="footerSmall">React + Node.js + Express</div>
            <div className="footerSmall">SQLite Database</div>
            <div className="footerSmall">Advanced Streaming</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
