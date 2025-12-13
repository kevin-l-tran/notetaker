import { useEffect, useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import useDefinitionStore from "../hooks/useDefinitionStore";
import useDefinitionGraph from "../hooks/useDefinitionGraph";
import DefinitionEditorForm from "../components/DefinitionEditorForm";

// --- Lightweight mocks for child components ---------------------------------

vi.mock("../components/LatexEditor", () => ({
    default: ({ description, onChange }: any) => (
        <textarea
            aria-label="Description"
            value={description}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

vi.mock("../components/DefinitionCard", () => ({
    default: ({ draft }: any) => (
        <div data-testid="definition-preview">
            <h2>{draft.label}</h2>
        </div>
    ),
}));

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
        description: "A topology can be defined using a metric space.",
        createdAt: "",
        updatedAt: "",
    },
} as const;

// --- Test harness wiring store + editor + graph ---------------------------

function EditDefinitionHarness() {
    const { definitionNodes, loadDefinitionNodes, editNode } =
        useDefinitionStore();
    const { definitionGraphEdges } = useDefinitionGraph(definitionNodes);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        loadDefinitionNodes({ definitionNodes: INITIAL_NODES as any });
        setInitialized(true);
    }, []);

    const nodeToEdit = initialized ? definitionNodes["metric"] : null;

    return (
        <div>
            {nodeToEdit && (
                <DefinitionEditorForm
                    open={true}
                    mode="edit"
                    initialDraft={{
                        label: nodeToEdit.label,
                        aliases: nodeToEdit.aliases,
                        description: nodeToEdit.description,
                    }}
                    onClose={() => {}}
                    onSubmit={(draft) =>
                        editNode({
                            id: nodeToEdit.id,
                            label: draft.label,
                            aliases: draft.aliases,
                            description: draft.description,
                        })
                    }
                    // We don't use "Generate Links" in this test; keep it a no-op.
                    autoLinkGenerate={(draft) => draft.description}
                />
            )}

            {/* Expose descriptions and derived edges so the test can assert on them */}
            <pre aria-label="metric-description">
                {definitionNodes["metric"]?.description ?? ""}
            </pre>
            <pre aria-label="topology-description">
                {definitionNodes["topology"]?.description ?? ""}
            </pre>

            <ul aria-label="edges-list">
                {definitionGraphEdges.map((e) => (
                    <li key={e.id}>{`${e.source}->${e.target}`}</li>
                ))}
            </ul>
        </div>
    );
}

// --- The actual integration test ------------------------------------------

let confirmSpy: any;

describe("edit existing node + link generation", () => {
    beforeEach(() => {
        confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    });

    afterEach(() => {
        confirmSpy.mockRestore();
        vi.restoreAllMocks();
    });

    it("inserts nodelinks on edit and updates graph edges", async () => {
        const user = userEvent.setup();

        render(<EditDefinitionHarness />);

        // Wait for the editor to show the existing node
        const titleInput = await screen.findByLabelText(/label/i);
        expect(titleInput).toHaveValue("Metric space");

        // Initially: no \nodelink macros and no edges
        expect(
            screen.getByLabelText("metric-description").textContent
        ).not.toMatch(/\\nodelink/);
        expect(
            screen.getByLabelText("topology-description").textContent
        ).not.toMatch(/\\nodelink/);
        expect(screen.queryByText("metric->topology")).not.toBeInTheDocument();
        expect(screen.queryByText("topology->metric")).not.toBeInTheDocument();

        // Edit the description for "Metric space" so it references "Topology"
        const description = screen.getByRole("textbox", {
            name: /^description$/i,
        });
        await user.clear(description);
        await user.type(
            description,
            "A metric space induces a topology on X. " +
                "A topology can be defined using a metric space."
        );

        const updateButton = screen.getByRole("button", {
            name: /update definition/i,
        });
        await user.click(updateButton);

        expect(window.confirm).toHaveBeenCalled();

        // After the edit:
        // - The edited node's description should link to "Topology"
        // - The other node's description should link back to "Metric space"
        const metricDesc = await screen.findByLabelText("metric-description");
        const topologyDesc = screen.getByLabelText("topology-description");

        expect(metricDesc.textContent).toContain(
            "\\nodelink{topology}{topology}"
        );
        expect(topologyDesc.textContent).toContain(
            "\\nodelink{metric space}{metric space}"
        );

        // And the derived graph edges should reflect both directions:
        //   Topology -> Metric space  (link in Metric's description)
        //   Metric space -> Topology  (link in Topology's description)
        expect(await screen.findByText("topology->metric")).toBeInTheDocument();
        expect(await screen.findByText("metric->topology")).toBeInTheDocument();
    });
});
