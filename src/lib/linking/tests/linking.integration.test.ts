import { describe, it, expect } from "vitest";
import { getDefinitionTerms } from "../getTerms";
import autoInsertLinks from "../autoInsertLinks";
import cleanLinks from "../cleanLinks";
import getEdges from "../getEdges";

describe("linking integration", () => {
    it("links descriptions and cleans up links when a node is removed", () => {
        // Three nodes: two definitions (space, time) and one concept that references them
        const defs = new Map(
            Object.entries({
                space: {
                    id: "space-id",
                    label: "Space",
                    aliases: [],
                    description: "",
                    createdAt: "",
                    updatedAt: "",
                },
                time: {
                    id: "time-id",
                    label: "Time",
                    aliases: [],
                    description: "",
                    createdAt: "",
                    updatedAt: "",
                },
                concept: {
                    id: "concept-id",
                    label: "Concept",
                    aliases: [],
                    description: "space and time",
                    createdAt: "",
                    updatedAt: "",
                },
            })
        );

        // Build term → id map from all nodes
        const terms = getDefinitionTerms(defs);

        // Auto-insert links into the concept description
        const concept = defs.get("concept");
        let linkedDescription = "";
        if (concept) {
            linkedDescription = autoInsertLinks(
                "concept-id",
                concept.description,
                terms
            );
        }

        // Both "space" and "time" should be linked
        expect(linkedDescription).toBe(
            "\\nodelink{space}{space} and \\nodelink{time}{time}"
        );

        // Extract logical edges from the linked description
        const edgesBefore = getEdges("concept-id", linkedDescription, terms);
        const sortedFromIds = edgesBefore.map((e) => e.from).sort();

        expect(sortedFromIds).toEqual(["space-id", "time-id"].sort());

        // Now simulate deleting the "time" node
        const defsWithoutTime = new Map(defs);
        defsWithoutTime.delete("time");

        const termsWithoutTime = getDefinitionTerms(defsWithoutTime);

        // Clean links using the updated term map
        const cleanedDescription = cleanLinks(
            linkedDescription,
            termsWithoutTime
        );

        // The "time" macro should be removed, leaving plain text,
        // while the "space" macro is preserved.
        expect(cleanedDescription).toBe("\\nodelink{space}{space} and time");

        // Edges should now only include the "space" definition
        const edgesAfter = getEdges(
            "concept-id",
            cleanedDescription,
            termsWithoutTime
        );

        expect(edgesAfter).toEqual([
            { key: "space", from: "space-id", to: "concept-id" },
        ]);
    });

    it("keeps macros but rebinds edges when a term moves to another node", () => {
        // Initial state:
        // - nodeA owns the term "space"
        // - nodeB is some other definition
        // - concept node refers to the word "space" in its description
        const initialNodes = new Map(
            Object.entries({
                nodeA: {
                    id: "nodeA",
                    label: "Space",
                    aliases: [],
                    description: "",
                    createdAt: "",
                    updatedAt: "",
                },
                nodeB: {
                    id: "nodeB",
                    label: "Vacuum",
                    aliases: [],
                    description: "",
                    createdAt: "",
                    updatedAt: "",
                },
                concept: {
                    id: "concept",
                    label: "Concept",
                    aliases: [],
                    description: "space",
                    createdAt: "",
                    updatedAt: "",
                },
            })
        );

        const nodeA = initialNodes.get("nodeA");
        const nodeB = initialNodes.get("nodeB");
        const conceptNode = initialNodes.get("concept");

        if (!nodeA || !nodeB || !conceptNode) {
            throw new Error(
                "Test setup bug: expected all initial nodes to exist"
            );
        }

        // Build initial term map: "space" -> nodeA, "vacuum" -> nodeB
        const terms1 = getDefinitionTerms(initialNodes);

        // Auto-insert links into the concept description
        const conceptBefore = conceptNode.description;
        const linkedDescription = autoInsertLinks(
            "concept",
            conceptBefore,
            terms1
        );

        // The word "space" should now be wrapped in a nodelink macro
        expect(linkedDescription).toBe("\\nodelink{space}{space}");

        // Edges computed with the initial term map should point from nodeA -> concept
        const edgesBefore = getEdges("concept", linkedDescription, terms1);
        expect(edgesBefore).toEqual([
            {
                key: "space",
                from: "nodeA",
                to: "concept",
            },
        ]);

        // Now simulate moving the term "space" from nodeA to nodeB:
        // - nodeA no longer has "space" as its label
        // - nodeB now has label "Space"

        const updatedNodes = new Map(
            Object.entries({
                nodeA: {
                    ...nodeA,
                    label: "Old Space", // no longer normalized to "space"
                },
                nodeB: {
                    ...nodeB,
                    label: "Space", // now owns the term "space"
                },
                concept: {
                    ...conceptNode,
                    description: linkedDescription, // keep the macro we inserted
                },
            })
        );

        // Rebuild the term map after the change:
        // "space" should now resolve to nodeB.
        const terms2 = getDefinitionTerms(updatedNodes);

        // Clean links using the new term map. Since "space" still resolves
        // (but to a different node), the macro should be preserved.
        const cleanedDescription = cleanLinks(linkedDescription, terms2);
        expect(cleanedDescription).toBe(linkedDescription);

        // Now edges should rebind so that "space" points from nodeB -> concept
        const edgesAfter = getEdges("concept", cleanedDescription, terms2);
        expect(edgesAfter).toEqual([
            {
                key: "space",
                from: "nodeB",
                to: "concept",
            },
        ]);
    });
});
