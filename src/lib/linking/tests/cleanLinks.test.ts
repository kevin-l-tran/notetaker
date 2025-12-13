import { describe, it, expect } from "vitest";
import cleanLinks from "../cleanLinks";

describe("cleanLinks", () => {
    it("keeps links whose keys still resolve", () => {
        const terms = new Map<string, string>([["foo", "node-foo"]]);
        const text = "See \\nodelink{ Foo }{foo} here.";

        const cleaned = cleanLinks(text, terms);

        expect(cleaned).toBe("See \\nodelink{ Foo }{foo} here.");
    });

    it("replaces stale links with their visible text", () => {
        const terms = new Map<string, string>([["foo", "node-foo"]]);
        const text =
            "See \\nodelink{foo}{Foo} and \\nodelink{bar}{bar} for details.";

        const cleaned = cleanLinks(text, terms);

        // "foo" is kept as a macro; "bar" is replaced by visible text
        expect(cleaned).toBe("See \\nodelink{foo}{Foo} and bar for details.");
    });

    it("normalizes key before lookup", () => {
        const terms = new Map<string, string>([["foo", "node-foo"]]);
        const text = "\\nodelink{  FOO  }{Foo}";

        const cleaned = cleanLinks(text, terms);

        expect(cleaned).toBe("\\nodelink{  FOO  }{Foo}");
    });
});
