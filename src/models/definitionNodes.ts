import type { Node, NodeId } from "./nodes";

export type DefinitionNode = Node & {
    aliases: string[];
    description: string;
}

export type DefinitionDraft = {
    id?: NodeId
    label: string;
    aliases: string[];
    description: string;
}