import { useRef } from "react";

import type { DefinitionNode } from "../../models/definitionNodes";

type GraphToolbarProps = {
    onSave: () => void;
    onLoadExample: () => void;
    onLoadJson: (json: Record<string, DefinitionNode>) => void;
    onOpenCreate: () => void;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    onSearch: () => void;
    searchNotFound: boolean;
};

function GraphToolbar({
    onSave,
    onLoadExample,
    onLoadJson,
    onOpenCreate,
    searchTerm,
    onSearchTermChange,
    onSearch,
    searchNotFound,
}: GraphToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const triggerFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
        event
    ) => {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== "string") return;
            try {
                const parsed = JSON.parse(text) as Record<
                    string,
                    DefinitionNode
                >;
                onLoadJson(parsed);
            } catch (err) {
                console.error("Failed to parse graph JSON", err);
            } finally {
                input.value = "";
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ display: "flex" }}>
            <button className="button" style={{ flexGrow: 1 }} onClick={onSave}>
                Save Graph Locally
            </button>
            <button
                className="button"
                style={{ flexGrow: 1 }}
                onClick={triggerFilePicker}
            >
                Load Graph From File
            </button>
            <button
                className="button"
                style={{ flexGrow: 1 }}
                onClick={onLoadExample}
            >
                Load Example Graph
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            <button
                className="button"
                style={{ flexGrow: 1 }}
                onClick={onOpenCreate}
            >
                Add New Definition
            </button>
            <input
                className="input"
                style={{
                    flexGrow: 0.5,
                    marginRight: 8,
                    border: "1px solid transparent",
                    borderRadius: "10px",
                    padding: "10px",
                    paddingLeft: "20px",
                    backgroundColor: searchNotFound ? "#999a9cff" : "#d3d5daff",
                }}
                placeholder="Search title or alias..."
                value={searchTerm}
                onChange={(e) => {
                    onSearchTermChange(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                }}
            />
        </div>
    );
}

export default GraphToolbar;
