// TTS (Text-to-Speech) logic for AudiobookReader
export function startReading({
  synthRef, utteranceRef, words, fromIndex, rate, selectedVoice, setCurrentWordIndex, setIsPlaying, isPlayingRef, pendingRestartRef, sessionStart, setSessionStart, user, id, saveProgress, setErr, currentWordIndex, currentPage, setCurrentPage, WORDS_PER_PAGE }) {
  console.log('[TTS] startReading called', { fromIndex, isPlaying: isPlayingRef.current });
  if (!synthRef.current || words.length === 0) {
    console.warn('[TTS] synthRef.current missing or no words');
    return;
  }
  if (isPlayingRef.current) {
    console.warn('[TTS] Already playing, aborting startReading');
    return;
  }
  setErr("");
  try {
    console.log('[TTS] Calling synth.cancel() before speak');
    synthRef.current.cancel();
  } catch (e) {
    console.warn("[TTS] SpeechSynthesis cancel failed", e);
  }
  setCurrentWordIndex(fromIndex);
  setIsPlaying(true);
  isPlayingRef.current = true;
  pendingRestartRef.current = null;
  if (!sessionStart) setSessionStart(Date.now());
  const CHUNK_SIZE = 40;
  const endIndex = Math.min(fromIndex + CHUNK_SIZE, words.length);
  const textToRead = words.slice(fromIndex, endIndex).join(" ");
  const utterance = new window.SpeechSynthesisUtterance(textToRead);
  utterance.rate = rate;
  utterance.lang = 'en-US';
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      const charIndex = event.charIndex;
      const currentText = textToRead.substring(0, charIndex);
      const wordsRead = currentText.split(/\s+/).length - 1;
      const newIndex = fromIndex + wordsRead;
      if (newIndex < words.length && newIndex !== currentWordIndex) {
        setCurrentWordIndex(newIndex);
        const wordPage = Math.floor(newIndex / WORDS_PER_PAGE);
        if (wordPage !== currentPage) setCurrentPage(wordPage);
        if (user && newIndex % 50 === 0) saveProgress(newIndex);
      }
    }
  };
  utterance.onend = () => {
    console.log('[TTS] onend fired', { pendingRestart: pendingRestartRef.current, isPlaying: isPlayingRef.current });
    if (pendingRestartRef.current !== null) {
      const idx = pendingRestartRef.current;
      pendingRestartRef.current = null;
      setTimeout(() => startReading({
        synthRef, utteranceRef, words, fromIndex: idx, rate, selectedVoice, setCurrentWordIndex, setIsPlaying, isPlayingRef, pendingRestartRef, sessionStart, setSessionStart, user, id, saveProgress, setErr, currentWordIndex, currentPage, setCurrentPage, WORDS_PER_PAGE }), 100);
      return;
    }
    if (endIndex < words.length && isPlayingRef.current) {
      setTimeout(() => {
        if (isPlayingRef.current) {
          startReading({
            synthRef, utteranceRef, words, fromIndex: endIndex, rate, selectedVoice, setCurrentWordIndex, setIsPlaying, isPlayingRef, pendingRestartRef, sessionStart, setSessionStart, user, id, saveProgress, setErr, currentWordIndex, currentPage, setCurrentPage, WORDS_PER_PAGE });
        }
      }, 100);
    } else {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (user) saveProgress(currentWordIndex);
    }
  };
  utterance.onerror = (event) => {
    console.error("[TTS] Speech synthesis error:", event, "error:", event.error, "utterance:", utterance.text);
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      setErr(`Speech error: ${event.error || 'unknown'}. Try restarting playback. (See console for details)`);
    } else {
      setErr("");
    }
  };
  utteranceRef.current = utterance;
  try {
    console.log('[TTS] Calling synth.speak()');
    synthRef.current.speak(utterance);
    console.log("[TTS] Speech synthesis started", utterance.text);
  } catch (error) {
    console.error("[TTS] Failed to start speech:", error);
    isPlayingRef.current = false;
    setIsPlaying(false);
    setErr("Failed to start text-to-speech. Please try again.");
  }
}
