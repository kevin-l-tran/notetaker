import type { Meta, StoryObj } from "@storybook/react-vite";

import DefinitionEditorForm from "./DefinitionEditorForm";

const meta: Meta<typeof DefinitionEditorForm> = {
    title: "Editors/DefinitionEditorForm",
    component: DefinitionEditorForm,
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
        onSubmit: { action: "onSubmit" },
        onClose: { action: "onCancel" },
        autoLinkGenerate: { action: "autoLinkGenerate" },
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
        open: true,
        mode: "create",
    },
};

export const EditMode: Story = {
    args: {
        open: true,
        mode: "edit",
        initialDraft: {
            label: "Editing",
            aliases: ["edit", "edt"],
            description: String.raw`This editor is now in edit mode.`,
        },
    },
};

export const DuplicateAliases: Story = {
    args: {
        open: true,
        mode: "edit",
        initialDraft: {
            label: "Duplicate Aliases",
            aliases: ["duplicate", "alias", "duplicate"],
            description: String.raw`This editor has duplicate aliases.`,
        },
    },
};
