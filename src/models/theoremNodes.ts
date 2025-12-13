import type { Node } from "./nodes";

export type TheoremNode = Node & {
    title: string;
    catchphrase: string[];
    statement: string;
    proof?: string;
};

export type TheoremDraft = {
    label: string;
    title: string;
    catchphrase: string[];
    statement: string;
    proof?: string;
}