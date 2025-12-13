import type { DefinitionNode } from "../../models/definitionNodes";
import type { NodeId } from "../../models/nodes";

import DefinitionCard from "../DefinitionCard";
import Window from "../Window";

type WindowEntry = {
    id: string;
    nodeId: NodeId;
    initialPosition: { x: number; y: number };
    initialSize: { w: number; h: number };
};

type Props = {
    windows: WindowEntry[];
    nodes: Record<NodeId, DefinitionNode>;
    onChangeWindows: (updater: (prev: WindowEntry[]) => WindowEntry[]) => void;
    onLinkClick?: (
        descriptor: string,
        position?: { x: number; y: number }
    ) => void;
};

function DefinitionWindows({
    windows,
    nodes,
    onChangeWindows,
    onLinkClick,
}: Props) {
    const bringToFront = (id: string) => {
        onChangeWindows((prev) => {
            const idx = prev.findIndex((w) => w.id === id);
            if (idx === -1) return prev;
            const next = [...prev];
            const [win] = next.splice(idx, 1);
            next.push(win);
            return next;
        });
    };

    const handleClose = (id: string) => {
        onChangeWindows((prev) => prev.filter((w) => w.id !== id));
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "grid",
                pointerEvents: "none",
                zIndex: 100,
            }}
        >
            {windows.map((w, index) => {
                const node = nodes[w.nodeId];
                if (!node) return null;
                const isActive = index === windows.length - 1;
                return (
                    <Window
                        key={w.id}
                        title={node.label}
                        initialPosition={w.initialPosition}
                        initialSize={w.initialSize}
                        onClose={() => handleClose(w.id)}
                        onFocus={() => bringToFront(w.id)}
                        zIndex={index + 1}
                        isActive={isActive}
                    >
                        <DefinitionCard
                            draft={{
                                label: node.label,
                                aliases: node.aliases,
                                description: node.description,
                            }}
                            onLinkClick={onLinkClick}
                        />
                    </Window>
                );
            })}
        </div>
    );
}

export default DefinitionWindows;
