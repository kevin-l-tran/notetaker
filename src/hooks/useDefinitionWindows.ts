import { useState } from "react";

import type { NodeId } from "../models/nodes";
import type { WindowEntry } from "../components/DefinitionWindows";

const generateId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `w_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
};

const createWindowEntry = (
    id: string = generateId(),
    nodeId: NodeId,
    index: number,
    position?: { x: number; y: number }
): WindowEntry => ({
    id,
    nodeId,
    defaultPosition: position ?? {
        x: 100 + index * 30,
        y: 80 + index * 30,
    },
    defaultSize: { w: 400, h: 300 },
});

export default function useDefinitionWindows() {
    const [windows, setWindows] = useState<WindowEntry[]>([]);
    const [zOrder, setZOrder] = useState<string[]>([]);

    const openWindowForNode = (
        id: NodeId,
        position?: { x: number; y: number }
    ) => {
        const windowId = generateId();
        setWindows((prev) => [
            ...prev,
            createWindowEntry(windowId, id, prev.length, position),
        ]);
        setZOrder((prev) => [...prev, windowId]);
    };

    const closeWindow = (id: string) => {
        setWindows((prev) => prev.filter((w) => w.id !== id));
        setZOrder((prev) => prev.filter((zid) => zid !== id));
    };

    const focusWindow = (id: string) => {
        setZOrder((prev) => {
            if (!prev.includes(id)) return [...prev, id];
            const rest = prev.filter((zid) => zid !== id);
            return [...rest, id];
        });
    };

    return {
        windows,
        zOrder,
        openWindowForNode,
        closeWindow,
        focusWindow,
    };
}
