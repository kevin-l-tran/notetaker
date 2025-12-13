type match<T> = { start: number; end: number; key: string; payload: T };

/**
 * Pick a set of non-overlapping matches from a list of (possibly) overlapping ones.
 *
 * Strategy:
 * - Sort by increasing `start`.
 * - For equal `start`, prefer the longest match (largest `end - start`).
 * - Greedily accept a match if it does not overlap the previously accepted one.
 *
 * This is used to resolve conflicting term matches so that the final set
 * of links does not overlap in the source text.
 */
export function pickNonOverlapping<T>(matches: match<T>[]) {
    matches.sort(
        (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
    );
    const picked: match<T>[] = [];
    let lastEnd = -1;
    for (const m of matches) {
        if (m.start >= lastEnd) {
            picked.push(m);
            lastEnd = m.end;
        }
    }
    return picked;
}

/**
 * Check that a match is delimited by non-word characters on both sides.
 *
 * - `start` / `end` are the match bounds in `text`.
 * - A "word character" is `[a-z0-9{}]` (case-insensitive), so matches
 *   are considered valid only when they are not embedded inside a larger
 *   alphanumeric/brace token.
 *
 * Example: for term "space"
 * - "space is nice"   → true  (spaces around)
 * - "spacetime"       → false (embedded in a larger word)
 */
export function hasWordBoundaries(text: string, start: number, end: number) {
    const isWordChar = (ch: string) => {
        return /^[a-z0-9{}]+$/i.test(ch);
    };
    const leftOk = start === 0 || !isWordChar(text[start - 1]);
    const rightOk = end === text.length || !isWordChar(text[end]);
    return leftOk && rightOk;
}
