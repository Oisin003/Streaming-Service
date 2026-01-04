// Skip forward/backward logic for AudiobookReader
export function skipForward({ currentWordIndex, words, setCurrentWordIndex, setCurrentPage, WORDS_PER_PAGE, isPlayingRef, pendingRestartRef, synthRef }) {
  const newIndex = Math.min(currentWordIndex + 50, words.length - 1);
  const newPage = Math.floor(newIndex / WORDS_PER_PAGE);
  setCurrentPage(newPage);
  setCurrentWordIndex(newIndex);
  if (isPlayingRef.current) {
    console.log('[TTS] skipForward: setting pendingRestartRef and calling synth.cancel()', { newIndex });
    pendingRestartRef.current = newIndex;
    try {
      synthRef.current.cancel();
    } catch (e) {
      console.warn('[TTS] skipForward: synth.cancel() failed', e);
    }
  }
}

export function skipBackward({ currentWordIndex, setCurrentWordIndex, setCurrentPage, WORDS_PER_PAGE, isPlayingRef, pendingRestartRef, synthRef }) {
  const newIndex = Math.max(currentWordIndex - 50, 0);
  const newPage = Math.floor(newIndex / WORDS_PER_PAGE);
  setCurrentPage(newPage);
  setCurrentWordIndex(newIndex);
  if (isPlayingRef.current) {
    console.log('[TTS] skipBackward: setting pendingRestartRef and calling synth.cancel()', { newIndex });
    pendingRestartRef.current = newIndex;
    try {
      synthRef.current.cancel();
    } catch (e) {
      console.warn('[TTS] skipBackward: synth.cancel() failed', e);
    }
  }
}
