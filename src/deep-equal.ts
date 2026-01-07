export function deepEqual(
  a: unknown,
  b: unknown,
  seen = new WeakMap<object, object>(),
): boolean {
  // 🔥 HOT PATH #1 — identical or NaN
  if (Object.is(a, b)) return true;

  // 🔥 HOT PATH #2 — primitives / null
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  // 🔥 HOT PATH #3 — prototype mismatch
  const protoA = Object.getPrototypeOf(a);
  const protoB = Object.getPrototypeOf(b);
  if (protoA !== protoB) return false;

  // 🔥 HOT PATH #4 — cycle detection
  const cached = seen.get(a as object);
  if (cached === b) return true;
  if (cached !== undefined) return false;
  seen.set(a as object, b as object);

  // Array (VERY HOT PATH)
  if (Array.isArray(a)) {
    const arrA = a as unknown[];
    const arrB = b as unknown[];

    const lenA = arrA.length;
    const lenB = arrB.length;
    if (lenA !== lenB) return false;

    for (let i = 0; i < lenA; i++) {
      if (!deepEqual(arrA[i], arrB[i], seen)) return false;
    }
    return true;
  }

  // Date
  if (a instanceof Date) {
    return (a as Date).getTime() === (b as Date).getTime();
  }

  // RegExp
  if (a instanceof RegExp) {
    const ra = a as RegExp;
    const rb = b as RegExp;
    return ra.source === rb.source && ra.flags === rb.flags;
  }

  // Set
  if (a instanceof Set) {
    const setA = a as Set<unknown>;
    const setB = b as Set<unknown>;
    if (setA.size !== setB.size) return false;

    for (const av of setA) {
      let found = false;
      for (const bv of setB) {
        if (deepEqual(av, bv, seen)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  // Map
  if (a instanceof Map) {
    const mapA = a as Map<unknown, unknown>;
    const mapB = b as Map<unknown, unknown>;
    if (mapA.size !== mapB.size) return false;

    for (const [ak, av] of mapA) {
      let found = false;
      for (const [bk, bv] of mapB) {
        if (deepEqual(ak, bk, seen) && deepEqual(av, bv, seen)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  // Plain object (keys only, no symbols — intentional for speed)
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  for (const key of keysA) {
    if (!(key in objB)) return false;
    if (!deepEqual(objA[key], objB[key], seen)) return false;
  }

  const len = keysA.length;
  if (len !== keysB.length) return false;

  return true;
}
