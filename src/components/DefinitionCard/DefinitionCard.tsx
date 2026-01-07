import { useEffect, useRef } from "react";

import type { DefinitionDraft } from "../../models/definitionNodes";

import { mountLatex } from "../../lib/latex/renderLatex";

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

        shadowRef.current ??= host.attachShadow({ mode: "open" });
        const shadow = shadowRef.current;

        const baseURL = new URL("/latexjs/", document.baseURI).toString();
        mountLatex(shadow, draft.description, baseURL);
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
