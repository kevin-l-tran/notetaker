// latex.js.d.ts

declare module "latex.js" {
  /**
   * Options for HtmlGenerator
   * https://latex.js.org/api.html#class-htmlgenerator
   */
  export interface HtmlGeneratorOptions {
    /**
     * Default document class if a document without preamble is parsed.
     * e.g. "article"
     */
    documentClass?: string;

    /**
     * Constructor/function providing additional custom macros.
     * It will be instantiated with the HtmlGenerator.
     */
    CustomMacros?: new (generator: HtmlGenerator) => any | Function;

    /**
     * Enable or disable automatic hyphenation.
     */
    hyphenate?: boolean;

    /**
     * Language patterns object to use for hyphenation if enabled.
     */
    languagePatterns?: unknown;

    /**
     * Additional CSS stylesheets to include in the generated document.
     */
    styles?: string[];
  }

  /**
   * Base Generator class (undocumented details).
   * HtmlGenerator extends this internally, so exposing it is convenient
   * if you ever need to refer to the base type.
   */
  export class Generator {
    // API is currently undocumented; treat as an opaque base class.
  }

  /**
   * HTML generator used by latex.js.
   * https://latex.js.org/api.html#class-htmlgenerator
   */
  export class HtmlGenerator extends Generator {
    constructor(options?: HtmlGeneratorOptions);

    /**
     * Reset the generator so it can be reused for another document.
     */
    reset(): void;

    /**
     * Returns the full DOM HTMLDocument representation of the LaTeX source,
     * including <head> and <body>.
     */
    htmlDocument(baseURL?: string): Document;

    /**
     * Returns a DocumentFragment with <link> and <script> elements.
     * Usually used as part of the <head>.
     */
    stylesAndScripts(baseURL?: string): DocumentFragment;

    /**
     * Returns the DOM DocumentFragment containing the rendered body
     * (without scripts and stylesheets).
     */
    domFragment(): DocumentFragment;

    /**
     * The title of the document.
     */
    documentTitle(): string;
  }

  /**
   * Options object for parse().
   * https://latex.js.org/api.html#parser
   */
  export interface ParseOptions {
    /**
     * HtmlGenerator instance to be used during parsing.
     */
    generator: HtmlGenerator;
  }

  /**
   * High-level parse function as shown in the usage docs:
   *
   * import { parse, HtmlGenerator } from "latex.js";
   * const gen = new HtmlGenerator({ hyphenate: false });
   * const doc = parse(latex, { generator: gen }).htmlDocument();
   */
  export function parse(
    latex: string,
    options: ParseOptions
  ): HtmlGenerator;

  /**
   * SyntaxError thrown by the parser on invalid LaTeX input.
   * Mentioned in the API docs as `SyntaxError`.
   */
  export class SyntaxError extends globalThis.SyntaxError {}

  /**
   * Low-level parser namespace from the API docs (`parser.parse(...)`).
   * This mirrors the top-level parse() and SyntaxError exports.
   */
  export const parser: {
    parse(latex: string, options: ParseOptions): HtmlGenerator;
    SyntaxError: typeof SyntaxError;
  };
}
