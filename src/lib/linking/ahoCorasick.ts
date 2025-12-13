type match<T> = { start: number; end: number; key: string; payload: T };

/**
 * Aho–Corasick automaton for multi-pattern string matching.
 *
 * - Add lowercaseable keys with `add(key, payload)`.
 * - Call `build()` once to construct failure links.
 * - Use `search(text)` to find all occurrences of any added key in `text`.
 *
 * Notes:
 * - Matching is case-insensitive: both keys and text are lowercased.
 * - `payload` lets callers associate arbitrary data with each key
 *   (e.g. node ids), which is returned for each match.
 */
export class AhoCorasick<T> {
    /**
     * Finite-state machine representation:
     * - `next`: transitions by character to next state index.
     * - `fail`: failure link (suffix link) for this state.
     * - `out`: output list of patterns that end at this state.
     *
     * State 0 is the root.
     */
    private fsm: Array<{
        next: Map<string, number>;
        fail: number;
        out: Array<{ key: string; payload: T }>;
    }> = [{ next: new Map(), fail: 0, out: [] }];

    /**
     * Insert a pattern key into the trie, associating it with a payload.
     *
     * - Key is normalized to lowercase.
     * - Does not build failure links; call `build()` after adding all keys.
     */
    add(key: string, payload: T) {
        const word = key.toLowerCase();
        let v = 0;
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            let to = this.fsm[v].next.get(ch);
            if (to === undefined) {
                to = this.fsm.length;
                this.fsm[v].next.set(ch, to);
                this.fsm.push({ next: new Map(), fail: 0, out: [] });
            }
            v = to;
        }
        this.fsm[v].out.push({ key: word, payload });
    }

    /**
     * Build failure links for all states.
     *
     * - Performs a BFS from the root.
     * - For each state, computes its fail link as the longest proper
     *   suffix that is also a prefix in the trie.
     * - Propagates output patterns along failure links so that matches
     *   for suffixes are also reported.
     *
     * Must be called once after all `add` calls and before `search`.
     */
    build() {
        const q: number[] = [];
        for (const [, to] of this.fsm[0].next) {
            this.fsm[to].fail = 0;
            q.push(to);
        }
        while (q.length) {
            const v = q.shift()!;
            for (const [ch, u] of this.fsm[v].next) {
                let f = this.fsm[v].fail;
                while (f && !this.fsm[f].next.has(ch)) f = this.fsm[f].fail;
                const ff = this.fsm[f].next.get(ch) ?? 0;
                this.fsm[u].fail = ff;
                if (this.fsm[ff].out.length) {
                    this.fsm[u].out = this.fsm[u].out.concat(this.fsm[ff].out);
                }
                q.push(u);
            }
        }
    }

    /**
     * Scan `text` for all occurrences of the added keys.
     *
     * - Returns an array of `match` objects:
     *   - `start` / `end`: character offsets into the original text.
     *   - `key`: the matched (lowercased) pattern.
     *   - `payload`: the payload associated with that pattern.
     * - Matching is done on a lowercased copy of `text`, but indices
     *   refer to the original string.
     */
    search(text: string): match<T>[] {
        const s = text.toLowerCase();
        const res: match<T>[] = [];
        let v = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            while (v && !this.fsm[v].next.has(ch)) v = this.fsm[v].fail;
            v = this.fsm[v].next.get(ch) ?? 0;
            if (this.fsm[v].out.length) {
                for (const o of this.fsm[v].out) {
                    const end = i + 1;
                    const start = end - o.key.length;
                    res.push({ start, end, key: o.key, payload: o.payload });
                }
            }
        }
        return res;
    }
}
