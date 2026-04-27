/**
 * input.js — Cell selection plus keyboard and on-screen numpad input.
 */
(function() {
  var getRun = CrossSums.getRun;

  var state = {
    grid: null,
    container: null,
    numpad: null,
    selected: null,
    handlers: null,
    listenersBound: false,
  };

  var inputEnabled = true;

  function setInputEnabled(enabled) {
    inputEnabled = enabled;
    if (!enabled) deselect();
    syncNumpadDisabled();
  }

  function initInput(grid, container, handlers) {
    state.grid = grid;
    state.container = container;
    state.handlers = handlers;
    state.selected = null;

    if (!state.numpad) {
      state.numpad = buildNumpad(container);
    }

    if (!state.listenersBound) {
      container.addEventListener("click", handleGridClick);
      document.addEventListener("click", handleDocumentClick);
      document.addEventListener("keydown", handleKeydown);
      state.listenersBound = true;
    }

    inputEnabled = true;
    clearAllHighlights();
    syncNumpadDisabled();
  }

  function select(row, col) {
    state.selected = { row: row, col: col };
    applyHighlights(row, col);
    syncNumpadDisabled();
  }

  function deselect() {
    if (!state.selected) return;
    state.selected = null;
    clearAllHighlights();
    syncNumpadDisabled();
  }

  function isSelected(row, col) {
    return (
      state.selected &&
      state.selected.row === row &&
      state.selected.col === col
    );
  }

  function handleGridClick(e) {
    if (!inputEnabled) return;
    var cellEl = e.target.closest(".cell");
    if (!cellEl || !state.container.contains(cellEl)) return;
    var row = Number(cellEl.dataset.row);
    var col = Number(cellEl.dataset.col);
    var cell = state.grid[row][col];
    if (cell.type !== "blank") {
      deselect();
      return;
    }
    if (isSelected(row, col)) {
      deselect();
    } else {
      select(row, col);
    }
  }

  function handleDocumentClick(e) {
    if (!inputEnabled) return;
    if (state.container && state.container.contains(e.target)) return;
    if (state.numpad && state.numpad.contains(e.target)) return;
    if (e.target.closest && e.target.closest("#toolbar")) return;
    deselect();
  }

  function handleKeydown(e) {
    if (!inputEnabled) return;
    var ae = document.activeElement;
    if (
      ae &&
      (ae.tagName === "INPUT" ||
        ae.tagName === "TEXTAREA" ||
        ae.tagName === "SELECT" ||
        ae.isContentEditable)
    ) {
      return;
    }

    if (e.key === "Escape") {
      if (state.selected) {
        deselect();
        e.preventDefault();
      }
      return;
    }

    if (e.key === "Tab") {
      tabSelection(e.shiftKey ? -1 : 1);
      e.preventDefault();
      return;
    }

    if (!state.selected) return;

    switch (e.key) {
      case "ArrowUp":
        moveSelection(-1, 0);
        e.preventDefault();
        return;
      case "ArrowDown":
        moveSelection(1, 0);
        e.preventDefault();
        return;
      case "ArrowLeft":
        moveSelection(0, -1);
        e.preventDefault();
        return;
      case "ArrowRight":
        moveSelection(0, 1);
        e.preventDefault();
        return;
      case "Backspace":
      case "Delete":
        fireClear();
        e.preventDefault();
        return;
    }

    if (/^[1-9]$/.test(e.key)) {
      fireDigit(Number(e.key));
      e.preventDefault();
    }
  }

  function fireDigit(digit) {
    if (!state.selected || !state.handlers || !state.handlers.onDigit) return;
    state.handlers.onDigit(state.selected.row, state.selected.col, digit);
  }

  function fireClear() {
    if (!state.selected || !state.handlers || !state.handlers.onClear) return;
    state.handlers.onClear(state.selected.row, state.selected.col);
  }

  function moveSelection(dr, dc) {
    if (!state.selected) return;
    var row = state.selected.row;
    var col = state.selected.col;
    var rows = state.grid.length;
    var cols = state.grid[0].length;
    var maxSteps = rows * cols;
    for (var step = 0; step < maxSteps; step++) {
      row = ((row + dr) % rows + rows) % rows;
      col = ((col + dc) % cols + cols) % cols;
      if (state.grid[row][col].type === "blank") {
        select(row, col);
        return;
      }
    }
  }

  function tabSelection(direction) {
    var rows = state.grid.length;
    var cols = state.grid[0].length;
    var total = rows * cols;
    var startIdx;
    if (state.selected) {
      startIdx = state.selected.row * cols + state.selected.col;
    } else {
      startIdx = direction === 1 ? -1 : total;
    }
    for (var step = 1; step <= total; step++) {
      var idx = ((startIdx + direction * step) % total + total) % total;
      var r = Math.floor(idx / cols);
      var c = idx % cols;
      if (state.grid[r][c].type === "blank") {
        select(r, c);
        return;
      }
    }
  }

  function clearAllHighlights() {
    if (!state.container) return;
    var highlighted = state.container.querySelectorAll(".cell.selected, .cell.highlight-across, .cell.highlight-down");
    for (var i = 0; i < highlighted.length; i++) {
      var el = highlighted[i];
      el.style.removeProperty("--highlight-delay");
      el.classList.remove("selected", "highlight-across", "highlight-down");
    }
  }

  function applyHighlights(row, col) {
    clearAllHighlights();
    var sel = cellEl(row, col);
    if (sel) sel.classList.add("selected");

    var acrossRun = getRun(state.grid, row, col, "across");
    for (var i = 0; i < acrossRun.length; i++) {
      var coord = acrossRun[i];
      if (coord.row === row && coord.col === col) continue;
      var el = cellEl(coord.row, coord.col);
      if (!el) continue;
      el.style.setProperty("--highlight-delay", (Math.abs(coord.col - col) * 20) + "ms");
      el.classList.add("highlight-across");
    }
    var downRun = getRun(state.grid, row, col, "down");
    for (var j = 0; j < downRun.length; j++) {
      var dcoord = downRun[j];
      if (dcoord.row === row && dcoord.col === col) continue;
      var del = cellEl(dcoord.row, dcoord.col);
      if (!del) continue;
      del.style.setProperty("--highlight-delay", (Math.abs(dcoord.row - row) * 20) + "ms");
      del.classList.add("highlight-down");
    }
  }

  function cellEl(row, col) {
    return state.container.querySelector('.cell[data-row="' + row + '"][data-col="' + col + '"]');
  }

  function buildNumpad(gridContainer) {
    var host = document.getElementById("numpad-container");
    if (!host) {
      host = document.createElement("div");
      host.id = "numpad-container";
      gridContainer.parentNode.insertBefore(host, gridContainer.nextSibling);
    }
    host.innerHTML = "";
    host.classList.add("numpad");

    for (var i = 1; i <= 9; i++) {
      var btn = makeNumpadButton(String(i), (function(digit) {
        return function() { onNumpadDigit(digit); };
      })(i));
      btn.setAttribute("aria-label", "Enter " + i);
      host.appendChild(btn);
    }
    var clear = makeNumpadButton("X", onNumpadClear);
    clear.classList.add("numpad-clear");
    clear.setAttribute("aria-label", "Clear cell");
    host.appendChild(clear);

    return host;
  }

  function makeNumpadButton(label, handler) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("numpad-btn");
    btn.textContent = label;
    btn.dataset.digit = label;
    btn.addEventListener("click", function() {
      triggerRipple(btn);
      handler();
    });
    return btn;
  }

  function triggerRipple(el) {
    el.classList.remove("ripple-on");
    void el.offsetWidth;
    el.classList.add("ripple-on");
  }

  function onNumpadDigit(digit) {
    if (!inputEnabled || !state.selected) return;
    fireDigit(digit);
  }

  function onNumpadClear() {
    if (!inputEnabled || !state.selected) return;
    fireClear();
  }

  function syncNumpadDisabled() {
    if (!state.numpad) return;
    var disabled = !inputEnabled || state.selected === null;
    if (disabled) {
      state.numpad.classList.add("disabled");
    } else {
      state.numpad.classList.remove("disabled");
    }
    var buttons = state.numpad.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = disabled;
    }
  }

  // Export to namespace
  CrossSums.initInput = initInput;
  CrossSums.setInputEnabled = setInputEnabled;
})();
