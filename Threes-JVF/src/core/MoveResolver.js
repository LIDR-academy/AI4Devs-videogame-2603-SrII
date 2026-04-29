import { TileMergePolicy } from './TileMergePolicy.js';

export class MoveResolver {
    static resolve(board, direction) {
        const size = board.size;
        const newBoard = board.clone();
        let moved = false;
        let scoreGain = 0;

        // mergedFlags tracks if a tile has already merged in this move
        const mergedFlags = Array(size).fill(null).map(() => Array(size).fill(false));

        const vectors = {
            'up': { dr: -1, dc: 0 },
            'down': { dr: 1, dc: 0 },
            'left': { dr: 0, dc: -1 },
            'right': { dr: 0, dc: 1 }
        };

        const { dr, dc } = vectors[direction];

        // Determine traversal order to avoid multiple merges in one move
        const rows = dr === 1 ? [...Array(size).keys()].reverse() : [...Array(size).keys()];
        const cols = dc === 1 ? [...Array(size).keys()].reverse() : [...Array(size).keys()];

        for (const r of rows) {
            for (const c of cols) {
                const currentVal = newBoard.getTile(r, c);
                if (currentVal === 0) continue;

                let currR = r;
                let currC = c;
                
                // Threes logic: tiles move only ONE step if possible, 
                // but we'll implement it so they slide until they hit something or merge
                // Actually, in Threes! they move all together one step.
                // Let's stick to the "move all in direction" rule.
                
                const nextR = currR + dr;
                const nextC = currC + dc;

                if (nextR >= 0 && nextR < size && nextC >= 0 && nextC < size) {
                    const nextVal = newBoard.getTile(nextR, nextC);
                    
                    if (nextVal === 0) {
                        newBoard.setTile(nextR, nextC, currentVal);
                        newBoard.setTile(currR, currC, 0);
                        moved = true;
                    } else if (!mergedFlags[nextR][nextC] && TileMergePolicy.canMerge(currentVal, nextVal)) {
                        const newVal = TileMergePolicy.merge(currentVal, nextVal);
                        newBoard.setTile(nextR, nextC, newVal);
                        newBoard.setTile(currR, currC, 0);
                        mergedFlags[nextR][nextC] = true;
                        scoreGain += newVal;
                        moved = true;
                    }
                }
            }
        }

        return { board: newBoard, moved, scoreGain };
    }
}
