import { describe, it, expect } from "vitest";
import autoInsertLinks from "../autoInsertLinks";

describe("autoInsertLinks", () => {
    it("inserts nodelink macros for simple term matches", () => {
        const terms = new Map<string, string>([
            ["foo", "node-foo"],
            ["bar", "node-bar"],
        ]);

        const text = "foo and bar";

        const result = autoInsertLinks("current-node", text, terms);

        expect(result).toBe("\\nodelink{foo}{foo} and \\nodelink{bar}{bar}");
    });

    it("does not create self-links", () => {
        const terms = new Map<string, string>([
            ["foo", "node-foo"],
            ["bar", "node-bar"],
        ]);

        const text = "foo and bar";

        const result = autoInsertLinks("node-foo", text, terms);

        // Only "bar" should be linked; "foo" is a self-link
        expect(result).toBe("foo and \\nodelink{bar}{bar}");
    });

    it("does not create duplicate links to nodes already linked in the text", () => {
        const terms = new Map<string, string>([["foo", "node-foo"]]);

        const text = "Existing \\nodelink{foo}{Foo} and another foo";

        const result = autoInsertLinks("some-node", text, terms);

        // Since there is already a link to "foo", the plain "foo" should stay unlinked
        expect(result).toBe(text);
    });

    it("ignores matches inside LaTeX commands", () => {
        const terms = new Map<string, string>([["foo", "node-foo"]]);

        const text = "\\emph{foo} foo";

        const result = autoInsertLinks("other-node", text, terms);

        // Only the standalone "foo" should be linked
        expect(result).toBe("\\emph{foo} \\nodelink{foo}{foo}");
    });

    it("prefers the longest overlapping match", () => {
        const terms = new Map<string, string>([
            ["space", "node-space"],
            ["space time", "node-space-time"],
            ["time", "node-time"],
        ]);

        const text = "space time";

        const result = autoInsertLinks("current-node", text, terms);

        // "space time" should win over its sub-terms
        expect(result).toBe("\\nodelink{space time}{space time}");
    });

    it("does not link partial word matches", () => {
        const terms = new Map<string, string>([["space", "node-space"]]);

        const text = "spacetime";

        const result = autoInsertLinks("current-node", text, terms);

        expect(result).toBe("spacetime");
    });

    it("links only the first occurrence of the same term in a description", () => {
        const terms = new Map<string, string>([["foo", "node-foo"]]);

        const text = "foo and foo again";

        const result = autoInsertLinks("current-node", text, terms);

        // Only the first "foo" should be linked
        expect(result).toBe("\\nodelink{foo}{foo} and foo again");
    });

    it("is idempotent when run on its own output", () => {
        const terms = new Map<string, string>([
            ["foo", "node-foo"],
            ["bar", "node-bar"],
        ]);

        const original = "foo and bar";

        const once = autoInsertLinks("current-node", original, terms);
        const twice = autoInsertLinks("current-node", once, terms);

        // No nested macros or extra changes on the second run
        expect(twice).toBe(once);
    });
});
