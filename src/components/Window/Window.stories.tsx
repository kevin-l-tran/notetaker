import type { Meta, StoryObj } from "@storybook/react-vite";

import Window from "./Window";

const meta: Meta<typeof Window> = {
    title: "Layout/Window",
    component: Window,
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
        onClose: { action: "onClose" },
        onFocus: { action: "onFocus" },
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

export const Basic: Story = {
    args: {
        title: "Window Title Here",
        defaultPosition: { x: 80, y: 80 },
        defaultSize: { w: 520, h: 420 },
        zIndex: 1,
        children: (
            <div style={{ padding: 12 }}>
                <p>Put any content here.</p>
                <p>
                    Try dragging the header and resizing from the bottom-right.
                </p>
            </div>
        ),
    },
};

export const Inactive: Story = {
    args: {
        title: "Inactive window (click to focus)",
        defaultPosition: { x: 80, y: 80 },
        defaultSize: { w: 600, h: 420 },
        zIndex: 1,
        isActive: false,
        children: (
            <div style={{ padding: 12 }}>
                <p>Click me to trigger onFocus.</p>
            </div>
        ),
    },
};
