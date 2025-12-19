import { describe, it, expect } from "vitest";
import { hasWordBoundaries, pickNonOverlapping } from "../acFilters";

describe("pickNonOverlapping", () => {
    it("keeps non-overlapping matches in order", () => {
        const matches = [
            { start: 0, end: 3, key: "a", payload: null },
            { start: 3, end: 5, key: "b", payload: null },
        ];

        const picked = pickNonOverlapping(matches);

        expect(picked.map((m) => m.key)).toEqual(["a", "b"]);
    });

    it("prefers longer match when starting at same position", () => {
        const matches = [
            { start: 0, end: 3, key: "short", payload: null },
            { start: 0, end: 5, key: "long", payload: null },
        ];

        const picked = pickNonOverlapping(matches);

        expect(picked).toHaveLength(1);
        expect(picked[0].key).toBe("long");
    });

    it("drops matches that overlap the previous pick", () => {
        const matches = [
            { start: 0, end: 4, key: "a", payload: null },
            { start: 2, end: 6, key: "b", payload: null },
            { start: 6, end: 8, key: "c", payload: null },
        ];

        const picked = pickNonOverlapping(matches);

        expect(picked.map((m) => m.key)).toEqual(["a", "c"]);
    });
});

describe("hasWordBoundaries", () => {
    it("accepts matches at string edges and separated by spaces", () => {
        const text = "space is nice space";
        expect(hasWordBoundaries(text, 0, 5)).toBe(true); // "space" at start
        expect(hasWordBoundaries(text, 14, 19)).toBe(true); // "space" at end
    });

    it("rejects matches embedded in a larger word", () => {
        const text = "spacetime";
        expect(hasWordBoundaries(text, 0, 5)).toBe(false);
    });

    it("treats braces and alphanumerics as word characters", () => {
        const text = "{space}";
        // "space" from index 1 to 6 should be rejected because it is inside braces
        expect(hasWordBoundaries(text, 1, 6)).toBe(false);
    });

    it("treats hyphen as a word boundary", () => {
        const text = "space-time";
        // "space" at the beginning should be considered a full word
        expect(hasWordBoundaries(text, 0, 5)).toBe(true);
        // "time" at the end should be considered a full word
        expect(hasWordBoundaries(text, 6, 10)).toBe(true);
    });

    it("treats digits as part of the same word", () => {
        const text = "space2";
        // The trailing "2" should make this a partial word match
        expect(hasWordBoundaries(text, 0, 5)).toBe(false);
    });
});
