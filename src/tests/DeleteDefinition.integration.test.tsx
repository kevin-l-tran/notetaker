import { useEffect, useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import useDefinitionStore from "../hooks/useDefinitionStore";
import GraphContextMenu from "../components/GraphContextMenu";

// --- Initial node data used by the test -----------------------------------

const INITIAL_NODES = {
    metric: {
        id: "metric",
        label: "Metric space",
        aliases: [] as string[],
        description: "A metric space is usually denoted (X, d).",
        createdAt: "",
        updatedAt: "",
    },
    topology: {
        id: "topology",
        label: "Topology",
        aliases: [] as string[],
        description:
            "A topology can be defined using a \\nodelink{metric space}{metric space}.",
        createdAt: "",
        updatedAt: "",
    },
} as const;

// --- Harness: store + tiny graph + windows + context menu -----------------

type ContextMenuState = {
    nodeId: string;
    clientX: number;
    clientY: number;
} | null;

function DeleteDefinitionHarness() {
    const { definitionNodes, loadDefinitionNodes, deleteNode } =
        useDefinitionStore();

    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

    // Preload our two nodes into the real store
    useEffect(() => {
        loadDefinitionNodes({ definitionNodes: INITIAL_NODES as any });
    }, []);

    const nodesArray = Object.values(definitionNodes);

    return (
        <div>
            {/* Minimal “graph”: each node is represented as a button */}
            <div aria-label="mock-graph">
                {nodesArray.map((node) => (
                    <button
                        key={node.id}
                        type="button"
                        data-testid={`graph-node-${node.id}`}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                                nodeId: node.id,
                                clientX: 100,
                                clientY: 100,
                            });
                        }}
                    >
                        {node.label}
                    </button>
                ))}
            </div>

            {/* Expose descriptions so the test can assert on link cleanup */}
            <div aria-label="descriptions">
                {nodesArray.map((node) => (
                    <pre key={node.id} aria-label={`${node.id}-description`}>
                        {node.description}
                    </pre>
                ))}
            </div>

            {/* Real context menu wired to our handlers */}
            <GraphContextMenu
                state={contextMenu}
                onEdit={() => {}}
                onDelete={(id) => {
                    deleteNode(id);
                    setContextMenu(null);
                }}
            />
        </div>
    );
}

// --- The test -------------------------------------------------------------

describe("delete existing node + link cleanup", () => {
    it("cleans links in existing nodes and removes the deleted node", async () => {
        render(<DeleteDefinitionHarness />);

        // Sanity check: both nodes are present in the mock graph
        const metricButton = screen.getByRole("button", {
            name: /metric space/i,
        });
        const topologyButton = screen.getByRole("button", {
            name: /topology/i,
        });
        expect(metricButton).toBeInTheDocument();
        expect(topologyButton).toBeInTheDocument();

        // Before deletion, Topology’s description has a \nodelink to “metric space”
        const topologyDescBefore = screen.getByLabelText(
            "topology-description"
        );
        expect(topologyDescBefore.textContent).toContain(
            "\\nodelink{metric space}{metric space}"
        );

        // Open the context menu on Metric space and click Delete
        fireEvent.contextMenu(metricButton, { clientX: 100, clientY: 100 });
        const deleteButton = screen.getByRole("button", { name: /delete/i });
        fireEvent.click(deleteButton);

        // The Metric space node is gone from the “graph”
        expect(
            screen.queryByRole("button", { name: /metric space/i })
        ).not.toBeInTheDocument();

        // Topology still exists
        expect(
            screen.getByRole("button", { name: /topology/i })
        ).toBeInTheDocument();

        // After deletion, the stale nodelink macro is cleaned up:
        // - no \nodelink{metric space}{metric space}
        // - the visible text "metric space" is still present
        const topologyDescAfter = screen.getByLabelText("topology-description");
        expect(topologyDescAfter.textContent).not.toContain(
            "\\nodelink{metric space}{metric space}"
        );
        expect(topologyDescAfter.textContent).toContain("metric space");
    });
});
