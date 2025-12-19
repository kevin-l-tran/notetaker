/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useEffect, type RefObject } from "react";

type GraphEventHandlers = {
    /**
     * Called when a Cytoscape node is double-clicked.
     * Receives the node's id.
     */
    onNodeDoubleTap?: (id: string) => void;

    /**
     * Called when a Cytoscape node is context-clicked (right-click / long-press).
     * Receives the node id and the screen coordinates for positioning a menu.
     */
    onNodeContextMenu?: (payload: {
        id: string;
        clientX: number;
        clientY: number;
    }) => void;
};

/**
 * Attach high-level React-style event handlers to a Cytoscape instance.
 *
 * - Listens for `dbltap` on nodes and maps it to `onNodeDoubleTap`.
 * - Listens for `cxttap` on nodes and maps it to `onNodeContextMenu`.
 * - Normalizes Cytoscape events into simple payloads (node id, mouse coords).
 * - Automatically cleans up Cytoscape listeners when dependencies change
 *   or the component unmounts.
 */
export default function useCytoscapeEvents(
    cyRef: RefObject<cytoscape.Core | null>,
    cyReady: boolean,
    handlers: GraphEventHandlers
) {
    useEffect(() => {
        if (!cyReady) return;
        const cy = cyRef.current;
        if (!cy) return;

        const disposers: (() => void)[] = [];

        if (handlers.onNodeDoubleTap) {
            const handleTap = (evt: cytoscape.EventObject) => {
                handlers.onNodeDoubleTap?.(evt.target.id());
            };
            cy.on("dbltap", "node", handleTap);
            disposers.push(() => cy.off("dbltap", "node", handleTap));
        }

        if (handlers.onNodeContextMenu) {
            const handleContext = (evt: cytoscape.EventObject) => {
                const original = evt.originalEvent as
                    | MouseEvent
                    | TouchEvent
                    | undefined;
                if (!original) return;

                original.preventDefault();

                let clientX: number;
                let clientY: number;

                if (original instanceof MouseEvent) {
                    clientX = original.clientX;
                    clientY = original.clientY;
                } else if (original instanceof TouchEvent) {
                    clientX = original.touches[0].clientX;
                    clientY = original.touches[0].clientY;
                } else {
                    return;
                }

                handlers.onNodeContextMenu?.({
                    id: evt.target.id(),
                    clientX,
                    clientY,
                });
            };
            cy.on("cxttap", "node", handleContext);
            disposers.push(() => cy.off("cxttap", "node", handleContext));
        }

        return () => {
            disposers.forEach((dispose) => {
                dispose();
            });
        };
    }, [cyRef, cyReady, handlers]);
}
