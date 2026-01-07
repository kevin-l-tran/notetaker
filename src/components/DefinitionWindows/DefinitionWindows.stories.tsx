import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";

import type { DefinitionNode } from "../../models/definitionNodes";

import DefinitionWindows, { type WindowEntry } from "./DefinitionWindows";

type Props = ComponentProps<typeof DefinitionWindows>;
type NodesEntries = [string, DefinitionNode][];
type Args = Omit<Props, "nodes"> & { nodesEntries: NodesEntries };

const DefinitionWindowsWithEntries = ({ nodesEntries, ...rest }: Args) => {
    return <DefinitionWindows {...rest} nodes={new Map(nodesEntries)} />;
};

const meta: Meta<typeof DefinitionWindowsWithEntries> = {
    title: "Layout/DefinitionWindows",
    component: DefinitionWindowsWithEntries,
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
        onFocusWindow: { action: "onFocusWindow" },
        onCloseWindow: { action: "onCloseWindow" },
        onLinkClick: { action: "onLinkClick" },
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

const nodes: DefinitionNode[] = [];
for (let i = 1; i <= 30; i++) {
    nodes.push({
        id: `node${i}`,
        label: `Definition Node ${i}`,
        aliases: [`def${i}`, `definition${i}`],
        description: `This is the description for Definition Node ${i}. Here is a link to 
            \\nodelink{def${i}}{Definition Node ${i}}. It is rendered in LaTeX: $$E=mc^2$$.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
}

export const Basic: Story = {
    args: {
        windows: [
            {
                id: "window1",
                nodeId: "node1",
                defaultPosition: { x: 50, y: 50 },
                defaultSize: { w: 400, h: 300 },
            },
        ],
        zOrder: ["window1"],
        nodesEntries: [["node1", nodes[0]] as [string, DefinitionNode]],
    },
};

export const Empty: Story = {
    args: {
        windows: [],
        zOrder: [],
        nodesEntries: [],
    },
};

export const TwoWindows: Story = {
    args: {
        windows: [
            {
                id: "window1",
                nodeId: "node1",
                defaultPosition: { x: 50, y: 50 },
                defaultSize: { w: 400, h: 300 },
            },
            {
                id: "window2",
                nodeId: "node2",
                defaultPosition: { x: 80, y: 80 },
                defaultSize: { w: 400, h: 300 },
            },
        ],
        zOrder: ["window1", "window2"],
        nodesEntries: [
            ["node1", nodes[0]],
            ["node2", nodes[1]],
        ],
    },
};

export const MissingNodeIsSkipped: Story = {
    args: {
        windows: [
            {
                id: "window1",
                nodeId: "node1",
                defaultPosition: { x: 50, y: 50 },
                defaultSize: { w: 400, h: 300 },
            },
            {
                id: "window2",
                nodeId: "node2",
                defaultPosition: { x: 80, y: 80 },
                defaultSize: { w: 400, h: 300 },
            },
        ],
        zOrder: ["window1", "window2"],
        nodesEntries: [["node1", nodes[0]]],
    },
};

export const WindowIDNotInZOrderUsesDefault: Story = {
    name: "WindowID Not In ZOrder Uses Default",
    args: {
        windows: [
            {
                id: "window1",
                nodeId: "node1",
                defaultPosition: { x: 50, y: 50 },
                defaultSize: { w: 400, h: 300 },
            },
            {
                id: "window2",
                nodeId: "node2",
                defaultPosition: { x: 80, y: 80 },
                defaultSize: { w: 400, h: 300 },
            },
        ],
        zOrder: ["window1"],
        nodesEntries: [
            ["node1", nodes[0]],
            ["node2", nodes[1]],
        ],
    },
};

export const ManyWindows: Story = {
    args: {
        windows: nodes.map((node, index) => ({
            id: `window${index + 1}`,
            nodeId: node.id,
            defaultPosition: { x: 50 + index * 15, y: 50 + index * 15 },
            defaultSize: { w: 300, h: 200 },
        })),
        zOrder: nodes.map((_, index) => `window${index + 1}`),
        nodesEntries: nodes.map((node) => [node.id, node]),
    },
};

function Harness() {
    const [windows, setWindows] = useState<WindowEntry[]>([
        {
            id: "window1",
            nodeId: nodes[0].id,
            defaultPosition: { x: 50, y: 50 },
            defaultSize: { w: 400, h: 300 },
        },
    ]);
    const [zOrder, setZOrder] = useState<string[]>(["window1"]);

    const onCloseWindow = (id: string) => {
        setWindows((ws) => ws.filter((w) => w.id !== id));
        setZOrder((zs) => zs.filter((zid) => zid !== id));
    };

    const onFocusWindow = (id: string) => {
        setZOrder((zs) => [...zs.filter((zid) => zid !== id), id]);
    };

    const onLinkClick = (
        descriptor: string,
        position?: { x: number; y: number }
    ) => {
        const node = nodes.find(
            (n) => n.label === descriptor || n.aliases.includes(descriptor)
        );
        if (node) {
            const newWindow: WindowEntry = {
                id: crypto.randomUUID(),
                nodeId: node.id,
                defaultPosition: position
                    ? { x: position.x, y: position.y }
                    : { x: 100, y: 100 },
                defaultSize: { w: 400, h: 300 },
            };
            setWindows((ws) => [...ws, newWindow]);
            setZOrder((zs) => [...zs, newWindow.id]);
        }
    };

    return (
        <DefinitionWindows
            windows={windows}
            zOrder={zOrder}
            nodes={new Map(nodes.map((n) => [n.id, n]))}
            onCloseWindow={onCloseWindow}
            onFocusWindow={onFocusWindow}
            onLinkClick={onLinkClick}
        />
    );
}

export const Interactive: Story = {
    render: () => <Harness />,
};
