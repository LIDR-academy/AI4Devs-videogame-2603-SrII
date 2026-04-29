export class RankingService {
    constructor(storage) {
        this.storage = storage;
        this.STORAGE_KEY = 'threes_ranking';
        this.scores = this.storage.load(this.STORAGE_KEY) || [];
    }

    getTopScores() {
        return this.scores;
    }

    isTopScore(score) {
        if (score <= 0) return false;
        if (this.scores.length < 10) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    addScore(name, score) {
        const date = new Date();
        const formattedDate = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
        const entry = {
            name: name.substring(0, 5).toUpperCase(),
            score: score,
            date: formattedDate,
            timestamp: date.getTime()
        };

        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10);
        
        this.storage.save(this.STORAGE_KEY, this.scores);
    }
}
