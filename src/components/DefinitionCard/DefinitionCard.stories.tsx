// DefinitionCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import type { DefinitionDraft } from "../../models/definitionNodes";

import DefinitionCard from "./DefinitionCard";

const meta: Meta<typeof DefinitionCard> = {
    title: "Cards/DefinitionCard",
    component: DefinitionCard,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        onLinkClick: { action: "onLinkClick" },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const draft: DefinitionDraft = {
    label: "Topological Basis",
    aliases: ["basis"],
    description: String.raw`
        If $X$ is a set, a \emph{basis} for a \nodelink{topology}{topology} on $X$ is a 
        collection $\mathcal{B}$ of subsets of $X$ (called \emph{basis elements}) such that
        \begin{enumerate}
            \item For each $x \in X$, there is at least one basis element
                    $B \in \mathcal{B}$ containing $x$.
            \item If $x$ belongs to the intersection of two basis elements
                    $B_1,B_2 \in \mathcal{B}$, then there is a basis element
                    $B_3 \in \mathcal{B}$ containing $x$ such that
                    $B_3 \subset B_1 \cap B_2$.
        \end{enumerate}
        `,
};

export const Basic: Story = {
    args: {
        draft,
    },
};

export const NoAliases: Story = {
    args: {
        draft: { ...draft, aliases: [] },
    },
};

export const ManyAliases: Story = {
    args: {
        draft: {
            ...draft,
            aliases: [
                "basis",
                "topological basis",
                "open set basis",
                "neighborhood basis",
                "basis for a topology",
                "set basis",
                "basis collection",
                "basis family",
            ],
        },
    },
};

export const FailedDescriptionLatex: Story = {
    args: {
        draft: {
            ...draft,
            description: String.raw`
                This is a malformed LaTeX expression: $\\frac{1}{2$
                `,
        },
    },
};
