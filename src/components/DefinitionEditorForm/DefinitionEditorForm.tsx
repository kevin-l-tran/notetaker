import React, { useCallback, useEffect, useRef, useState } from "react";

import type { ChangeNodeError } from "../../hooks/useDefinitionStore";
import type {
    DefinitionDraft,
    DefinitionNode,
} from "../../models/definitionNodes";

import LatexEditor from "../LatexEditor";
import DefinitionCard from "../DefinitionCard";

import "./DefinitionEditorForm.css";

type Mode = "create" | "edit";
type Props = {
    open: boolean;
    mode: Mode;
    initialDraft?: DefinitionDraft;
    onClose: () => void;
    onSubmit: (
        data: DefinitionDraft
    ) =>
        | { ok: true; value: DefinitionNode }
        | { ok: false; error: ChangeNodeError };
    autoLinkGenerate: (draft: DefinitionDraft) => string;
};

const DEFAULT_DESCRIPTION =
    "\\documentclass{article}\n\\begin{document}\n  Enter your description here!\n\\end{document}";

function DefinitionEditorForm({
    open,
    mode,
    initialDraft,
    onClose,
    onSubmit,
    autoLinkGenerate,
}: Props) {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    const [label, setLabel] = useState<string>(() => {
        if (mode === "edit" && initialDraft) return initialDraft.label;
        return "New Definition";
    });

    const [aliases, setAliases] = useState<string[]>(() => {
        if (mode === "edit" && initialDraft) {
            return initialDraft.aliases.length > 0
                ? initialDraft.aliases
                : [""];
        }
        return [""];
    });

    const [description, setDescription] = useState<string>(() => {
        if (mode === "edit" && initialDraft) return initialDraft.description;
        return DEFAULT_DESCRIPTION;
    });

    const trimmedLabel = label.trim();
    const trimmedAliases = aliases
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

    const draftNode = {
        id: mode === "edit" ? initialDraft?.id : undefined,
        label: trimmedLabel,
        aliases: trimmedAliases,
        description,
    };

    const [labelError, setLabelError] = useState<string | null>(null);
    const [aliasErrors, setAliasErrors] = useState<Map<string, string>>(
        new Map()
    );

    const [islabelFormCollapsed, setIsLabelFormCollapsed] = useState(false);
    const [splitPercent, setSplitPercent] = useState<number>(50);

    const handleSubmit = () => {
        setLabelError(null);
        setAliasErrors(new Map());

        if (!trimmedLabel) {
            setLabelError("label cannot be empty.");
            return;
        }

        const newAliasErrors = new Map<string, string>();
        const normalizedAliases = trimmedAliases.map((a) => a.toLowerCase());
        normalizedAliases.forEach((a) => {
            if (!a) return;
            const first = normalizedAliases.indexOf(a);
            const last = normalizedAliases.lastIndexOf(a);
            if (first !== last) {
                newAliasErrors.set(a, "This alias is a duplicate.");
            }
        });

        if (newAliasErrors.size > 0) {
            setAliasErrors(newAliasErrors);
            return;
        }

        const ok = window.confirm(
            mode === "create"
                ? "Are you sure you want to save this definition?"
                : "Are you sure you want to update this definition?"
        );
        if (!ok) return;

        const result = onSubmit(draftNode);

        if (result.ok) {
            if (mode === "create") {
                setLabel("New Definition");
                setAliases([""]);
                setDescription(DEFAULT_DESCRIPTION);
            }
            onClose();
        } else {
            if (result.error.type === "label taken") {
                setLabelError(
                    "A definition with this label/alias already exists."
                );
            } else if (result.error.type === "aliases taken") {
                const takenAliases = result.error.aliases.map((a) =>
                    a.trim().toLowerCase()
                );

                takenAliases.forEach((alias) => {
                    newAliasErrors.set(
                        alias,
                        "A definition with this label/alias already exists."
                    );
                });

                setAliasErrors(newAliasErrors);
            }
            return;
        }
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    const handleBackdrop = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    // --- Alias form logic --------------------------------------------------
    const handleAliasChange = (index: number, value: string) => {
        setAliases((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const addAliasField = () => {
        setAliases((prev) => [...prev, ""]);
    };

    const removeAliasField = (index: number) => {
        setAliases((prev) => prev.filter((_, i) => i !== index));
    };

    // --- Splitter logic -----------------------------------------------------
    const draggingRef = useRef(false);

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        draggingRef.current = true;
        document.body.style.cursor = "col-resize";
    };
    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingRef.current || !modalRef.current) return;
        const rect = modalRef.current.getBoundingClientRect();
        const x = Math.max(
            rect.left + 150,
            Math.min(e.clientX, rect.right - 150)
        );
        const pct = ((x - rect.left) / rect.width) * 100;
        setSplitPercent(Math.max(20, Math.min(80, pct)));
    }, []);

    const onMouseUp = useCallback(() => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        document.body.style.cursor = "";
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            draggingRef.current = false;
            document.body.style.cursor = "";
        };
    }, [onMouseMove, onMouseUp]);

    // --- Popup resizer (bottom-right handle) -------------------------------
    const resizingRef = useRef(false);
    const sizeRef = useRef<{ w: number; h: number } | null>(null);
    const startRef = useRef<{ x: number; y: number } | null>(null);

    const [modalSize, setModalSize] = useState<{ w: number; h: number }>(() => {
        if (typeof window === "undefined") {
            return { w: 1100, h: 700 };
        }
        return {
            w: Math.min(window.innerWidth - 80, 1100),
            h: Math.min(window.innerHeight - 80, 700),
        };
    });

    const onResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        resizingRef.current = true;
        sizeRef.current = { ...modalSize };
        startRef.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = "nwse-resize";
    };

    const onResizeMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current || !sizeRef.current || !startRef.current)
            return;
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        const w = Math.min(
            window.innerWidth - 40,
            Math.max(640, sizeRef.current.w + 2 * dx)
        );
        const h = Math.min(
            window.innerHeight - 40,
            Math.max(480, sizeRef.current.h + 2 * dy)
        );
        setModalSize({ w, h });
    }, []);

    const onResizeEnd = useCallback(() => {
        if (!resizingRef.current) return;
        resizingRef.current = false;
        document.body.style.cursor = "";
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onResizeMove);
        window.addEventListener("mouseup", onResizeEnd);
        return () => {
            window.removeEventListener("mousemove", onResizeMove);
            window.removeEventListener("mouseup", onResizeEnd);
            resizingRef.current = false;
            document.body.style.cursor = "";
        };
    }, [onResizeMove, onResizeEnd]);

    if (!open) return null;

    return (
        <div
            ref={overlayRef}
            onMouseDown={handleBackdrop}
            className="editor-overlay"
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="definition-editor-title"
                className="editor-modal"
                style={{ width: modalSize.w, height: modalSize.h }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
            >
                {/* Header */}
                <div className="editor-modal-header">
                    <div
                        id="definition-editor-title"
                        className="editor-modal-label"
                    >
                        {mode === "create"
                            ? "Create a Definition"
                            : "Edit a Definition"}
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="editor-modal-close"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <form
                    className="editor-modal-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <div className="editor-modal-content">
                        {/* Left panel */}
                        <div
                            className="editor-left-panel"
                            style={{ width: `${splitPercent}%` }}
                        >
                            {/* Collapsible header */}
                            <div
                                className="editor-form-toggle"
                                onClick={() => {
                                    setIsLabelFormCollapsed((v) => !v);
                                }}
                            >
                                <span
                                    className="editor-form-arrow"
                                    style={{
                                        transform: islabelFormCollapsed
                                            ? "rotate(-90deg)"
                                            : "rotate(0deg)",
                                    }}
                                >
                                    ▾
                                </span>
                            </div>

                            {/* Collapsible form body */}
                            {!islabelFormCollapsed && (
                                <div className="editor-form-body">
                                    <div className="editor-form-group">
                                        <label
                                            className="editor-label"
                                            htmlFor="definition-label-input"
                                        >
                                            Label
                                        </label>
                                        <input
                                            id="definition-label-input"
                                            value={label}
                                            onChange={(e) => {
                                                setLabel(e.target.value);
                                            }}
                                            className="editor-input"
                                        />
                                        {labelError && (
                                            <div className="editor-error">
                                                {labelError}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <fieldset className="editor-aliases">
                                            <legend className="editor-label">
                                                Aliases
                                            </legend>
                                            {aliases.map((alias, index) => {
                                                const normalized = alias
                                                    .trim()
                                                    .toLowerCase();
                                                const error = normalized
                                                    ? aliasErrors.get(
                                                          normalized
                                                      )
                                                    : null;

                                                return (
                                                    <div key={index}>
                                                        <div className="editor-alias-row">
                                                            <input
                                                                value={alias}
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    handleAliasChange(
                                                                        index,
                                                                        e.target
                                                                            .value
                                                                    );
                                                                }}
                                                                placeholder={`Alias ${
                                                                    index + 1
                                                                }`}
                                                                className="editor-input"
                                                                aria-label={`Alias ${
                                                                    index + 1
                                                                }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    removeAliasField(
                                                                        index
                                                                    );
                                                                }}
                                                                className="editor-alias-remove"
                                                                aria-label={`Remove alias ${
                                                                    index + 1
                                                                }`}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                        {error && (
                                                            <div className="editor-error">
                                                                {error}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={addAliasField}
                                                className="editor-alias-add"
                                            >
                                                + Add alias
                                            </button>
                                        </fieldset>
                                    </div>
                                </div>
                            )}

                            <label
                                id="definition-description-label"
                                className="editor-label editor-label--sr-only"
                            >
                                Description
                            </label>
                            <LatexEditor
                                description={description}
                                onChange={setDescription}
                                ariaLabelledBy="definition-description-label"
                            />
                        </div>

                        {/* Divider */}
                        <div
                            className="editor-splitter"
                            onMouseDown={onMouseDown}
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize panels"
                        />

                        {/* Right panel */}
                        <div className="editor-right-panel">
                            <div className="editor-preview-card">
                                <DefinitionCard draft={draftNode} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="editor-modal-footer">
                        <button
                            type="button"
                            onClick={() => {
                                setDescription(autoLinkGenerate(draftNode));
                            }}
                            className="editor-secondary-button"
                        >
                            Generate Links
                        </button>
                        <button type="submit" className="editor-primary-button">
                            {mode === "create"
                                ? "Save Definition"
                                : "Update Definition"}
                        </button>
                    </div>
                </form>

                {/* Resize handle */}
                <div
                    onMouseDown={onResizeStart}
                    aria-label="Resize popup"
                    className="editor-resize-handle"
                />
            </div>
        </div>
    );
}

export default DefinitionEditorForm;
