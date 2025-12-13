import { useMemo } from "react";

import type { DefinitionNode } from "../models/definitionNodes";
import type { NodeId } from "../models/nodes";

import getEdges from "../lib/linking/getEdges";
import { getDefinitionTerms } from "../lib/linking/getTerms";

/**
 * Derive a graph representation (nodes + edges) from definition nodes.
 *
 * - Nodes are `{ id, label }` pairs suitable for Cytoscape.
 * - Edges are inferred from `\nodelink{...}{...}` macros in descriptions.
 * - Uses `useMemo` so recomputation only happens when `definitionNodes` change.
 */
export default function useDefinitionGraph(
    definitionNodes: Record<NodeId, DefinitionNode>
) {
    const termMap = useMemo(
        () => getDefinitionTerms(definitionNodes),
        [definitionNodes]
    );

    const definitionGraphNodes = useMemo(
        () =>
            Object.values(definitionNodes).map((n) => ({
                id: n.id,
                label: n.label,
            })),
        [definitionNodes]
    );

    const definitionGraphEdges = useMemo(() => {
        const edges: { id: string; source: string; target: string }[] = [];
        for (const node of Object.values(definitionNodes)) {
            const refs = getEdges(node.id, node.description, termMap);
            for (const ref of refs) {
                const id = `${ref.from}->${ref.to}`;
                edges.push({ id, source: ref.from, target: ref.to });
            }
        }
        return edges;
    }, [definitionNodes, termMap]);

    return { definitionGraphNodes, definitionGraphEdges };
}
