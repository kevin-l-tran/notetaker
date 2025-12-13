import { HtmlGenerator, parse } from "latex.js";
import { useEffect, useRef } from "react";

import type { DefinitionDraft } from "../../models/definitionNodes";

import NodeLinkMacros from "../../lib/latex/nodeLinkMacros";

const OVERRIDE_CSS = `
    .latex-root {
        font-family: 'LM Roman 10','Latin Modern Roman','Computer Modern Serif',serif;
        font-size: 18px;
        color: black;
        line-height: 1.2;
    }
    .latex-root p { margin: 0 0 1.2em; text-indent: 0; }
    .latex-root ul { margin: 1em 0; padding-left: 2.5em; }
    .latex-root li { margin: .6em 0; }
    .katex { font-size: 18px; }
    .node-link {
        font-size: 100%;
        font-family: inherit;
        border: 0;
        background: yellow;
        padding: 0;
        cursor: pointer;
    }
    `;

type Props = {
    draft: DefinitionDraft;
    onLinkClick?: (
        descriptor: string,
        position?: { x: number; y: number }
    ) => void;
};

function DefinitionCard({ draft, onLinkClick }: Props) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const shadowRef = useRef<ShadowRoot | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        if (!shadowRef.current) {
            shadowRef.current = host.attachShadow({ mode: "open" });
        }
        const shadow = shadowRef.current;

        while (shadow.firstChild) shadow.removeChild(shadow.firstChild);

        try {
            const generator = new HtmlGenerator({
                CustomMacros: NodeLinkMacros,
                hyphenate: false,
            });
            parse(draft.description, { generator });

            const baseURL = new URL(
                "/latexjs/",
                window.location.origin
            ).toString();
            const assetsFrag = generator.stylesAndScripts(baseURL);
            shadow.appendChild(assetsFrag);

            const style = document.createElement("style");
            style.textContent = OVERRIDE_CSS;
            shadow.appendChild(style);

            const contentFrag = generator.domFragment();
            const page = document.createElement("div");
            page.className = "latex-root";
            page.appendChild(contentFrag);
            shadow.appendChild(page);
        } catch (e: any) {
            const pre = document.createElement("pre");
            console.error(e);
            if ((e as any).location) {
                const { start } = e.location;
                const lines = draft.description.split(/\r?\n/);
                const lineText = lines[start.line - 1] ?? "";
                const pointer = "-".repeat(Math.max(0, start.column - 1)) + "^";

                pre.textContent =
                    `LaTeX parse error on line ${start.line}, column ${start.column}:\n` +
                    `${e.message}\n\n` +
                    lineText +
                    "\n" +
                    pointer;
            } else {
                pre.textContent = String(e);
            }

            shadow.appendChild(pre);
        }
    }, [draft.description]);

    useEffect(() => {
        const shadow = shadowRef.current;
        if (!shadow) return;

        const handleClick: EventListener = (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const button = target.closest<HTMLElement>(".node-link");
            if (!button) return;

            const descriptor = button.dataset.nodeDescriptor;
            console.log(descriptor);
            if (!descriptor) return;

            const rect = target.getBoundingClientRect();
            const position = {
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY,
            };

            onLinkClick?.(descriptor, position);
        };

        shadow.addEventListener("click", handleClick);
        return () => shadow.removeEventListener("click", handleClick);
    }, [onLinkClick]);

    return (
        <>
            <div style={{ boxSizing: "border-box", margin: 40 }}>
                <h2
                    style={{ margin: 0, fontSize: "36px", textAlign: "center" }}
                >
                    {draft.label}
                </h2>
                <p style={{ margin: 0, fontSize: "18px", textAlign: "center" }}>
                    <i>{draft.aliases.join(", ")}</i>
                </p>
                <hr style={{ marginBlock: 20 }} />
                <div ref={hostRef} style={{ width: "100%" }}></div>
            </div>
        </>
    );
}

export default DefinitionCard;
