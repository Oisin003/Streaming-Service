// Utility functions for AudiobookReader
export function scrollToWord(index) {
  setTimeout(() => {
    const wordElement = document.getElementById(`word-${index}`);
    if (wordElement) {
      wordElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
}
