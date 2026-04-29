export class TileMergePolicy {
    static canMerge(val1, val2) {
        if (val1 === 0 || val2 === 0) return false;
        
        // Rule 1: 1 + 2 = 3
        if ((val1 === 1 && val2 === 2) || (val1 === 2 && val2 === 1)) {
            return true;
        }
        
        // Rule 2: n + n = 2n (for n >= 3)
        if (val1 >= 3 && val1 === val2) {
            return true;
        }
        
        return false;
    }

    static merge(val1, val2) {
        return val1 + val2;
    }
}
