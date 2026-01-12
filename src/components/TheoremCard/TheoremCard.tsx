import { useEffect, useRef } from "react";

import type { TheoremDraft } from "../../models/theoremNodes";

import { mountLatex } from "../../lib/latex/renderLatex";

type Props = {
    draft: TheoremDraft;
    onLinkClick?: (
        descriptor: string,
        position?: { x: number; y: number }
    ) => void;
};

function buildHeading(draft: TheoremDraft) {
    const name = draft.title?.trim();
    const number = draft.number?.trim();

    if (number && name) return `${draft.type} ${number}: ${name}`;
    if (number) return `${draft.type} ${number}`;
    return `${draft.type}: ${name}`;
}

function TheoremCard({ draft, onLinkClick }: Props) {
    const catchphraseHostRef = useRef<HTMLDivElement | null>(null);
    const catchphraseShadowRef = useRef<ShadowRoot | null>(null);
    const statementHostRef = useRef<HTMLDivElement | null>(null);
    const statementShadowRef = useRef<ShadowRoot | null>(null);

    const heading = buildHeading(draft);

    useEffect(() => {
        if (!draft.catchphrase) return;

        const host = catchphraseHostRef.current;
        if (!host) return;

        catchphraseShadowRef.current ??= host.attachShadow({ mode: "open" });
        const shadow = catchphraseShadowRef.current;

        const baseURL = new URL("/latexjs/", document.baseURI).toString();

        const formattedCatchphrase = "\\emph{(" + draft.catchphrase + ")}";
        mountLatex(shadow, formattedCatchphrase, baseURL);
    }, [draft.catchphrase]);

    useEffect(() => {
        const host = statementHostRef.current;
        if (!host) return;

        statementShadowRef.current ??= host.attachShadow({ mode: "open" });
        const shadow = statementShadowRef.current;

        const baseURL = new URL("/latexjs/", document.baseURI).toString();
        mountLatex(shadow, draft.statement, baseURL);
    }, [draft.statement]);

    useEffect(() => {
        const shadow = statementShadowRef.current;
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
    }, [draft.statement, onLinkClick]);

    return (
        <>
            <div style={{ boxSizing: "border-box", margin: 40 }}>
                <h2
                    style={{ margin: 0, fontSize: "36px", textAlign: "center" }}
                >
                    {heading}
                </h2>

                {draft.catchphrase ? (
                    <div ref={catchphraseHostRef}
                        style={{
                            margin: 0,
                            fontSize: "18px",
                            textAlign: "center",
                        }}
                    >
                    </div>
                ) : null}

                <hr style={{ marginBlock: 20 }} />
                <div ref={statementHostRef} style={{ width: "100%" }} />
            </div>
        </>
    );
}

export default TheoremCard;
