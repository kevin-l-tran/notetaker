import { describe, it, expect } from "vitest";
import { getDefinitionTerms } from "../getTerms";

describe("getDefinitionTerms", () => {
    const defs = {
        a: {
            id: "1",
            label: "  Foo ",
            aliases: ["Foo alias", "  "],
            description: "",
            createdAt: "",
            updatedAt: "",
        },
        b: {
            id: "2",
            label: "Bar",
            aliases: ["Baz"],
            description: "",
            createdAt: "",
            updatedAt: "",
        },
    };

    it("builds a normalized term → node id map", () => {
        const terms = getDefinitionTerms(defs);

        expect(terms.get("foo")).toBe("1");
        expect(terms.get("foo alias")).toBe("1");
        expect(terms.get("bar")).toBe("2");
        expect(terms.get("baz")).toBe("2");

        // Empty / whitespace-only aliases should not be present
        expect(terms.has("")).toBe(false);
    });

    it("supports excluding a node by id", () => {
        const terms = getDefinitionTerms(defs, "1");

        expect(terms.get("bar")).toBe("2");
        expect(terms.get("baz")).toBe("2");

        // All terms from node "1" should be absent
        expect(terms.get("foo")).toBeUndefined();
        expect(terms.get("foo alias")).toBeUndefined();
    });
});
