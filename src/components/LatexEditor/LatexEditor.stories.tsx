import type { Meta, StoryObj } from "@storybook/react-vite";

import LatexEditor from "./LatexEditor";

const meta: Meta<typeof LatexEditor> = {
    title: "Editors/LatexEditor",
    component: LatexEditor,
    decorators: [
        (Story) => (
            <div
                style={{
                    height: "400px",
                    width: "600px",
                    border: "1px solid #ccc",
                    overflow: "auto",
                }}
            >
                <Story />
            </div>
        ),
    ],
    argTypes: {
        onChange: { action: "onChange" },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const LongContent: Story = {
    args: {
        description: Array(20)
            .fill(
                Array(20)
                    .fill(String.raw`this is gonna be a very long line.`)
                    .join(" ")
            )
            .join("\n"),
    },
};
