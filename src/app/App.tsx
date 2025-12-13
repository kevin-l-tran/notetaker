import { useEffect, useState } from "react";

import type { NodeId } from "../models/nodes";
import type { DefinitionNode } from "../models/definitionNodes";

import autoInsertLinks from "../lib/linking/autoInsertLinks";
import exampleData from "../examples/topology-graph-data.json";
import buildAC from "../lib/linking/buildAC";
import useDefinitionStore from "../hooks/useDefinitionStore";
import useDefinitionWindows from "../hooks/useDefinitionWindows";
import useDefinitionGraph from "../hooks/useDefinitionGraph";
import DefinitionWindows from "../components/DefinitionWindowManager";
import DefinitionEditorForm from "../components/DefinitionEditorForm";
import GraphView from "../components/GraphView";
import GraphToolbar from "../components/GraphToolbar";
import GraphContextMenu from "../components/GraphContextMenu";
import { getDefinitionTerms } from "../lib/linking/getTerms";

type NodeContextMenuState = {
    nodeId: string;
    clientX: number;
    clientY: number;
} | null;

const PREVIEW_NODE_ID = "__preview__" as NodeId;

export default function App() {
    const {
        definitionNodes,
        loadDefinitionNodes,
        addNode,
        editNode,
        deleteNode,
    } = useDefinitionStore();
    const { definitionGraphNodes, definitionGraphEdges } =
        useDefinitionGraph(definitionNodes);
    const { windows, setWindows, openWindowForNode } = useDefinitionWindows();

    const definitionTerms = getDefinitionTerms(definitionNodes);
    const definitionAC = buildAC(definitionTerms);

    const [contextMenu, setContextMenu] = useState<NodeContextMenuState>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingNodeId, setEditingNodeId] = useState<NodeId | null>(null);
    const editingNode = editingNodeId ? definitionNodes[editingNodeId] : null;

    const [searchTerm, setSearchTerm] = useState("");
    const [focusedNodeId, setFocusedNodeId] = useState<NodeId | null>(null);
    const [searchNotFound, setSearchNotFound] = useState(false);

    const onLinkClick = (
        descriptor: string,
        position?: { x: number; y: number }
    ) => {
        const matches = Object.values(definitionNodes).filter((n) => {
            const normalizedTerms = [
                ...n.aliases.map((a) => a.trim().toLowerCase()),
                n.label.trim().toLowerCase(),
            ];
            return normalizedTerms.includes(descriptor.trim().toLowerCase());
        });
        if (matches.length > 0) {
            openWindowForNode(matches[0], position);
        }
    };

    const handleSaveToFile = () => {
        const data = { definitionNodes };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "graph-data.json";
        a.click();

        URL.revokeObjectURL(url);
    };

    const handleLoadExample = () => {
        const data = exampleData as {
            definitionNodes: Record<string, DefinitionNode>;
        };

        loadDefinitionNodes({ definitionNodes: data.definitionNodes ?? {} });
    };

    const handleLoadFromJson = (json: unknown) => {
        if (!json || typeof json !== "object") {
            console.error("Invalid graph file format");
            return;
        }
        const parsed = json as {
            definitionNodes?: Record<string, DefinitionNode>;
        };
        loadDefinitionNodes({
            definitionNodes: parsed.definitionNodes ?? {},
        });
    };

    const handleSearch = () => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) {
            setFocusedNodeId(null);
            setSearchNotFound(false);
            return;
        }

        const match = Object.values(definitionNodes).find((n) => {
            const title = n.label.trim().toLowerCase();
            if (title === q) return true;

            return n.aliases.some((a) => a.trim().toLowerCase() === q);
        });

        if (match) {
            setFocusedNodeId(match.id);
            setSearchNotFound(false);
        } else {
            setFocusedNodeId(null);
            setSearchNotFound(true);
        }
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "grid",
            }}
        >
            <div
                style={{
                    borderRight: "1px solid #e5e7eb",
                    minWidth: "0px",
                    overflow: "hidden",
                }}
            >
                <GraphView
                    nodes={definitionGraphNodes}
                    edges={definitionGraphEdges}
                    centerNodeId={focusedNodeId}
                    highlightNodeId={focusedNodeId}
                    onNodeDoubleTap={(id) =>
                        openWindowForNode(definitionNodes[id])
                    }
                    onNodeContextMenu={({ id, clientX, clientY }) => {
                        setContextMenu({ nodeId: id, clientX, clientY });
                    }}
                />
            </div>

            <GraphToolbar
                onSave={handleSaveToFile}
                onLoadExample={handleLoadExample}
                onLoadJson={handleLoadFromJson}
                onOpenCreate={() => setIsCreateOpen(true)}
                searchTerm={searchTerm}
                onSearchTermChange={(value) => {
                    setSearchTerm(value);
                    if (searchNotFound) setSearchNotFound(false);
                }}
                onSearch={handleSearch}
                searchNotFound={searchNotFound}
            />

            <GraphContextMenu
                state={contextMenu}
                onEdit={(id) => {
                    setEditingNodeId(id);
                    setContextMenu(null);
                }}
                onDelete={(id) => {
                    const ok = window.confirm(
                        "Are you sure you want to delete this definition?"
                    );
                    if (!ok) return;
                    deleteNode(id);
                    setContextMenu(null);
                }}
            />

            <DefinitionWindows
                windows={windows}
                nodes={definitionNodes}
                onChangeWindows={(updater) => setWindows(updater)}
                onLinkClick={onLinkClick}
            />

            <DefinitionEditorForm
                open={isCreateOpen}
                mode="create"
                onClose={() => setIsCreateOpen(false)}
                onSubmit={addNode}
                autoLinkGenerate={(draft) =>
                    autoInsertLinks(
                        PREVIEW_NODE_ID,
                        draft.description,
                        definitionTerms,
                        definitionAC
                    )
                }
            />
            {editingNode && (
                <DefinitionEditorForm
                    open={Boolean(editingNode)}
                    mode="edit"
                    initialDraft={{
                        label: editingNode.label,
                        aliases: editingNode.aliases,
                        description: editingNode.description,
                    }}
                    onClose={() => setEditingNodeId(null)}
                    onSubmit={(draft) =>
                        editNode({
                            id: editingNode.id,
                            label: draft.label,
                            aliases: draft.aliases,
                            description: draft.description,
                        })
                    }
                    autoLinkGenerate={(draft) =>
                        autoInsertLinks(
                            editingNode.id,
                            draft.description,
                            definitionTerms,
                            definitionAC
                        )
                    }
                />
            )}
        </div>
    );
}
