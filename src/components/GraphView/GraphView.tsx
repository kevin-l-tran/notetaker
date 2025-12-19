import { useEffect, useMemo, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

import useCytoscapeEvents from "../../hooks/useCytoscapeEvents";

cytoscape.use(fcose);

type Props = {
    nodes: { id: string; label: string }[];
    edges: { id: string; source: string; target: string }[];
    centerNodeId?: string | null;
    highlightNodeId?: string | null;
    onNodeDoubleTap: (id: string) => void;
    onNodeContextMenu?: (payload: {
        id: string;
        clientX: number;
        clientY: number;
    }) => void;
};

function GraphView({
    nodes,
    edges,
    centerNodeId,
    highlightNodeId,
    onNodeDoubleTap,
    onNodeContextMenu,
}: Props) {
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [cyReady, setCyReady] = useState<boolean>(false);

    const elements = useMemo(
        () => [
            ...nodes.map((n) => ({ data: { id: n.id, label: n.label } })),
            ...edges.map((e) => ({
                data: { id: e.id, source: e.source, target: e.target },
            })),
        ],
        [nodes, edges]
    );

    const handlers = useMemo(
        () => ({ onNodeDoubleTap, onNodeContextMenu }),
        [onNodeDoubleTap, onNodeContextMenu]
    );
    useCytoscapeEvents(cyRef, cyReady, handlers);

    const setupGraph = (cy: cytoscape.Core | null) => {
        if (!cy) return;
        cyRef.current = cy;
        setCyReady(true);

        cy.style()
            .fromJson([
                {
                    selector: "node",
                    style: {
                        "background-color": "#89a",
                        "font-size": 12,
                        label: "data(label)",
                    },
                },
                {
                    selector: "node[outDegree <= 2]",
                    style: { "background-color": "#c6dbef" },
                },
                {
                    selector: "node[outDegree > 2][outDegree <= 5]",
                    style: { "background-color": "#6baed6" },
                },
                {
                    selector: "node[outDegree > 5]",
                    style: { "background-color": "#08519c" },
                },
                {
                    selector: "node.search-highlight",
                    style: {
                        "background-color": "#f97316",
                        width: 50,
                        height: 50,
                    },
                },
                {
                    selector: "edge",
                    style: {
                        width: 1,
                        "curve-style": "straight",
                        "target-arrow-shape": "triangle",
                        "line-color": "#888",
                        "target-arrow-color": "#888",
                        "arrow-scale": 1.2,
                    },
                },
            ])
            .update();
    };

    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;

        // recompute out-degree
        cy.nodes().forEach((node) => {
            const out = node.outgoers("edge").length;
            node.data("outDegree", out);
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        cy.layout({
            name: "fcose",
            nodeDimensionsIncludeLabels: true,
            nodeSeparation: 150,
            idealEdgeLength: () => 300,
            nodeRepulsion: () => 80000,
            edgeElasticity: () => 0.01,
            padding: 80,
            gravity: 0.1,
            fit: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).run();
    }, [nodes, edges]);

    useEffect(() => {
        if (!cyRef.current || !centerNodeId) return;
        const cy = cyRef.current;

        const node = cy.getElementById(centerNodeId);
        if (!node.length || node.length === 0) return;

        cy.animate(
            {
                center: { eles: node },
                zoom: Math.max(cy.zoom(), 2),
            },
            { duration: 400 }
        );
    }, [centerNodeId]);

    useEffect(() => {
        if (!cyRef.current) return;
        const cy = cyRef.current;

        // remove previous highlight
        cy.nodes(".search-highlight").removeClass("search-highlight");

        if (!highlightNodeId) return;

        const node = cy.getElementById(highlightNodeId);
        if (!node.length || node.length === 0) return;

        node.addClass("search-highlight");
    }, [highlightNodeId]);

    return (
        <CytoscapeComponent
            elements={elements}
            cy={setupGraph}
            style={{ width: "100%", height: "100%" }}
            minZoom={0.1}
            maxZoom={2}
            pixelRatio={1}
            motionBlur
            motionBlurOpacity={0.15}
        />
    );
}

export default GraphView;
