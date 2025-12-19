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
    .node-link:focus-visible {
        outline: 2px solid #000;
        outline-offset: 2px;
    }
    `;

type Props = {
    draft: DefinitionDraft;
    onLinkClick?: (
        descriptor: string,
        position?: { x: number; y: number }
    ) => void;
};

type LatexParseError = {
    message?: string;
    location?: {
        start: { line: number; column: number };
    };
};

function isLatexParseError(e: unknown): e is LatexParseError {
    if (typeof e !== "object" || e === null) {
        return false;
    }
    
    if (!("location" in e)) {
        return false;
    }

    const location = (e as { location: unknown }).location;

    if (
        typeof location !== "object" ||
        location === null ||
        !("start" in location)
    ) {
        return false;
    }

    const start = (location as { start: unknown }).start;

    if (
        typeof start !== "object" ||
        start === null ||
        !("line" in start) ||
        !("column" in start)
    ) {
        return false;
    }

    const { line, column } = start as { line: unknown; column: unknown };

    return typeof line === "number" && typeof column === "number";
}

function DefinitionCard({ draft, onLinkClick }: Props) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const shadowRef = useRef<ShadowRoot | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        shadowRef.current ??= host.attachShadow({ mode: "open" });
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
        } catch (e: unknown) {
            const pre = document.createElement("pre");
            console.error(e);

            if (isLatexParseError(e) && e.location) {
                const { start } = e.location;
                const lines = draft.description.split(/\r?\n/);
                const lineText = lines[start.line - 1] ?? "";
                const pointer = "-".repeat(Math.max(0, start.column - 1)) + "^";

                const message =
                    "message" in e && typeof e.message === "string"
                        ? e.message
                        : JSON.stringify(e);

                pre.textContent =
                    `LaTeX parse error on line ${start.line}, column ${start.column}:\n` +
                    `${message}\n\n` +
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
            const button = (
                event.target as HTMLElement | null
            )?.closest<HTMLElement>(".node-link");
            if (!button) return;

            const descriptor = button.dataset.nodeDescriptor;
            if (!descriptor) return;

            const rect = button.getBoundingClientRect();
            const position = {
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY,
            };

            onLinkClick?.(descriptor, position);
        };

        shadow.addEventListener("click", handleClick);
        return () => {
            shadow.removeEventListener("click", handleClick);
        };
    }, [draft.description, onLinkClick]);

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
