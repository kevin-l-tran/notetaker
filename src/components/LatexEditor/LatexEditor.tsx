import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
    EditorView,
    highlightActiveLine,
    keymap,
    lineNumbers,
} from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { minimalSetup } from "codemirror";
import { latex } from "codemirror-lang-latex";
import { foldGutter } from "@codemirror/language";
import { acceptCompletion } from "@codemirror/autocomplete";

type Props = {
    description?: string;
    onChange?: (description: string) => void;
    ariaLabelledBy?: string;
};

function LatexEditor({
    description = "\\documentclass{article}\n\\begin{document}\nEnter your description here!\n\\end{document}",
    onChange,
    ariaLabelledBy,
}: Props) {
    const host = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef<Props["onChange"]>(null);
    const initialDocRef = useRef(description);

    useEffect(() => {
        if (!host.current) return;

        const fullSize = EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { overflow: "auto" },
        });

        const updateListener = EditorView.updateListener.of((u) => {
            if (u.docChanged) {
                const text = u.state.doc.toString();
                onChangeRef.current?.(text);
            }
        });

        const contentA11y = EditorView.contentAttributes.of(
            ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {}
        );

        const state = EditorState.create({
            doc: initialDocRef.current,
            extensions: [
                contentA11y,
                minimalSetup,
                fullSize,
                updateListener,
                EditorView.lineWrapping,
                highlightActiveLine(),
                lineNumbers(),
                foldGutter(),
                latex(),
                keymap.of([
                    { key: "Tab", run: acceptCompletion },
                    indentWithTab,
                ]),
            ],
        });

        const view = new EditorView({ state, parent: host.current });
        viewRef.current = view;

        return () => {
            viewRef.current = null;
            view.destroy();
        };
    }, [ariaLabelledBy]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        if (description !== current) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: description,
                },
            });
        }
    }, [description]);

    return (
        <div
            style={{
                width: "100%",
                flex: 1,
                minHeight: 0,
            }}
            ref={host}
        ></div>
    );
}

export default LatexEditor;
