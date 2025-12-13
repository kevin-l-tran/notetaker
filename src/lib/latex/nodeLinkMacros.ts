import type { HtmlGenerator } from "latex.js";

/**
 * Factory for the LaTeX.js macro constructor that defines `\nodelink`.
 *
 * This follows the pattern from the LaTeX.js docs:
 * - The constructor receives an `HtmlGenerator`.
 * - Static `args` describes the macro signatures.
 * - Methods are attached on the prototype.
 */
function makeNodeLinkMacros() {
    // Constructor function
    function NodeLinkMacros(this: any, generator: HtmlGenerator) {
        this.g = generator;
    }

    // Attach args map and prototype
    const args: any = ((NodeLinkMacros as any).args = {});
    const proto: any = (NodeLinkMacros as any).prototype;

    /**
     * \nodelink{<descriptor>}{<visible text>}
     *
     * - "H" = horizontal macro that returns content.
     * - "k" = key/identifier argument (node descriptor).
     * - "g" = group argument (visible content).
     */
    args["nodelink"] = ["H", "k", "g"];

    /**
     * Implementation of the `\nodelink` macro.
     *
     * - Normalizes the descriptor into a string.
     * - Normalizes the content into a Node/Fragment.
     * - Wraps the content in a `<button>` with:
     *   - class "node-link"
     *   - data-node-descriptor="<descriptor>"
     * - Returns an array of nodes, as required by LaTeX.js.
     */
    proto.nodelink = function nodelink(nodeDescriptorArg: any, contentArg: any) {
        // Normalize id from k-type arg
        const descriptor =
            nodeDescriptorArg == null
                ? ""
                : typeof nodeDescriptorArg === "string"
                ? nodeDescriptorArg
                : typeof nodeDescriptorArg.data === "string"
                ? nodeDescriptorArg.data
                : String(nodeDescriptorArg);

        // Normalize group arg into a Node/Fragment
        const contentNode =
            contentArg && contentArg.nodeType
                ? contentArg
                : this.g.createFragment(contentArg);

        // <button class="def-link" data-definition-id="...">…</button>
        const button = this.g.create("button", contentNode, "node-link");
        if (descriptor) {
            button.setAttribute("data-node-descriptor", descriptor);
        }

        // "H"/"V" macros must return an array of nodes/strings
        return [button];
    };

    return NodeLinkMacros as any;
}

// Export the constructor that HtmlGenerator expects
const NodeLinkMacros = makeNodeLinkMacros() as new (
    generator: HtmlGenerator
) => {
    nodelink(defIdArg: any, contentArg: any): any[];
};

export default NodeLinkMacros;
