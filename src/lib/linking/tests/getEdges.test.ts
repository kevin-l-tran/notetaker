import { describe, it, expect } from "vitest";
import getEdges from "../getEdges";

describe("getEdges", () => {
    it("extracts logical edges from nodelink macros", () => {
        const terms = new Map<string, string>([
            ["foo", "node-foo"],
            ["bar", "node-bar"],
        ]);

        const text = "See \\nodelink{foo}{Foo} and then \\nodelink{bar}{Bar}.";

        const edges = getEdges("target-node", text, terms);

        expect(edges).toEqual([
            { key: "foo", from: "node-foo", to: "target-node" },
            { key: "bar", from: "node-bar", to: "target-node" },
        ]);
    });

    it("skips self-links, missing keys, and duplicates", () => {
        const terms = new Map<string, string>([
            ["foo", "node-foo"],
            ["self", "self-node"],
        ]);

        const text = [
            "\\nodelink{foo}{Foo}",         // valid
            "\\nodelink{self}{Self}",       // self-link => skip
            "\\nodelink{foo}{Foo again}",   // duplicate from => skip
            "\\nodelink{missing}{Missing}", // missing key => skip
        ].join(" ");

        const edges = getEdges("self-node", text, terms);

        expect(edges).toEqual([
            { key: "foo", from: "node-foo", to: "self-node" },
        ]);
    });
});
