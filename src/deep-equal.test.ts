import { describe, expect, it } from "@jest/globals";
import { deepEqual } from "./deep-equal";

describe("deepEqual", () => {
  it("should return true if two primitive values are deeply equal", () => {
    expect(deepEqual(1, 1)).toBe(true);
  });

  it("should return true if two arrays with same elements are deeply equal", () => {
    expect(
      deepEqual(
        [{ name: "Alice" }, { name: "Bob" }],
        [{ name: "Alice" }, { name: "Bob" }],
      ),
    ).toBe(true);
  });

  it("should return false if two arrays with different elements are deeply equal", () => {
    expect(
      deepEqual(
        [{ name: "Alice" }, { name: "Bob" }],
        [{ name: "Bob" }, { name: "Charlie" }],
      ),
    ).toBe(false);
  });

  it("should return true if two objects with same keys and values are deeply equal", () => {
    expect(
      deepEqual({ name: "Alice", age: 25 }, { name: "Alice", age: 25 }),
    ).toBe(true);
  });

  it("should return false if two objects with different keys or values are deeply equal", () => {
    expect(
      deepEqual({ name: "Alice", age: 25 }, { name: "Bob", age: 30 }),
    ).toBe(false);
  });

  it("should return true if two primitive values are deeply equal", () => {
    expect(deepEqual("foo", "foo")).toBe(true);
  });

  it("should return true if two objects with same keys and values are deeply equal", () => {
    const obj1 = { name: "Alice", age: 25 };
    const obj2 = { name: "Alice", age: 25 };
    expect(deepEqual(obj1, obj2)).toBe(true);
  });

  it("should return false if two objects with different keys or values are deeply equal", () => {
    const obj1 = { name: "Alice", age: 25 };
    const obj2 = { name: "Bob", age: 30 };
    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it("should return false if two arrays with different elements are deeply equal", () => {
    const arr1 = [{ name: "Alice" }, { name: "Bob" }];
    const arr2 = [{ name: "Bob" }, { name: "Charlie" }];
    expect(deepEqual(arr1, arr2)).toBe(false);
  });
});

describe("deepEqual – primitives", () => {
  it("identical numbers", () => {
    expect(deepEqual(1, 1)).toBe(true);
  });

  it("different numbers", () => {
    expect(deepEqual(1, 2)).toBe(false);
  });

  it("strings", () => {
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual("a", "b")).toBe(false);
  });

  it("booleans", () => {
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(true, false)).toBe(false);
  });

  it("symbol equality", () => {
    const s = Symbol("x");
    expect(deepEqual(s, s)).toBe(true);
    expect(deepEqual(Symbol("x"), Symbol("x"))).toBe(false);
  });
});

describe("deepEqual – null and undefined", () => {
  it("null vs null", () => {
    expect(deepEqual(null, null)).toBe(true);
  });

  it("undefined vs undefined", () => {
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it("null vs undefined", () => {
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("null vs object", () => {
    expect(deepEqual(null, {})).toBe(false);
  });
});

describe("deepEqual – Date", () => {
  it("same date value", () => {
    expect(deepEqual(new Date("2020-01-01"), new Date("2020-01-01"))).toBe(
      true,
    );
  });

  it("different date values", () => {
    expect(deepEqual(new Date("2020-01-01"), new Date("2021-01-01"))).toBe(
      false,
    );
  });
});

describe("deepEqual – RegExp", () => {
  it("same pattern and flags", () => {
    expect(deepEqual(/abc/gi, /abc/gi)).toBe(true);
  });

  it("different flags", () => {
    expect(deepEqual(/abc/g, /abc/i)).toBe(false);
  });

  it("different pattern", () => {
    expect(deepEqual(/abc/, /def/)).toBe(false);
  });
});

describe("deepEqual – arrays", () => {
  it("flat arrays", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it("different lengths", () => {
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("nested arrays", () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
  });

  it("array order matters", () => {
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });
});

describe("deepEqual – objects", () => {
  it("simple objects", () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
  });

  it("different values", () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("extra keys", () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("nested objects", () => {
    expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(
      true,
    );
  });

  it("key order does not matter", () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });
});

describe("deepEqual – Set", () => {
  it("same primitive values", () => {
    expect(deepEqual(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true);
  });

  it("different sizes", () => {
    expect(deepEqual(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
  });

  it("object references in Set (same reference)", () => {
    const obj = { a: 1 };
    expect(deepEqual(new Set([obj]), new Set([obj]))).toBe(true);
  });

  it("object values in Set (different references)", () => {
    // This fails deep structural equality but passes reference equality
    expect(deepEqual(new Set([{ a: 1 }]), new Set([{ a: 1 }]))).toBe(true);
  });
});

describe("deepEqual – Map", () => {
  it("primitive keys and values", () => {
    expect(deepEqual(new Map([["a", 1]]), new Map([["a", 1]]))).toBe(true);
  });

  it("nested values", () => {
    expect(
      deepEqual(new Map([["a", { b: 2 }]]), new Map([["a", { b: 2 }]])),
    ).toBe(true);
  });

  it("different values", () => {
    expect(deepEqual(new Map([["a", 1]]), new Map([["a", 2]]))).toBe(false);
  });

  it("object keys are reference-based", () => {
    expect(deepEqual(new Map([[{ a: 1 }, 1]]), new Map([[{ a: 1 }, 1]]))).toBe(
      true,
    );
  });
});

describe("deepEqual – mixed / edge cases", () => {
  it("array vs object", () => {
    expect(deepEqual([], {})).toBe(false);
  });

  it("function references", () => {
    const fn = () => {};
    expect(deepEqual(fn, fn)).toBe(true);
    expect(
      deepEqual(
        () => {},
        () => {},
      ),
    ).toBe(false);
  });
});
