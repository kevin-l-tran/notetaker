import type { Meta, StoryObj } from "@storybook/react-vite";

import GraphView from "./GraphView";

const meta: Meta<typeof GraphView> = {
    title: "Node Graph/GraphView",
    component: GraphView,
    parameters: {
        layout: "fullscreen",
        docs: {
            story: {
                inline: false,
                iframeHeight: 520,
            },
        },
    },
    argTypes: {
        onNodeContextMenu: { action: "onNodeContextMenu" },
        onNodeDoubleTap: { action: "onNodeDoubleTap" },
    },
    decorators: [
        (Story) => (
            <div
                style={{
                    position: "relative",
                    width: "100vw",
                    height: "100vh",
                    background: "#f1f5f9",
                    overflow: "hidden",
                }}
            >
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const nodes = [];
for (let i = 1; i <= 20; i++) {
    nodes.push({ id: i.toString(), label: `Node ${i}` });
}

const edges = [];
for (let i = 1; i <= 20; i++) {
    for (let j = 1; j <= 20; j++) {
        edges.push({
            id: `edge${i}-${j}`,
            source: i.toString(),
            target: j.toString(),
        });
    }
}

export const Basic: Story = {
    args: {
        nodes,
        edges: edges.filter(() => Math.random() < 0.1),
    },
};

export const Empty: Story = {
    args: {
        nodes: [],
        edges: [],
    },
};

export const OutDegreeBuckets: Story = {
    args: {
        nodes: nodes.slice(0, 7),
        edges: [
            { id: "edge1-2", source: "1", target: "2" },
            { id: "edge1-3", source: "1", target: "3" },
            { id: "edge1-4", source: "1", target: "4" },
            { id: "edge1-5", source: "1", target: "5" },
            { id: "edge1-6", source: "1", target: "6" },
            { id: "edge1-7", source: "1", target: "7" },
            { id: "edge2-3", source: "2", target: "3" },
            { id: "edge2-4", source: "2", target: "4" },
            { id: "edge2-5", source: "2", target: "5" },
        ]
    },
};

export const HighlightNode: Story = {
    args: {
        nodes,
        edges: edges.filter(() => Math.random() < 0.1),
        highlightNodeId: "10",
    },
};

export const CenterNode: Story = {
    args: {
        nodes,
        edges: edges.filter(() => Math.random() < 0.1),
        centerNodeId: "15",
    },
}