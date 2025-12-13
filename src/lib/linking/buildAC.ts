import type { NodeId } from "../../models/nodes";

import { AhoCorasick } from "./ahoCorasick";

/**
 * Build an Aho–Corasick automaton from a term → node id map.
 *
 * - Normalizes terms by trimming and lowercasing.
 * - Skips empty terms after normalization.
 * - Calls `build()` once after all terms are added.
 *
 * The resulting automaton can be reused to search many texts
 * for occurrences of the given terms.
 */
export default function buildAC(
    map: Map<string, NodeId>
): AhoCorasick<NodeId> {
    const ac = new AhoCorasick<NodeId>();

    for (const [term, id] of map.entries()) {
        const key = term.trim().toLowerCase();
        if (!key) continue;
        ac.add(key, id);
    }

    ac.build();
    return ac;
}
