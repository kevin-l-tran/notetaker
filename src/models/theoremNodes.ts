import type { Node } from "./nodes";

type HasNumberOrTitle =
    | { number: string; title?: string }
    | { number?: string; title: string };

export type TheoremNode = Node &
    HasNumberOrTitle & {
        type: string;
        catchphrase?: string;
        statement: string;
        proof?: string;
    };

export type TheoremDraft = HasNumberOrTitle & {
    label: string;
    type: string;
    catchphrase?: string;
    statement: string;
    proof?: string;
};
