import type { DefinitionNode } from "../../models/definitionNodes";
import type { NodeId } from "../../models/nodes";

/**
 * Build a term → node id index from a list of definition nodes. 
 * Accepts an optional `excludeId` to exclude from the index (useful 
 * when auto-linking a single node to avoid self-links).
 *
 * Behavior:
 * - Uses each node's label and aliases as "terms".
 * - Trims and lowercases all terms for normalization.
 * - Skips empty terms after trimming.
 */
export function getDefinitionTerms(
    definitionNodes: Record<string, DefinitionNode>,
    excludeId?: NodeId
): Map<string, NodeId> {
    const terms: Map<string, NodeId> = new Map();

    for (const node of Object.values(definitionNodes)) {
        if (excludeId && node.id === excludeId) continue;

        const id = node.id;

        const titleKey = node.label.trim().toLowerCase();
        if (titleKey) {
            terms.set(titleKey, id);
        }

        for (const alias of node.aliases) {
            const key = alias.trim().toLowerCase();
            if (!key) continue;
            terms.set(key, id);
        }
    }

    return terms;
}
