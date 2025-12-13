import { describe, it, expect } from "vitest";
import { AhoCorasick } from "../ahoCorasick";

describe("AhoCorasick", () => {
    it("finds overlapping patterns with correct indices and payloads", () => {
        const ac = new AhoCorasick<string>();
        ac.add("aba", "A");
        ac.add("BAB", "B"); // uppercase to test case-insensitive behavior
        ac.build();

        const matches = ac.search("ababa");

        const simplified = matches.map((m) => ({
            start: m.start,
            end: m.end,
            key: m.key,
            payload: m.payload,
        }));

        expect(simplified).toEqual([
            { start: 0, end: 3, key: "aba", payload: "A" },
            { start: 1, end: 4, key: "bab", payload: "B" },
            { start: 2, end: 5, key: "aba", payload: "A" },
        ]);
    });

    it("supports multiple outputs via failure links", () => {
        const ac = new AhoCorasick<string>();
        ac.add("he", "he");
        ac.add("she", "she");
        ac.add("his", "his");
        ac.add("hers", "hers");
        ac.build();

        const matches = ac.search("ahishers");

        const uniqueKeys = Array.from(
            new Set(matches.map((m) => m.key))
        ).sort();
        expect(uniqueKeys).toEqual(["he", "hers", "his", "she"].sort());
    });
});
