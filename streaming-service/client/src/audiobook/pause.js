// Pause TTS logic for AudiobookReader
export function pauseReading({ synthRef, isPlayingRef, setIsPlaying, user, currentWordIndex, saveProgress }) {
  if (synthRef.current) {
    console.log('[TTS] pauseReading called');
    isPlayingRef.current = false;
    setIsPlaying(false);
    try {
      console.log('[TTS] pauseReading: calling synth.cancel()');
      synthRef.current.cancel();
    } catch (e) {
      console.warn('[TTS] pauseReading: synth.cancel() failed', e);
    }
    if (user) saveProgress(currentWordIndex);
  }
}
