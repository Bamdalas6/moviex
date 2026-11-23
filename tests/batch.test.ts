import { describe, expect, it } from "vitest";
import { runBatched, type Statement } from "@/server/tmdb/batch";

describe("runBatched", () => {
  it("sends statements in order, in chunks, one round trip each", async () => {
    const calls: number[][] = [];
    const db = { batch: async (chunk: unknown[]) => void calls.push(chunk as number[]) };
    const statements = Array.from({ length: 250 }, (_, i) => i) as unknown as Statement[];
    await runBatched(db as never, statements, 100);
    expect(calls.map((c) => c.length)).toEqual([100, 100, 50]);
    expect(calls.flat()).toEqual(statements);
  });

  it("does nothing for an empty list", async () => {
    let called = false;
    await runBatched({ batch: async () => void (called = true) } as never, []);
    expect(called).toBe(false);
  });
});
