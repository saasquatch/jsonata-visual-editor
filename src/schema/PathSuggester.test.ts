import { describe, expect, it } from "vitest";
import getPaths from "./PathSuggester";

describe("Path suggestion", () => {
  it("Runs on basic objects", () => {
    // TODO
    const paths = getPaths({
      type: "object",
      properties: {
        foo: {
          type: "string",
        },
        bar: {
          type: "string",
        },
      },
    });

    expect(paths).toStrictEqual([
      {
        description: undefined,
        isJsonataSequence: false,
        path: "foo",
        title: undefined,
        titlePath: [undefined, undefined],
        type: "string",
        typePath: ["object", "string"],
      },
      {
        description: undefined,
        isJsonataSequence: false,
        path: "bar",
        title: undefined,
        titlePath: [undefined, undefined],
        type: "string",
        typePath: ["object", "string"],
      },
    ]);
  });
});
