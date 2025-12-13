import { describe, it, expect } from "vitest";
import buildAC from "../buildAC";

describe("buildAC", () => {
    it("normalizes terms and skips empty ones", () => {
        const terms = new Map<string, string>();
        terms.set(" Foo ", "id1");
        terms.set("   ", "ignored");

        const ac = buildAC(terms);
        const matches = ac.search("FOO foo");

        expect(matches.length).toBeGreaterThan(0);
        // All matches should use the normalized key and payload
        for (const m of matches) {
            expect(m.key).toBe("foo");
            expect(m.payload).toBe("id1");
        }
    });
});
