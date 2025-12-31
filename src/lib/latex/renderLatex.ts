import { HtmlGenerator, parse } from "latex.js";

import NodeLinkMacros from "./nodeLinkMacros";

const LATEXJS_ASSETS_MARKER_ID = "latexjs-assets-installed";
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

/**
 * Installs latex.js assets (CSS/JS) into the ShadowRoot once, plus our CSS overrides.
 *
 * Idempotency:
 * - If the marker element is present, this function exits early.
 *
 * Ordering:
 * - We `prepend` so assets/styles appear before the rendered content (generally safer
 *   for layout and font loading).
 */
function installLatexAssets(
    container: ShadowRoot,
    generator: HtmlGenerator,
    baseURL: string
) {
    if (container.getElementById(LATEXJS_ASSETS_MARKER_ID)) return;

    const assetsFrag = generator.stylesAndScripts(baseURL);

    const overrideStyle = document.createElement("style");
    overrideStyle.textContent = OVERRIDE_CSS;

    const marker = document.createElement("span");
    marker.id = LATEXJS_ASSETS_MARKER_ID;
    marker.style.display = "none";

    container.prepend(overrideStyle);
    container.prepend(assetsFrag);
    container.prepend(marker);
}

export type LatexDomBuildResult = { ok: true } | { ok: false; error: unknown };

/**
 * Parses LaTeX and mounts the resulting DOM into the given ShadowRoot.
 *
 * Behavior:
 * - Ensures a single host element exists inside the ShadowRoot:
 *   <div id="latex-container" class="latex-root" />
 * - Replaces the host element’s children with either:
 *   - the rendered LaTeX DOM fragment (success), or
 *   - a <pre> containing error details (failure).
 * - Installs latex.js styles/scripts into the ShadowRoot once (on first call).
 *
 * @param container ShadowRoot where the LaTeX output should be mounted.
 * @param latex LaTeX source string to parse.
 * @param baseURL Optional base URL for latex.js assets. Defaults to "/latexjs/" on the current origin.
 *
 * @returns LatexDomBuildResult indicating success or failure.
 */
export function mountLatex(
    container: ShadowRoot,
    latex: string,
    baseURL?: string
): LatexDomBuildResult {
    baseURL ??= new URL("/latexjs/", window.location.origin).toString();

    let host = container.getElementById("latex-container");
    if (!host) {
        host = document.createElement("div");
        host.id = "latex-container";
        host.className = "latex-root";
        container.appendChild(host);
    }

    try {
        const generator = new HtmlGenerator({
            CustomMacros: NodeLinkMacros,
            hyphenate: false,
        });
        parse(latex, { generator });

        // LaTeX assets must be generated after parsing
        installLatexAssets(container, generator, baseURL);

        const contentFrag = generator.domFragment();

        host.replaceChildren(contentFrag);
        return { ok: true };
    } catch (e: unknown) {
        const pre = document.createElement("pre");
        console.error(e);

        if (isLatexParseError(e) && e.location) {
            const { start } = e.location;
            const lines = latex.split(/\r?\n/);
            const lineText = lines[start.line - 1] ?? "";
            const pointer = " ".repeat(Math.max(0, start.column - 1)) + "^";

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

        host.replaceChildren(pre);
        return { ok: false, error: e };
    }
}
