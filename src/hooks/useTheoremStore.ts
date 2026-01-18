/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NodeId } from "../models/nodes";
import type { TheoremDraft, TheoremNode } from "../models/theoremNodes";

type TermsMap = Map<string, NodeId>;
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
type AddOrEditMode = { kind: "create" } | { kind: "edit"; id: NodeId };
export type ChangeNodeError =
    | { type: "title taken"; title: string }
    | { type: "number taken"; number: string }
    | { type: "invalid number format"; number: string }
    | { type: "title and number missing" }
    | { type: "statement missing" }
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
    input: TheoremDraft,
    mode: AddOrEditMode,
    theoremNodes: Map<NodeId, TheoremNode>,
): Result<TheoremDraft, ChangeNodeError> {
    if (input.title.trim() === "" && input.number.trim() === "") {
        return {
            ok: false,
            error: { type: "title and number missing" },
        };
    }

    if (input.statement.trim() === "") {
        return {
            ok: false,
            error: { type: "statement missing" },
        };
    }

    const numberPattern = /^[.0-9]*/;
    if (
        input.number.trim() !== "" &&
        numberPattern.exec(input.number.trim())?.includes(input.number.trim())
    ) {
        return {
            ok: false,
            error: { type: "invalid number format", number: input.number },
        };
    }

    const otherNodes = Array.from(theoremNodes.values()).filter((n) =>
        mode.kind === "edit" ? n.id !== mode.id : true,
    );

    const existingTerms = new Set<string>();
    for (const node of otherNodes) {
        existingTerms.add(node.title.trim().toLowerCase());
        existingTerms.add(node.number.trim().toLowerCase());
    }

    const normalizedTitle = input.label.trim().toLowerCase();
    const normalizedNumber = input.number.trim().toLowerCase();
    const titleTaken = existingTerms.has(normalizedTitle);
    const numberTaken = existingTerms.has(normalizedNumber);

    if (titleTaken) {
        return {
            ok: false,
            error: { type: "title taken", title: normalizedTitle },
        };
    }
    if (numberTaken) {
        return {
            ok: false,
            error: { type: "number taken", number: normalizedNumber },
        };
    }

    return {
        ok: true,
        value: {
            title: input.title.trim(),
            number: input.number.trim(),
            label: input.label.trim(),
            type: input.type,
            catchphrase: input.catchphrase.trim(),
            statement: input.statement.trim(),
            proof: input.proof.trim(),
        },
    };
}
