type ContextMenuState = {
    nodeId: string;
    clientX: number;
    clientY: number;
} | null;

type ContextMenuProps = {
    state: ContextMenuState;
    onEdit: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
};

function GraphContextMenu({ state, onEdit, onDelete }: ContextMenuProps) {
    if (!state) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: state.clientY,
                left: state.clientX,
                background: "white",
                border: "1px solid #ccc",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            <button
                type="button"
                style={{
                    display: "block",
                    padding: "4px 12px",
                    width: "100%",
                }}
                onClick={() => onEdit(state.nodeId)}
            >
                Edit
            </button>
            <button
                type="button"
                style={{
                    display: "block",
                    padding: "4px 12px",
                    width: "100%",
                }}
                onClick={() => onDelete(state.nodeId)}
            >
                Delete
            </button>
        </div>
    );
}

export default GraphContextMenu;
