import React, { useEffect, useRef } from "react";
import { getProgress, setProgress } from "../watch.js";

export default function VideoPlayer({ src, progressKey }) {
  const ref = useRef(null);

  // Force reload when src changes
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.load(); // Reload the video element
  }, [src]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !progressKey) return;

    const p = getProgress(progressKey);
    if (p?.seconds && p.seconds > 5) {
      // try to resume
      const onLoaded = () => {
        try { v.currentTime = Math.min(p.seconds, (v.duration || p.duration || p.seconds)); } catch {}
      };
      v.addEventListener("loadedmetadata", onLoaded, { once: true });
      return () => v.removeEventListener("loadedmetadata", onLoaded);
    }
  }, [progressKey]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !progressKey) return;

    const onTime = () => {
      setProgress(progressKey, v.currentTime || 0, v.duration || 0);
    };
    const onPause = () => onTime();
    const onEnded = () => setProgress(progressKey, 0, v.duration || 0); // reset on finish

    const interval = setInterval(onTime, 2500);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);

    return () => {
      clearInterval(interval);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
    };
  }, [progressKey]);

  return (
    <div className="videoWrap">
      <video ref={ref} controls className="video">
        <source src={src} />
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
}
