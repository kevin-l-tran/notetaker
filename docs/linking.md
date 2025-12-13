# Linking Library

## 1. Purpose

The linking library is responsible for turning plain text references in node descriptions into structured links and graph edges.

At a high level, it supports:

1. Building an index from **terms** (i.e., labels or aliases) to **node ids**.
2. Using an **Aho–Corasick** automaton to efficiently find those terms in arbitrary text.
3. Rewriting matching text into LaTeX-style `\nodelink{key}{visible}` macros.
4. Cleaning stale macros when the set of known terms changes.
5. Interpreting existing macros as logical edges between nodes for the graph view.

The library is text and id based; it does not depend on specific node shapes, only on an id and a mapping from normalized terms to ids. What follows is a description of how each component could be wired together.

---

## 2. Term collection

The first step is to build a **term → node id** index from a list of nodes. `getTerms` contains a set of functions that construct such an index from different types of nodes.

-   The terms extracted from a node depends on its type. For instance, the label and aliases of a `DefinitionNode` are extracted as terms.
-   Each term is trimmed and lowercased; empty strings are ignored.
-   An optional `excludeId` allows building an index that omits a particular node (useful to avoid self-links when processing that node’s own text).

Since no two nodes can share a term, this index counts as a source of truth for resolving a textual term back to a node id.

---

## 3. Multi-pattern matching

To find many terms in text efficiently, the library uses an **Aho–Corasick** automaton. `ahoCorasick` defines the Aho-Corasick automaton object.

-   `buildAC` takes the term index and constructs an automaton that can search for all terms at once.
-   The automaton:
    -   Is case-insensitive (both patterns and text are lowercased).
    -   Returns matches with character offsets, the matched key, and its associated payload (node id).

This allows every description to be scanned in a single pass, regardless of how many terms exist.

---

## 4. Filtering and conflict resolution

Raw matches from the automaton go through a small set of filters so that only meaningful, non-conflicting links are created. These filters are implemented in `acFilters`:

-   **Word boundaries**:  
    Matches must be bounded by non-word characters, so that “space” does not link inside “spacetime”.

-   **Non-overlapping**:  
    When matches overlap (e.g., “metric” vs. “metric space”), the library picks a consistent non-overlapping set, preferring earlier and longer matches.

These rules keep the final set of links readable and semantically reasonable.

---

## 5. Inserting link macros

The core operation for turning plain text into linked text is `autoInsertLinks`.

Given a node id, its description text, and a term index:

1. LaTeX commands (including existing `\nodelink` macros) are **masked** so they are not modified or re-linked.
2. The Aho–Corasick automaton finds all term occurrences in the masked text.
3. The filters described above are applied.
4. The text is scanned for existing `\nodelink` macros.
5. For each matched term, matches that would introduce duplicate links to the same target node are skipped. Matches that would link a node to itself are also skipped.
6. For each accepted match, the corresponding span in the original text is replaced with:

    ```tex
    \nodelink{<normalized-key>}{<original-visible-text>}
    ```

The result is a new description string with explicit link macros that:

-   Preserve the user’s original wording as the visible text.
-   Store a normalized key for stable resolution, even if casing or spacing changes in the visible part.

---

## 6. Cleaning stale links

When nodes are renamed or deleted, some `\nodelink` macros may point to terms that no longer exist.

`cleanLinks` takes a piece of text and the current term index and:

-   Keeps a macro unchanged if its key still resolves to a node id.
-   Replaces a macro with just its visible text if the key no longer resolves.

This ensures descriptions remain readable and do not contain dead links.

---

## 7. Deriving graph edges

`getEdges` interprets `\nodelink` macros as **logical edges** between nodes.

Given a node id, its text, and the term index:

1. The function scans for all `\nodelink{key}{...}` macros.
2. Each key is resolved to a “from” node via the term index.
3. The current node is treated as the “to” node.
4. Self-links and duplicate edges from the same source are skipped.

The result is a set of `{ key, from, to }` triples that the graph layer can convert into edges for visualization.

---

## 8. Design goals

The linking library is designed to be:

-   **Generic**: depends only on text and a term → id map, so it can support new node types (e.g. theorems) without changes to core algorithms.
-   **Non-invasive**: respects word boundaries and LaTeX commands to avoid surprising or incorrect links.
-   **Stable**: uses normalized keys inside macros, making links robust against cosmetic changes in visible text.
-   **Self-healing**: can clean up or recompute links whenever the node set changes.

As long as these high-level behaviors are preserved, internal details (data structures, macro shapes, specific filters) can evolve without affecting the overall architecture.
