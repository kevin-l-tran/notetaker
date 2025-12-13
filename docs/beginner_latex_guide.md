# Writing Definitions with LaTeX in the Editor

The definition editor lets you write your explanations using a subset of LaTeX, and shows a live preview on the right.

This document explains the pieces of LaTeX that are supported and recommended in this app, and how to use the custom `\nodelink` macro.

---

## 1. The basic template

When you open the editor, you will see something like:

```latex
\documentclass{article}
\begin{document}
  Enter your description here!
\end{document}
```

You only need to edit the part **between** `\begin{document}` and `\end{document}`.

The first and last lines can be left alone in almost all cases.

For example:

```latex
\documentclass{article}
\begin{document}
A topology on a set $X$ is a collection of subsets of $X$
satisfying certain properties.
\end{document}
```

---

## 2. Plain text and paragraphs

Just type text as you normally would:

```latex
A topology on a set $X$ is a collection of subsets of $X$
that we call the open sets.
```

To start a new paragraph, leave a **blank line**:

```latex
A topology on a set $X$ is a collection of subsets of $X$.

A set $X$ together with a topology $\mathcal{T}$ is called
a topological space.
```

### 2.1 Emphasis and bold text

Use these commands inside text:

```latex
\emph{important words}    % italic emphasis
\textbf{strong emphasis}  % bold
```

Example:

```latex
A set $X$ together with a topology $\mathcal{T}$ is called
a \emph{topological space}.
```

---

## 3. Basic math

Math can be written in two ways.

### 3.1 Inline math (inside a sentence)

Use single dollar signs:

```latex
A sequence $(x_n)$ in $X$ converges to a point $x$ if
$d(x_n, x) \to 0$ as $n \to \infty$.
```

Anything between `$` and `$` is typeset as math.

### 3.2 Displayed equations (on their own line)

Use double dollar signs:

```latex
$$
d(x_n, x) \to 0 \text{ as } n \to \infty.
$$
```

Do **not** wrap displayed equations in `\begin{equation}` … `\end{equation}`; use `$$ … $$` instead.

### 3.3 Common math symbols

You can use many standard LaTeX math commands:

```latex
a^2 + b^2 = c^2            % superscripts
x_1, x_2, \dots, x_n       % subscripts and dots
\frac{a}{b}                % fractions
\sqrt{x^2 + y^2}           % square root
\leq, \geq, \neq, \approx  % comparisons
\in, \subseteq, \supseteq  % set relations
\forall, \exists           % quantifiers
\mathbb{R}, \mathbb{N}     % number sets
\alpha, \beta, \gamma      % Greek letters
```

Example:

```latex
$$
\forall \varepsilon > 0 \exists N \in \mathbb{N}
\text{ such that } n \geq N \implies d(x_n, x) < \varepsilon.
$$
```

---

## 4. Multi-line equations

For multi-line or aligned equations, you can use the `aligned` environment **inside** a `$$ … $$` block:

```latex
$$
\begin{aligned}
\phi'(x)
  &= \frac{1}{x} - \frac{1}{1 - x}
     + \frac{x - a}{(x - a)^2 + b^2} \\
\phi''(x)
  &= \frac{b^2 - (x - a)^2}{\bigl((x - a)^2 + b^2\bigr)^2}
     - \left( \frac{1}{x^2} + \frac{1}{(1 - x)^2} \right)
\end{aligned}
$$
```

The `&` symbol marks alignment points, and `\\` starts a new line.

You can also write piecewise definitions using `cases`:

```latex
$$
|x| =
\begin{cases}
  x,  & \text{if } x \ge 0, \\
 -x, & \text{if } x < 0.
\end{cases}
$$
```

---

## 5. Lists

Lists are useful for axioms, properties, or steps in a proof.

### 5.1 Bulleted list

```latex
\begin{itemize}
  \item $X$ is nonempty.
  \item $\mathcal{T}$ is a collection of subsets of $X$.
  \item $\varnothing, X \in \mathcal{T}$.
\end{itemize}
```

### 5.2 Numbered list

```latex
\begin{enumerate}
  \item $\varnothing$ and $X$ are in $\mathcal{T}$.
  \item $\mathcal{T}$ is closed under arbitrary unions.
  \item $\mathcal{T}$ is closed under finite intersections.
\end{enumerate}
```

---

## 6. Quotes and displayed text

To highlight a statement or give an informal description, use the `quote` environment:

```latex
\begin{quote}
A space $X$ is connected if it cannot be written as the union
of two disjoint nonempty open sets.
\end{quote}
```

---

## 7. Linking to other definitions with `\nodelink`

The editor has a custom macro `\nodelink` for linking to other definitions in your graph.

### 7.1 Syntax

```latex
\nodelink{node name or alias}{text to be linked}
```

-   The **first argument** is the title or an alias of some existing node.
-   The **second argument** is the text that will be highlighted and clickable.

Example:

```latex
Let $X$ be a \nodelink{topological space}{topological space}.
A continuous bijection with continuous inverse is called a
\nodelink{homeomorphism}{homeomorphism}.
```

In the preview:

-   The words “topological space” and “homeomorphism” will be highlighted.
-   Clicking them will open the corresponding definition windows.

### 7.2 Automatic links vs manual links

The program automatically scans your text and inserts `\nodelink` where it finds existing node titles or aliases.

You can still write `\nodelink{...}{...}` by hand when:

-   You want to link only a specific occurrence of a word.
-   You want the displayed text to differ slightly from the node title.

---

## 8. Things to avoid (advanced users)

The editor uses a JavaScript LaTeX engine with limited support. To keep things working smoothly:

-   Do **not** use `\usepackage{...}`.
-   Do **not** define your own macros with `\newcommand`, `\def`, etc.
-   Avoid environments like `equation`, `align`, `gather`, `multline` at the document level; use `$$ ... $$` and `aligned` / `cases` inside instead.
-   Avoid fine-grained spacing commands such as `\;`, `\!` and similar; they may cause parse errors.

If the preview shows an error, look near the first equation or unusual command you added.

---

## 9. Summary

For most definitions you only need:

-   Normal text, `\emph{...}`, `\textbf{...}`.
-   Inline math with `$ ... $`.
-   Displayed equations with `$$ ... $$` (optionally using `aligned` or `cases` inside).
-   Lists with `itemize` / `enumerate`.
-   Custom links with `\nodelink{...}{...}`.

Sticking to this subset keeps your definitions readable and ensures they render correctly in the app.
