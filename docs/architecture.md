# Architecture

## 1. Purpose

This project is a browser-based tool for building structured mathematical notes.

Users create “nodes” (currently definitions) with LaTeX-capable text. The app:

- Stores these nodes in a central state.
- Automatically detects textual references between nodes and turns them into links.
- Visualizes the resulting network as an interactive graph.
- Lets users open, edit, and navigate nodes in floating windows.

The codebase is organized by file function, not by feature.

---

## 2. Core concepts

### Nodes

A node represents a mathematical concept (currently a definition; theorems and other types are planned).

Each node has:
  - A stable identifier.
  - A primary label.
  - Timestamps indicating creation and modification.

The internal shape of a node can evolve; the architecture assumes only that each node has an id and a label.

### Links and edges

Each node has a unique label that is considered a term. Some nodes contain other fields that also count as terms. These terms are used in link macros, found within the text content of some nodes, to generate links between nodes.

The linking system:
  - Finds references to known node terms in free text.
  - Inserts link macros automatically.
  - Cleans up links when nodes are renamed or deleted.

The graph view interprets these links as directed edges between nodes.

---

## 3. Major subsystems

### 3.1 UI components (`src/components`)

Responsible for rendering and user interaction:

- **Graph view**  
  - Renders nodes and edges as an interactive graph (via Cytoscape).
  - Handles panning, zooming, node selection, context menus, and double-clicks.
- **Editor and forms**  
  - Collect user input when creating or editing nodes.
  - Shows a preview with automatically suggested links.
- **Windows**  
  - Display node contents in draggable, resizable windows.
  - Allow multiple nodes to be viewed side by side.
- **Toolbar and menus**  
  - Surface actions like save/load, open editor, search, and example loading.

The UI is intentionally thin: it delegates state and domain logic to hooks and libraries.

---

## 4. State and domain logic (`src/hooks`, `src/models`)

React hooks encapsulate the app’s core domain behavior. At a high level there are three main responsibilities:

1. **Node storage**  
   - Maintains the canonical set of nodes.
   - Enforces basic invariants (e.g., term uniqueness).
   - Coordinates automatic linking and cleanup whenever nodes are created, edited, loaded, or deleted.

2. **Graph derivation**  
   - Derives a graph representation (nodes + edges) from the current node set and their link macros.
   - Provides a stable interface for the graph view, independent of internal data structures.

3. **Windows and layout**  
   - Tracks which nodes are open in windows and their position/size.
   - Provides commands for opening/focusing/closing windows in response to graph or link interactions.

Models under `src/models` define the shared types used across these hooks (node identifiers, node shapes, and future node types like theorems).

---

## 5. Linking and LaTeX libraries (`src/lib`)

The implementation details of linking are encapsulated in libraries to minimize coupling to UI and storage.

### Linking

- Maintains a mapping from normalized terms (labels/aliases) to node identifiers.
- Uses a generic string-matching engine to find occurrences of those terms in node text.
- Provides operations to:
  - Insert link macros into arbitrary text, based on a set of known terms.
  - Remove invalid or stale link macros when the set of known terms changes.
  - Interpret existing link macros as logical edges between nodes.

The linking layer is designed to work with any node type that exposes an id and text field, so it can be reused for theorems or other future entities.

### LaTeX helpers

- Define the shape and behavior of link macros inside LaTeX-like text.
- Provide utilities for parsing and generating those macros.
- Keep LaTeX-specific concerns out of the rest of the codebase.

---

## 6. Application shell (`src/app/App.tsx`)

The application shell wires everything together:

- Initializes domain hooks (node storage, graph derivation, windows).
- Builds a linking context (e.g., current term mapping and search engine) from the current node set.
- Passes high-level callbacks into components, such as:
  - “Create node”, “Edit node”, “Delete node”.
  - “Open node window”.
  - “Generate automatic links for this draft”.
  - “Load/save node data”.

`App.tsx` is the central composition layer; other modules are designed to remain reusable and relatively independent.

---

## 7. Data flow (simplified)

### Creating or editing a node

1. User fills in a form in the editor.
2. The form submits a draft to the node storage hook.
3. The storage hook:
   - Validates the draft.
   - Updates the canonical node set.
   - Rebuilds the term mapping.
   - Uses the linking utilities to:
     - Insert link macros in the text of the updated node.
     - Insert link macros in the text of existing nodes.
     - Clean up any links that are no longer valid.
4. The graph derivation hook recomputes graph nodes/edges.
5. UI components re-render using the updated node set and graph.

### Navigating via graph or links

1. User clicks a node or link.
2. The associated callback resolves the target node identifier.
3. The window management hook opens or focuses a window for the target node.
4. The user can continue navigating through links or the graph.

### Saving and loading

1. Saving serializes the node set (and any associated metadata) to JSON.
2. Loading replaces the current node set from JSON and triggers the same linking and graph-derivation steps used for edits.

---

## 8. Extensibility

The architecture is intended to support new node types and richer behavior with minimal changes:

- Linking is generic: it operates on text plus a mapping from terms to node ids, not on a particular node shape.
- Graph derivation consumes only node identifiers, labels, and link macros; it does not depend on type-specific fields.
- UI components interact with hooks through stable, high-level operations (e.g., “create node”, “open window for id”), not internal data structures.

To add a new node type (such as theorems):

- Define its model in `src/models`.
- Provide a store hook analogous to the existing node storage hook, optionally reusing the same linking utilities.
- Extend the graph derivation and UI composition layers to include the new node type in the term mapping, graph view, and window manager.

This separation allows internal details to change without altering the high-level architecture described here.
