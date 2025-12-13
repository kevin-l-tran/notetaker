import type { NodeId } from "../../models/nodes";

const NODELINK_RE = /\\nodelink\{([^}]*)\}\{([^}]*)\}/g;

/**
 * Clean up `\nodelink` macros in `text` based on the current term map
 * and returns the updated `text`.
 *
 * Behavior:
 * - If the link's key still resolves to a node id via `terms`,
 *   the macro is preserved unchanged.
 * - If the key no longer resolves (e.g. node deleted or renamed),
 *   the macro is removed and only the visible text is kept.
 *
 * This keeps descriptions readable while stripping out stale links.
 */
export default function cleanLinks(text: string, terms: Map<string, NodeId>) {
    return text.replace(NODELINK_RE, (match, rawKey: string, visible: string) => {
        const key = rawKey.trim().toLowerCase();
        const targetId = terms.get(key);

        if (!targetId) {
            return visible;
        }

        return match;
    });
}
