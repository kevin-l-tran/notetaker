import type { Node } from "./nodes";

export type TheoremNode = Node & {
    number: string;
    title: string;
    type: string;
    catchphrase: string;
    statement: string;
    proof: string;
};

export type TheoremDraft = {
    number: string;
    title: string;
    label: string;
    type: string;
    catchphrase: string;
    statement: string;
    proof: string;
};
