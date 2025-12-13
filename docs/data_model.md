# Data Model

This document describes the core data types used in the app and how they are intended to be used. The goal is to stay stable even as implementation details change. 

The types below are intentionally minimal and stable. Higher-level systems—such as the linking library, stores, and UI components—are built on top of these types but can evolve independently as long as they continue to consume and produce these shapes.

---

## 1. Identifiers

### `NodeId`

```ts
export type NodeId = string;
```

* Opaque, globally unique identifier for any node-like object. 
* Treated as a stable reference:

  * Stored in links and edges.
  * Used to look up the underlying node in app state.
* Callers should not assume anything about the structure of the string (it might be a UUID, timestamp-based id, etc.).

---

## 2. Core node shape

### `Node`

```ts
export type Node = {
    id: NodeId;
    label: string;
    createdAt: string;
    updatedAt: string;
};
```

* Minimal shape shared by all node types. 
* Fields:

  * `id`: stable `NodeId` for references and edges.
  * `label`: primary human-readable name (e.g. the definition title) used for the node label in graph view.
  * `createdAt`, `updatedAt`: timestamps (string, typically ISO) used for sorting, metadata, and future auditing.

**Usage**

* Any entity that should appear as a node in the graph view should at least conform to `Node`.
* More specific node types (like definitions or theorems) extend this base shape with domain-specific fields.

**Invariants**

* `id` is unique within the dataset.
* `createdAt` never changes after creation.
* `updatedAt` is refreshed whenever the node is modified.

---

## 3. Definition nodes

### `DefinitionNode`

```ts
export type DefinitionNode = Node & {
    aliases: string[];
    description: string;
}
```

* Represents a single *definition* in the system. 
* Extends `Node` with:

  * `aliases`: alternative labels (synonyms, abbreviations, etc.).
  * `description`: the main body of text (supports LaTeX and link macros).

**Usage**

* This is the canonical shape stored in the definition store and serialized in JSON exports.
* The linking library uses:

  * `label` and `aliases` to build the term → `NodeId` index.
  * `description` as the text to scan for links and link macros.

**Invariants (conceptual)**

* `label` and each entry in `aliases` are user-facing names for the concept.
* After normalization (trim + lowercase), labels/aliases are expected to be unique across all definition nodes to avoid ambiguous links.
* `description` may contain link macros but should always be parseable as text even if links are stripped.

---

### `DefinitionDraft`

```ts
export type DefinitionDraft = {
    id?: NodeId
    label: string;
    aliases: string[];
    description: string;
}
```

* Lightweight version of a definition used while editing or creating nodes. 
* Differences from `DefinitionNode`:

  * `id` is optional (absent when creating a brand-new node).
  * No `createdAt`/`updatedAt`—those are added by the store when the draft is committed.

**Usage**

* UI forms and dialogs produce and consume `DefinitionDraft`.
* Store-level operations:

  * **Create**: accept a `DefinitionDraft` without `id`, generate an `id`, timestamps, and convert to `DefinitionNode`.
  * **Edit**: accept a `DefinitionDraft` with `id`, validate, update the corresponding `DefinitionNode`.

**Invariants**

* `label`, `aliases`, and `description` are considered user input and may be incomplete or invalid until validated by the store.
* Once a draft is accepted by the store, it must be convertible into a valid `DefinitionNode`.

