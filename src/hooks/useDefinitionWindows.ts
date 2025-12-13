import { useState } from "react";

import type { Node, NodeId } from "../models/nodes";

type WindowEntry = {
    id: string;
    nodeId: NodeId;
    initialPosition: { x: number; y: number };
    initialSize: { w: number; h: number };
};

const generateId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `w_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
};

const createWindowEntry = (
    nodeId: NodeId,
    index: number,
    position?: { x: number; y: number }
): WindowEntry => ({
    id: generateId(),
    nodeId,
    initialPosition: position ?? {
        x: 100 + index * 30,
        y: 80 + index * 30,
    },
    initialSize: { w: 400, h: 300 },
});

/**
 * Manage the set of open definition windows.
 *
 * Responsibilities:
 * - Track all open windows and their associated node ids.
 * - Provide an API to open a new window for a node, optionally at a
 *   specific screen position.
 * - Provide an API to close a window by its window id.
 *
 * The actual window position/size updates at runtime are expected to be
 * managed by the window component itself, which can call `setWindows`
 * to persist changes if needed.
 */
export default function useDefinitionWindows() {
    const [windows, setWindows] = useState<WindowEntry[]>([]);

    const openWindowForNode = (
        node: Node,
        position?: { x: number; y: number }
    ) => {
        setWindows((prev) => [
            ...prev,
            createWindowEntry(node.id, prev.length, position),
        ]);
    };

    const closeWindow = (id: string) => {
        setWindows((prev) => prev.filter((w) => w.id !== id));
    };

    return {
        windows,
        setWindows,
        openWindowForNode,
        closeWindow,
    };
}
