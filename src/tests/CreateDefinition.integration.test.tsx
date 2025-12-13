import { useEffect, useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import useDefinitionStore from "../hooks/useDefinitionStore";
import DefinitionEditorForm from "../components/DefinitionEditorForm";

// --- Lightweight mocks for child components -------------------------------

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

// --- Test harness that wires the form to the real store -------------------

function TestCreateDefinitionFlow() {
    const { definitionNodes, addNode, loadDefinitionNodes } =
        useDefinitionStore();
    const [open, setOpen] = useState(true);

    useEffect(() => {
        loadDefinitionNodes({ definitionNodes: INITIAL_NODES as any });
    }, []);

    const nodes = Object.values(definitionNodes);

    return (
        <div>
            <DefinitionEditorForm
                open={open}
                mode="create"
                onClose={() => setOpen(false)}
                onSubmit={addNode}
                // keep auto-linking trivial for this test
                autoLinkGenerate={(draft) => draft.description}
            />

            {/* Simple list showing saved definitions */}
            <ul aria-label="definitions-list">
                {nodes.map((node) => (
                    <li key={node.id}>{node.label}</li>
                ))}
            </ul>

            {/* Expose descriptions so the test can assert on link cleanup */}
            <div aria-label="descriptions">
                {nodes.map((node) => (
                    <pre key={node.id} aria-label={`${node.label}-description`}>
                        {node.description}
                    </pre>
                ))}
            </div>
        </div>
    );
}

// --- The actual integration test -----------------------------------------

let confirmSpy: any;

describe("Create + save definition flow", () => {
    beforeEach(() => {
        // DefinitionEditorForm asks for confirmation before calling onSubmit
        confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    });

    afterEach(() => {
        confirmSpy.mockRestore();
        vi.restoreAllMocks();
    });

    it("creates and saves a new definition through the form", async () => {
        const user = userEvent.setup();

        render(<TestCreateDefinitionFlow />);

        // The label input starts with "New Definition"
        const labelInput = screen.getByLabelText(/label/i);
        await user.clear(labelInput);
        await user.type(labelInput, "Metric space");

        // First alias field has placeholder "Alias 1"
        const aliasInput = screen.getByPlaceholderText("Alias 1");
        await user.type(aliasInput, "Distance space");

        const description = screen.getByRole("textbox", {
            name: /^description$/i,
        });
        await user.clear(description);
        await user.type(
            description,
            "A metric space induces a topology on X. " +
                "A topology can be defined using a metric space."
        );

        // Click the primary submit button: "Save Definition" in create mode
        const saveButton = screen.getByRole("button", {
            name: /save definition/i,
        });
        await user.click(saveButton);

        // Confirm dialog should have been shown
        expect(window.confirm).toHaveBeenCalled();

        // The new definition label should appear in our "saved definitions" list
        const saved = await screen.findByText("Metric space");
        expect(saved).toBeInTheDocument();

        // After creation, Topology’s description has a \nodelink to “metric space”
        const topologyDescBefore = screen.getByLabelText(
            "Topology-description"
        );
        expect(topologyDescBefore.textContent).toContain(
            "\\nodelink{metric space}{metric space}"
        );

        // After creation, Metric Space’s description has a \nodelink to “toplogy”
        const metricDescBefore = screen.getByLabelText(
            "Metric space-description"
        );
        expect(metricDescBefore.textContent).toContain(
            "\\nodelink{topology}{topology}"
        );

        // The create modal should have closed after a successful save
        expect(
            screen.queryByText("Create a Definition")
        ).not.toBeInTheDocument();
    });
});
