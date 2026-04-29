import { GameEngine } from './core/GameEngine.js';
import { UIRenderer } from './ui/UIRenderer.js';
import { KeyboardInput } from './ui/KeyboardInput.js';
import { RankingService } from './services/RankingService.js';
import { LocalStorageAdapter } from './services/LocalStorageAdapter.js';

document.addEventListener('DOMContentLoaded', () => {
    const sizeSelector = document.getElementById('size-selector');
    const resetBtn = document.getElementById('reset-btn');
    const rankingBtn = document.getElementById('ranking-btn');
    
    const storage = new LocalStorageAdapter();
    const rankingService = new RankingService(storage);
    const ui = new UIRenderer();
    
    let engine;

    const initGame = (size) => {
        if (engine) engine.stop();
        engine = new GameEngine(parseInt(size), ui, rankingService);
        const input = new KeyboardInput(engine);
        engine.start();
    };

    sizeSelector.addEventListener('change', (e) => initGame(e.target.value));
    resetBtn.addEventListener('click', () => initGame(sizeSelector.value));
    
    rankingBtn.addEventListener('click', () => {
        const topScores = rankingService.getTopScores();
        ui.showRanking(topScores);
    });

    window.addEventListener('save-score', (e) => {
        if (engine) engine.saveScore(e.detail.name);
    });

    // Start default 4x4
    initGame(4);
});
