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

    const MENU_WIDTH = 140;
    const MENU_HEIGHT = 2 * 32;
    const PADDING = 4;

    const top = Math.min(
        state.clientY,
        window.innerHeight - MENU_HEIGHT - PADDING
    );
    const left = Math.min(
        state.clientX,
        window.innerWidth - MENU_WIDTH - PADDING
    );

    return (
        <div
            role="menu"
            aria-label="Node actions"
            style={{
                position: "fixed",
                top,
                left,
                background: "white",
                border: "1px solid #ccc",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 1000,
            }}
            onClick={(e) => {
                e.stopPropagation();
            }}
            onContextMenu={(e) => {
                e.preventDefault();
            }}
        >
            <button
                type="button"
                role="menuitem"
                style={{
                    display: "block",
                    padding: "4px 12px",
                    width: "100%",
                }}
                onClick={() => {
                    onEdit(state.nodeId);
                }}
            >
                Edit
            </button>
            <button
                type="button"
                role="menuitem"
                style={{
                    display: "block",
                    padding: "4px 12px",
                    width: "100%",
                }}
                onClick={() => {
                    onDelete(state.nodeId);
                }}
            >
                Delete
            </button>
        </div>
    );
}

export default GraphContextMenu;
