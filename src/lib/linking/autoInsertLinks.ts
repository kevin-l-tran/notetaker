import type { NodeId } from "../../models/nodes";
import type { AhoCorasick } from "./ahoCorasick";

import buildAC from "./buildAC";
import getIncomingMatches from "./getEdges";
import { hasWordBoundaries, pickNonOverlapping } from "./acFilters";

const LATEX_COMMAND_RE = /\\[a-zA-Z]+(?:\s*\{[^{}]*\})*/g;
function maskNodelinks(text: string): string {
    return text.replace(LATEX_COMMAND_RE, (m) => " ".repeat(m.length));
}

/**
 * Automatically insert `\nodelink{key}{visible}` macros into `text`.
 *
 * Behavior:
 * - Uses an Aho–Corasick automaton over `terms` to find candidate matches.
 * - Ignores matches that:
 *   - fall inside LaTeX commands (via masking),
 *   - are not surrounded by word boundaries,
 *   - overlap with other chosen matches,
 *   - would produce a duplicate link to a node already linked in `text`,
 *   - would create a self-link (`termId === id`).
 * - For each accepted match, wraps the original substring in a `\nodelink`
 *   macro, reusing the matched term as the macro key.
 *
 * Parameters:
 * - `id`: id of the node whose description is being processed.
 * - `text`: original description text.
 * - `terms`: map from normalized term → node id.
 * - `ac`: optional prebuilt Aho–Corasick automaton; if omitted,
 *   one is built from `terms`.
 */
export default function autoInsertLinks(
    id: NodeId,
    text: string,
    terms: Map<string, NodeId>,
    ac: AhoCorasick<NodeId> = buildAC(terms)
): string {
    const masked = maskNodelinks(text);
    const rawMatches = ac.search(masked);
    const bounded = rawMatches.filter((m) =>
        hasWordBoundaries(masked, m.start, m.end)
    );
    const chosen = pickNonOverlapping(bounded);
    chosen.sort((a, b) => a.start - b.start);

    const ids = new Set<NodeId>();
    const currentLinks = getIncomingMatches(id, text, terms);
    const matches: typeof chosen = [];
    for (const m of currentLinks) {
        ids.add(m.from);
    }
    for (const m of chosen) {
        const termId = terms.get(m.key);
        if (termId && !ids.has(termId) && termId !== id) {
            ids.add(termId);
            matches.push(m);
        }
    }

    const parts: string[] = [];
    let last = 0;

    for (const m of matches) {
        parts.push(text.slice(last, m.start));

        const originalText = text.slice(m.start, m.end);
        const macro = `\\nodelink{${m.key}}{${originalText}}`;

        parts.push(macro);
        last = m.end;
    }

    parts.push(text.slice(last));
    return parts.join("");
}
