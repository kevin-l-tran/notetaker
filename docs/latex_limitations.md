# Limitations of `latex.js` in the Editor

This document is aimed at users who already know LaTeX/TeX and want to understand what **`latex.js` can and cannot do** inside the definition editor.

The editor uses:

- [`latex.js`](https://latex.js.org/) to parse a LaTeX-like document and produce HTML.
- [KaTeX](https://katex.org/) (via `latex.js`) to render math.
- A custom macro `\nodelink` for linking between nodes.

The goal is to support short, self-contained expository notes, **not** full-blown TeX documents or arbitrary packages.

---

## 1. Overall model

### 1.1 PEG-based parser, not TeX

`latex.js` uses a **PEG grammar** implemented in JavaScript. It does **not** run real TeX:

- No tokenization/catcode system.
- No macro processor with `\def`, `\expandafter`, category changes, etc.
- No page-breaking or box/glue model.

What this means:

- Only constructs explicitly implemented in the grammar and runtime work.
- Many things that “just work” in real TeX will either:
  - fail to parse, or  
  - degrade to simpler HTML.

If you treat it as “LaTeX with a pleasant subset of environments and math,” you’ll be much happier than if you expect a full TeX engine.

---

## 2. Preamble and packages

### 2.1 `\documentclass` and `\begin{document}`

You can write:

```latex
\documentclass{article}
\begin{document}
  ...
\end{document}
````

but this is mostly **cosmetic**:

* Class options and document class selection are effectively ignored.
* There is no layout negotiation, pagination, etc.
* The app usually only cares about the content between `\begin{document}` and `\end{document}`.

You can also omit the preamble entirely and just write the body.

### 2.2 `\usepackage` and `.sty` files

In real LaTeX, `\usepackage{...}` loads arbitrary `.sty` files. Here:

* **Only a small, hardcoded set of packages is implemented in JS** (e.g. some of: `color/xcolor`, `graphicx/graphics`, etc., depending on the exact `latex.js` version).
* Any other package (for example `amsmath`, `amssymb`, `tikz`, `siunitx`, `physics`, `biblatex`, etc.) is effectively **unsupported**:

  * `\usepackage{amsmath}` will not actually load AMS macros.
  * Environments like `equation`, `align`, `gather`, etc. are not recognized at the LaTeX level.

Result: treat `\usepackage` as **off-limits** unless you know the package is explicitly wired into `latex.js` for this app.

---

## 3. Macro definitions and TeX programming

### 3.1 No user-defined macros

Commands that define or manipulate macros are not supported:

* `\newcommand`, `\renewcommand`, `\providecommand`
* `\def`, `\gdef`, `\edef`, `\xdef`
* `\let`, `\futurelet`, etc.

Similarly, conditionals and TeX-level programming are not supported:

* `\if`, `\ifx`, `\ifnum`, `\ifdim`, `\ifcat`, `\ifodd`, `\ifcase`, `\else`, `\fi`

In practice, any attempt to define your own macro in the document body will either fail to parse or be ignored.

### 3.2 Custom macro: `\nodelink`

The editor defines a **custom macro**:

```latex
\nodelink{node name or alias}{text to be linked}
```

* First argument: title or alias of an existing node.
* Second argument: the text that should appear as a clickable link in the definition window.

Example:

```latex
A \nodelink{topological space}{topological space} is a set
equipped with a topology.
```

The program also **auto-inserts** `\nodelink` by scanning your description for titles/aliases of existing nodes. You can override or refine this behaviour by writing `\nodelink` explicitly.

This is essentially the **only** user-facing “macro” you can (and should) rely on beyond the usual LaTeX commands implemented by `latex.js` itself.

---

## 4. Math support and limitations

### 4.1 KaTeX under the hood

Math fragments are rendered by **KaTeX**, not by TeX itself. This has two implications:

1. The **math syntax** is closer to “KaTeX-compatible LaTeX” than to full AMS LaTeX.
2. Many common math commands *do* work (fractions, radicals, sums, integrals, matrices, `aligned`, `cases`, etc.), as long as they are part of KaTeX’s supported subset.

You should consult KaTeX’s [supported functions list](https://katex.org/docs/supported) if you want to use more exotic math commands.

### 4.2 No AMS environments at the document level

Things that do **not** work as in LaTeX:

* `\begin{equation} ... \end{equation}`
* `\begin{align} ... \end{align}`
* `\begin{gather}`, `\begin{multline}`, etc.

These are not implemented as LaTeX environments in `latex.js`, so they usually trigger errors like:

* `unknown environment: equation`
* or generic parse failures that point at the beginning of the math block.

Recommended pattern:

* Use `$$ ... $$` for display math.
* Inside that block, you can use KaTeX environments like `aligned`, `cases`, `pmatrix`, etc.

Example:

```latex
$$
\begin{aligned}
\phi'(x)
  &= \frac{1}{x} - \frac{1}{1-x}
     + \frac{x-a}{(x-a)^2 + b^2} \\
\phi''(x)
  &= \frac{b^2 - (x-a)^2}{\bigl((x-a)^2 + b^2\bigr)^2}
     - \left( \frac{1}{x^2} + \frac{1}{(1-x)^2} \right)
\end{aligned}
$$
```

### 4.3 Plain TeX spacing and glue

Many plain-TeX spacing commands are **not defined** in `latex.js` and will break the parse, for example:

* `\;`, `\!`, likely also `\,`, `\:`, `\enspace`, `\thickspace`, etc.
* Horizontal/vertical glue such as `\hskip`, `\vskip`, `\hfill`, etc., especially outside math.

Because `latex.js`’s PEG grammar doesn’t recognize these, they often cause *high-level* parse errors (e.g. “`\end{document} missing`”) pointing near a math block or the end of the document, not at the actual offending control sequence.

If you’re used to micromanaging spacing with these commands, expect to:

* Either omit them entirely, or
* Replace them with coarser constructs like `\quad`, `\qquad`, or just rely on default spacing.

---

## 5. Environments and layout

### 5.1 Environments that generally work

For short article-style notes, these are usually fine:

* `itemize` / `enumerate`
* `description` (depending on your `latex.js` version)
* `quote`, `center`
* `aligned`, `cases`, `pmatrix`, etc. **inside** math (`$$ ... $$`)

These are all implemented as HTML structures (lists, blockquotes, divs, etc.) without page-breaking.

### 5.2 Page layout, floats, and complex structures

Anything that relies on TeX’s page model or advanced layout is effectively unsupported, including:

* Floats: `figure`, `table` with placement options `[htbp!]`
* `\caption`, `\captionof`, cross-references, `\label`/`\ref` for floats
* Marginal notes: `\marginpar`
* Multi-page tables: `longtable`, etc.
* Fancy headers/footers: `fancyhdr` and similar.

The editor renders everything into a single HTML “page” without pagination. If you try to use these constructs, they will either:

* be ignored,
* be rendered as plain blocks, or
* cause a parse error.

---

## 6. Verbatim and catcodes

Because there is no real catcode system:

* “True” verbatim and category-code manipulation are not supported.
* Environments like:

  * `verbatim`, `Verbatim`
  * `lstlisting`, `minted`

  are, at best, very limited and, at worst, completely unsupported.

In practice, this environment is not intended for code-heavy documents; you are better off using simple text or fenced code blocks from Markdown if/when such support exists.

---

## 7. Error behaviour

### 7.1 Error granularity

Errors come from the PEG parser, not TeX itself:

* Often you will see generic messages like `SyntaxError: \end{document} missing` or similar.
* The reported location is typically a **higher-level construct** (e.g. the start of a math block) rather than the unknown command itself.

This can be surprising if you’re used to TeX’s “Undefined control sequence” pointing right at `\foo`.

Under the hood, once the parser hits an unexpected token (such as an unsupported `\;`), it backtracks until it reaches a rule that can’t be satisfied (like the whole document needing `\end{document}`), and that’s what you see.

### 7.2 Practical strategy for power users

If something that “should work” fails:

1. Look at the first math block or unusual command near the reported line.
2. Remove any “advanced” macros (`\;`, `\!`, `\hfill`, `\usepackage`, new environments) and try again.
3. When in doubt, rewrite the expression into plain KaTeX-supported syntax inside `$$ ... $$`.

---

## 8. Summary (for TeX-heavy users)

When working in this editor, you should **not** think “full LaTeX,” but rather:

> *A small LaTeX-like language with KaTeX math and one custom macro (`\nodelink`), rendered into HTML by a PEG-based parser.*

Concretely:

* Safe:

  * Basic text commands: `\emph`, `\textbf`, small sectioning, simple lists, quotes.
  * Math in `$ ... $` or `$$ ... $$`, using KaTeX-friendly syntax.
  * `aligned`, `cases`, matrices, etc. **inside** math.
  * The custom macro `\nodelink{node name or alias}{text to be linked}` for internal links.

* Unsafe / unsupported:

  * `\usepackage` for arbitrary packages (`amsmath`, `tikz`, etc.).
  * User-defined macros (`\newcommand`, `\def`, …) and conditionals (`\if...`).
  * Document-level `equation`, `align`, `gather`, `multline`, etc.
  * Plain-TeX glue/spacing (`\;`, `\!`, `\hfill`, `\vskip`, …).
  * Floats, complex page layout, heavy verbatim/code environments.

If you stay within this subset, `latex.js` provides fast, client-side rendering that is well suited for definition-sized chunks of mathematics, with automatic and manual linking via `\nodelink`.