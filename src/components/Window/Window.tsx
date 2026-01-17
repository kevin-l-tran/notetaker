import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
    title: string;
    children: React.ReactNode;
    defaultPosition: {
        x: number;
        y: number;
    };
    defaultSize: {
        w: number;
        h: number;
    };
    onClose?: () => void;
    zIndex?: number;
    onFocus?: () => void;
    isActive?: boolean;
};

function Window({
    title,
    children,
    defaultPosition,
    defaultSize,
    onClose,
    zIndex = 1,
    onFocus,
    isActive = true,
}: Props) {
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const sizeRef = useRef<{ w: number; h: number }>(defaultSize);
    const [position, setPosition] = useState<{ x: number; y: number }>(
        defaultPosition
    );
    const [size, setSize] = useState<{ w: number; h: number }>(defaultSize);
    const [isMinimized, setIsMinimized] = useState(false);

    // --- Dragging logic ----------------------------------------------------
    const onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isActive) onFocus?.();
        e.stopPropagation();
        isDragging.current = true;
        mousePos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        document.body.style.cursor = "move";
    };

    const onDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        const x = Math.min(
            Math.max(0, e.clientX - mousePos.current.x),
            window.innerWidth - 40
        );
        const y = Math.min(
            Math.max(0, e.clientY - mousePos.current.y),
            window.innerHeight - 40
        );
        setPosition({ x, y });
    }, []);

    const onDragEnd = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        document.body.style.cursor = "";
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);
        return () => {
            window.removeEventListener("mousemove", onDragMove);
            window.removeEventListener("mouseup", onDragEnd);
            isDragging.current = false;
            document.body.style.cursor = "";
        };
    }, [onDragMove, onDragEnd]);

    // --- Resizing logic ----------------------------------------------------
    const onResizeStart = (e: React.MouseEvent) => {
        if (isMinimized) return;
        if (!isActive) onFocus?.();
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        sizeRef.current = { ...size };
        mousePos.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = "nwse-resize";
    };

    const onResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const dx = e.clientX - mousePos.current.x;
        const dy = e.clientY - mousePos.current.y;
        const w = Math.min(
            window.innerWidth - 40,
            Math.max(400, sizeRef.current.w + dx)
        );
        const h = Math.min(
            window.innerHeight - 40,
            Math.max(300, sizeRef.current.h + dy)
        );
        setSize({ w, h });
    }, []);

    const onResizeEnd = useCallback(() => {
        if (!isResizing.current) return;
        isResizing.current = false;
        document.body.style.cursor = "";
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onResizeMove);
        window.addEventListener("mouseup", onResizeEnd);
        return () => {
            window.removeEventListener("mousemove", onResizeMove);
            window.removeEventListener("mouseup", onResizeEnd);
            isResizing.current = false;
            document.body.style.cursor = "";
        };
    }, [onResizeMove, onResizeEnd]);

    // ------ header actions -------------------------------------------------
    const toggleMinimize = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized((prev) => !prev);
    };

    const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClose?.();
    };

    // ------ focus actions --------------------------------------------------
    const handleRootMouseDown = () => {
        if (!isActive) onFocus?.();
    };

    return (
        <div
            onMouseDown={handleRootMouseDown}
            style={{
                position: "absolute",
                left: position.x,
                top: position.y,
                width: isMinimized ? "max-content" : size.w,
                height: isMinimized ? "auto" : size.h,
                border: "2px solid #0f172a",
                borderRadius: 8,
                backgroundColor: "white",
                boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                pointerEvents: "auto",
                zIndex: zIndex,
            }}
        >
            {/* header / drag handle */}
            <div
                onMouseDown={onDragStart}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderBottom: "1px solid #cbd5e1",
                    backgroundColor: isActive ? "#f8fafc" : "#e2e8f0",
                    cursor: "move",
                    userSelect: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0f172a",
                }}
            >
                <span style={{ marginRight: "40px" }}>{title}</span>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "default",
                    }}
                >
                    <button
                        type="button"
                        aria-label={
                            isMinimized ? "Restore window" : "Minimize window"
                        }
                        onClick={toggleMinimize}
                        style={{
                            border: "none",
                            background: "transparent",
                            width: 22,
                            height: 22,
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 16,
                            lineHeight: 1,
                            color: "#64748b",
                        }}
                    >
                        {isMinimized ? "+" : "–"}
                    </button>

                    <button
                        type="button"
                        aria-label="Close window"
                        onClick={handleClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            width: 22,
                            height: 22,
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 16,
                            lineHeight: 1,
                            color: "#64748b",
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* body */}
            {!isMinimized && (
                <div
                    style={{
                        flex: 1,
                        overflow: "auto",
                        pointerEvents: "auto",
                    }}
                >
                    {children}
                </div>
            )}

            {/* resize handle */}
            {!isMinimized && (
                <div
                    onMouseDown={onResizeStart}
                    aria-label="Resize popup"
                    role="button"
                    style={{
                        position: "absolute",
                        right: 8,
                        bottom: 8,
                        width: 18,
                        height: 18,
                        cursor: "nwse-resize",
                        opacity: 0.7,
                        background:
                            "linear-gradient(135deg, transparent 0 40%, #cbd5e1 40% 60%, transparent 60% 100%)",
                    }}
                />
            )}
        </div>
    );
}

export default Window;
