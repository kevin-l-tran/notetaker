import { useState, useMemo, useCallback } from "react";

import type { NodeId } from "../models/nodes";
import type {
    DefinitionDraft,
    DefinitionNode,
} from "../models/definitionNodes";

import autoInsertLinks from "../lib/linking/autoInsertLinks";
import buildAC from "../lib/linking/buildAC";
import cleanLinks from "../lib/linking/cleanLinks";
import { getDefinitionTerms } from "../lib/linking/getTerms";

type TermsMap = Map<string, NodeId>;
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type AddOrEditMode = { kind: "create" } | { kind: "edit"; id: NodeId };
export type ChangeNodeError =
    | { type: "duplicate term"; term: string }
    | { type: "label taken"; label: string }
    | { type: "aliases taken"; aliases: string[] }
    | { type: "not found"; id: string };

const generateId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `n_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
};

function validateNodeInput(
    input: DefinitionDraft,
    mode: AddOrEditMode,
    definitionNodes: Map<NodeId, DefinitionNode>
): Result<DefinitionDraft, ChangeNodeError> {
    const normalizedTitle = input.label.trim().toLowerCase();
    const normalizedAliases = input.aliases.map((a) => a.trim().toLowerCase());

    const selfTerms = new Set<string>();
    for (const term of [normalizedTitle, ...normalizedAliases]) {
        if (!selfTerms.has(term)) {
            selfTerms.add(term);
        } else {
            return {
                ok: false,
                error: { type: "duplicate term", term: term },
            };
        }
    }

    const otherNodes = Array.from(definitionNodes.values()).filter((n) =>
        mode.kind === "edit" ? n.id !== mode.id : true
    );

    const existingTerms = new Set<string>();
    for (const node of otherNodes) {
        existingTerms.add(node.label.trim().toLowerCase());
        for (const alias of node.aliases) {
            existingTerms.add(alias.trim().toLowerCase());
        }
    }

    const labelTaken = existingTerms.has(normalizedTitle);
    const aliasesTaken = normalizedAliases.filter((a) => existingTerms.has(a));

    if (labelTaken) {
        return {
            ok: false,
            error: { type: "label taken", label: normalizedTitle },
        };
    }
    if (aliasesTaken.length > 0) {
        return {
            ok: false,
            error: { type: "aliases taken", aliases: aliasesTaken },
        };
    }

    return {
        ok: true,
        value: {
            label: input.label.trim(),
            aliases: input.aliases.map((a) => a.trim()),
            description: input.description,
        },
    };
}

function cleanupNodelinks(
    definitionNodes: Map<NodeId, DefinitionNode>,
    terms: TermsMap
): Map<NodeId, DefinitionNode> {
    const cleaned = new Map<NodeId, DefinitionNode>(definitionNodes);

    for (const [id, node] of definitionNodes) {
        const newDescription = cleanLinks(node.description, terms);
        if (newDescription !== node.description) {
            cleaned.set(id, { ...node, description: newDescription });
        }
    }

    return cleaned;
}

function insertLinksIntoNode(
    node: DefinitionNode,
    allNodes: Map<NodeId, DefinitionNode>
): DefinitionNode {
    const terms = getDefinitionTerms(allNodes, node.id);
    if (terms.size === 0) return node;

    const ac = buildAC(terms);
    const newDescription = autoInsertLinks(
        node.id,
        node.description,
        terms,
        ac
    );

    if (newDescription === node.description) return node;

    return {
        ...node,
        description: newDescription,
    };
}

function insertLinksFromNode(
    node: DefinitionNode,
    definitionNodes: Map<NodeId, DefinitionNode>
): Map<NodeId, DefinitionNode> {
    const terms: TermsMap = new Map();
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

    if (terms.size === 0) {
        return definitionNodes;
    }

    const ac = buildAC(terms);
    const updated = new Map<NodeId, DefinitionNode>(definitionNodes);

    for (const [nodeId, n] of definitionNodes) {
        const newDescription = autoInsertLinks(n.id, n.description, terms, ac);
        if (newDescription !== n.description) {
            updated.set(nodeId, { ...n, description: newDescription });
        }
    }

    return updated;
}

/**
 * Store hook for definition nodes.
 *
 * Responsibilities:
 * - Hold all definition nodes in React state.
 * - Enforce label/alias uniqueness on add/edit.
 * - Maintain `\nodelink` macros in descriptions after changes:
 *   - Insert links into the edited node.
 *   - Propagate links from the edited node into other nodes.
 *   - Clean up links when a node is edited or deleted.
 *
 * Exposes:
 * - `definitionNodes`: canonical node map.
 * - `termMap`: normalized term → node id index, derived from `definitionNodes`.
 * - `loadDefinitionNodes`: bulk load from persisted data.
 * - `addNode`, `editNode`, `deleteNode`: mutations with structured errors.
 */
export default function useDefinitionStore() {
    const [definitionNodes, setDefinitionNodes] = useState<
        Map<NodeId, DefinitionNode>
    >(new Map());

    /**
     * Global term index derived from all current nodes.
     *
     * Used by callers that need to resolve a term to a node id
     * (e.g. auto-link preview, edge computation).
     */
    const termMap = useMemo(
        () => getDefinitionTerms(definitionNodes),
        [definitionNodes]
    );

    /**
     * Replace the current node set with preloaded data.
     * Does not perform additional validation or linking.
     */
    const loadDefinitionNodes = useCallback(
        (nodes: Map<NodeId, DefinitionNode>) => {
            setDefinitionNodes(new Map(nodes));
        },
        []
    );

    /**
     * Create a new definition node.
     *
     * - Validates label/aliases against existing nodes.
     * - Inserts links in the new node's description.
     * - Propagates links from the new node into all other nodes.
     */
    function addNode(
        draft: DefinitionDraft
    ): Result<DefinitionNode, ChangeNodeError> {
        const validated = validateNodeInput(
            draft,
            { kind: "create" },
            definitionNodes
        );
        if (!validated.ok) return validated;

        const now = new Date().toISOString();
        let node: DefinitionNode = {
            id: generateId(),
            ...validated.value,
            createdAt: now,
            updatedAt: now,
        };

        node = insertLinksIntoNode(node, definitionNodes);

        setDefinitionNodes((prev) => {
            let nextNodes = new Map<string, DefinitionNode>(prev);
            nextNodes.set(node.id, node);
            nextNodes = insertLinksFromNode(node, nextNodes);
            return nextNodes;
        });

        return { ok: true, value: node };
    }

    /**
     * Edit an existing definition node.
     *
     * - Fails if the node does not exist.
     * - Validates label/aliases against other nodes.
     * - Updates timestamps.
     * - Inserts links into this node's description.
     * - Cleans up stale links in all nodes (in case terms changed).
     * - Propagates new links from this node into all other nodes.
     */
    function editNode(
        draft: DefinitionDraft
    ): Result<DefinitionNode, ChangeNodeError> {
        if (!draft.id)
            return {
                ok: false,
                error: { type: "not found", id: "" },
            };

        const existing = definitionNodes.get(draft.id);
        if (!existing) {
            return {
                ok: false,
                error: { type: "not found", id: draft.id },
            };
        }

        const validated = validateNodeInput(
            {
                label: draft.label,
                aliases: draft.aliases,
                description: draft.description,
            },
            { kind: "edit", id: draft.id },
            definitionNodes
        );
        if (!validated.ok) return validated;

        const now = new Date().toISOString();
        let node: DefinitionNode = {
            ...existing,
            ...validated.value,
            updatedAt: now,
        };

        node = insertLinksIntoNode(node, definitionNodes);

        setDefinitionNodes((prev) => {
            let nextNodes = new Map<string, DefinitionNode>(prev);
            nextNodes.set(node.id, node);
            const termsAfterEdit = getDefinitionTerms(nextNodes);
            nextNodes = cleanupNodelinks(nextNodes, termsAfterEdit);
            nextNodes = insertLinksFromNode(node, nextNodes);
            return nextNodes;
        });

        return { ok: true, value: node };
    }

    /**
     * Delete a definition node and remove links that referred to it.
     *
     * - Node is removed from the map.
     * - Terms are recomputed without the node.
     * - `\nodelink` macros targeting this node are cleaned from descriptions.
     */
    function deleteNode(id: NodeId) {
        setDefinitionNodes((prev) => {
            if (!prev.has(id)) return prev;

            const rest = new Map(prev);
            rest.delete(id);

            const terms = getDefinitionTerms(rest);
            const cleanedNodes = cleanupNodelinks(rest, terms);

            return cleanedNodes;
        });
    }

    return {
        definitionNodes,
        termMap,
        loadDefinitionNodes,
        addNode,
        editNode,
        deleteNode,
    };
}
