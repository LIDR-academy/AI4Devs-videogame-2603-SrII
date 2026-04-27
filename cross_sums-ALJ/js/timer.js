/**
 * timer.js — Game timer with tab-visibility auto pause/resume.
 */
(function() {
  function formatTime(ms) {
    var totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function Timer(options) {
    options = options || {};
    this.display = options.display || null;
    this.tickMs = options.tickMs || 500;
    this.elapsed = 0;
    this.runningSince = null;
    this.intervalId = null;
    this._wasRunningBeforeHide = false;
    this._visListener = null;
    this._bindVisibility();
  }

  Timer.prototype.start = function() {
    this.elapsed = 0;
    this.runningSince = null;
    this.resume();
  };

  Timer.prototype.resume = function() {
    if (this.runningSince !== null) return;
    this.runningSince = Date.now();
    var self = this;
    if (!this.intervalId) {
      this.intervalId = setInterval(function() { self._render(); }, this.tickMs);
    }
    this._render();
  };

  Timer.prototype.pause = function() {
    if (this.runningSince === null) return;
    this.elapsed += Date.now() - this.runningSince;
    this.runningSince = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._render();
  };

  Timer.prototype.reset = function() {
    this.pause();
    this.elapsed = 0;
    this._render();
  };

  Timer.prototype.getElapsed = function() {
    if (this.runningSince === null) return this.elapsed;
    return this.elapsed + (Date.now() - this.runningSince);
  };

  Timer.prototype.setElapsed = function(ms) {
    this.pause();
    this.elapsed = Math.max(0, ms | 0);
    this._render();
  };

  Timer.prototype.dispose = function() {
    this.pause();
    if (this._visListener) {
      document.removeEventListener("visibilitychange", this._visListener);
      this._visListener = null;
    }
  };

  Timer.prototype._render = function() {
    if (this.display) this.display.textContent = formatTime(this.getElapsed());
  };

  Timer.prototype._bindVisibility = function() {
    if (this._visListener) return;
    var self = this;
    this._visListener = function() {
      if (document.hidden) {
        self._wasRunningBeforeHide = self.runningSince !== null;
        if (self._wasRunningBeforeHide) self.pause();
      } else if (self._wasRunningBeforeHide) {
        self.resume();
      }
    };
    document.addEventListener("visibilitychange", this._visListener);
  };

  // Export to namespace
  CrossSums.Timer = Timer;
  CrossSums.formatTime = formatTime;
})();
