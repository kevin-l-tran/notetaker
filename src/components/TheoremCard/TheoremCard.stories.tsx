import type { Meta, StoryObj } from "@storybook/react-vite";

import type { TheoremDraft } from "../../models/theoremNodes";

import TheoremCard from "./TheoremCard";

const meta: Meta<typeof TheoremCard> = {
    title: "Cards/TheoremCard",
    component: TheoremCard,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        onLinkClick: { action: "onLinkClick" },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const draft = {
    label: "Gershgorin Disk Theorem",
    number: "5.67",
    type: "Theorem",
    title: "Gershgorin Disk Theorem",
    catchphrase: "a bound on the spectrum of a square matrix",
    statement: String.raw`
        Suppose $T \in \mathcal{L}(V)$ and $v_1, \ldots, v_n$ is a \nodelink{basis}{basis} of $V$.
        Then each \nodelink{eigenvalue}{eigenvalue} of $T$ is contained in some \nodelink{gershgorin disk}{Gershgorin disk} of $T$
        with respect to the basis $v_1, \ldots, v_n$.
        `,
    proof: String.raw``, // Proof not yet implemented
} satisfies TheoremDraft;

export const Basic: Story = {
    args: {
        draft,
    },
};

export const NoNumber: Story = {
    args: {
        draft: { ...draft, number: "" },
    },
};

export const NoTitle: Story = {
    args: {
        draft: { ...draft, title: "" },
    },
};

export const NoCatchphrase: Story = {
    args: { draft: { ...draft, catchphrase: "" } },
};

export const FailedCatchphraseLatex: Story = {
    args: {
        draft: {
            ...draft,
            catchphrase: String.raw`
                This is a malformed LaTeX expression: $\\frac{1}{2$
                `,
        },
    },
};

export const FailedStatementLatex: Story = {
    args: {
        draft: {
            ...draft,
            statement: String.raw`
                This is a malformed LaTeX expression: $\\frac{1}{2$
                `,
        },
    },
};
