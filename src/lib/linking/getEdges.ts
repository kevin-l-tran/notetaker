import type { NodeId } from "../../models/nodes";

/**
 * A logical link between two nodes induced by a `\nodelink` macro.
 *
 * The semantics are:
 *   - `key`:  the normalized term used in `\nodelink{key}{...}`
 *   - `from`: the node whose title/alias matches `key`
 *   - `to`:   the node that the description belongs to
 */
type match = {
    key: string;
    from: NodeId;
    to: NodeId;
};

// \nodelink{<term>}{<visible text>}
const NODELINK_RE = /\\nodelink\{([^}]*)\}\{([^}]*)\}/g;

/**
 * Extract logical edges implied by `\nodelink` macros in a node's description.
 *
 * Rules:
 * - `id` is the "to" node (the one whose description is being scanned).
 * - For each macro, resolve its key via `terms` to a "from" node id.
 * - Skip macros whose key does not resolve to a node.
 * - Skip self-links (`from === to`).
 * - Emit at most one edge per distinct `from` node (deduplicated by id).
 */
export default function getEdges(
    id: NodeId,
    text: string,
    terms: Map<string, NodeId>
): match[] {
    const matches: match[] = [];
    const ids: Set<NodeId> = new Set();

    for (const m of text.matchAll(NODELINK_RE)) {
        const rawKey = m[1];
        const key = rawKey.trim().toLowerCase();
        const fromId = terms.get(key);

        if (!fromId) continue;
        if (fromId === id) continue;
        if (ids.has(fromId)) continue;

        ids.add(fromId);
        matches.push({
            key,
            from: fromId,
            to: id,
        });
    }

    return matches;
}
