/**
 * storage.js — localStorage persistence for in-progress games.
 */
(function() {
  var PREFIX = "cross-sums:game:";

  function key(puzzleId) {
    return PREFIX + puzzleId;
  }

  function saveGame(puzzleId, gameState) {
    try {
      localStorage.setItem(key(puzzleId), JSON.stringify(gameState));
    } catch (err) {
      console.warn("[storage] saveGame failed:", err);
    }
  }

  function loadGame(puzzleId) {
    try {
      var raw = localStorage.getItem(key(puzzleId));
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn("[storage] loadGame failed:", err);
      return null;
    }
  }

  function clearGame(puzzleId) {
    try {
      localStorage.removeItem(key(puzzleId));
    } catch (err) {
      console.warn("[storage] clearGame failed:", err);
    }
  }

  function hasSavedGame(puzzleId) {
    try {
      return localStorage.getItem(key(puzzleId)) !== null;
    } catch (e) {
      return false;
    }
  }

  // Export to namespace
  CrossSums.saveGame = saveGame;
  CrossSums.loadGame = loadGame;
  CrossSums.clearGame = clearGame;
  CrossSums.hasSavedGame = hasSavedGame;
})();
