import type { DefinitionNode } from "../../models/definitionNodes";
import type { NodeId } from "../../models/nodes";

import DefinitionCard from "../DefinitionCard";
import Window from "../Window";

export type WindowEntry = {
    id: string;
    nodeId: NodeId;
    defaultPosition: { x: number; y: number };
    defaultSize: { w: number; h: number };
};

type Props = {
    windows: WindowEntry[];
    zOrder: string[];
    nodes: Map<NodeId, DefinitionNode>;
    onFocusWindow: (id: string) => void;
    onCloseWindow: (id: string) => void;
    onLinkClick?: (
        descriptor: string,
        position?: { x: number; y: number }
    ) => void;
};

/**
 * React hook that manages the set of open definition windows and their z-order.
 *
 * Responsibilities:
 * - Track all open windows as an array of {@link WindowEntry}.
 * - Maintain a separate `zOrder` array of window ids (back → front).
 * - Provide operations to:
 *   - `openWindowForNode` – open a window for a given definition node id.
 *   - `closeWindow` – close a window by id and remove it from z-order.
 *   - `focusWindow` – bring an existing window to the front of the z-stack.
 *
 * This hook does **not** control live window position or size. Those are owned
 * by the `Window` component; only the *initial* placement (`defaultPosition`
 * / `defaultSize`) is stored here.
 */
function DefinitionWindows({
    windows,
    zOrder,
    nodes,
    onFocusWindow,
    onCloseWindow,
    onLinkClick,
}: Props) {
    const zIndexDefault = 1000;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
            }}
        >
            {windows.map((w) => {
                const node = nodes.get(w.nodeId);
                if (!node) return null;

                const idx = zOrder.indexOf(w.id);
                const zIndex = idx === -1 ? zIndexDefault : idx + 1;

                const isActive =
                    zOrder.length > 0 && zOrder[zOrder.length - 1] === w.id;

                return (
                    <Window
                        key={w.id}
                        title={node.label}
                        defaultPosition={w.defaultPosition}
                        defaultSize={w.defaultSize}
                        onClose={() => {
                            onCloseWindow(w.id);
                        }}
                        onFocus={() => {
                            onFocusWindow(w.id);
                        }}
                        zIndex={zIndex}
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
