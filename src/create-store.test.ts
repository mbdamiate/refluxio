import type { Action } from "./create-store";
import { createStore } from "./create-store";

describe("createStore (with strict deepEqual)", () => {
  type State = { count: number };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case "inc":
        return { count: state.count + 1 };
      case "noop":
        return state;
      default:
        return state;
    }
  };

  describe("initialization", () => {
    it("returns initial state", () => {
      const store = createStore(reducer, { count: 0 });
      expect(store.getState()).toEqual({ count: 0 });
    });
  });

  describe("dispatch behavior", () => {
    it("updates state when reducer returns different value", () => {
      const store = createStore(reducer, { count: 0 });

      store.dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 1 });
    });

    it("does not update state if reducer returns same reference", () => {
      const store = createStore(reducer, { count: 0 });
      const prev = store.getState();

      store.dispatch({ type: "noop" });

      expect(store.getState()).toBe(prev);
    });

    it("does not notify listeners when state is deep-equal", () => {
      const store = createStore(reducer, { count: 0 });
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "noop" });

      expect(listener).not.toHaveBeenCalled();
    });

    it("notifies listeners exactly once on state change", () => {
      const store = createStore(reducer, { count: 0 });
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "inc" });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });
  });

  describe("deepEqual semantics", () => {
    it("does NOT emit when reducer returns deep-equal object", () => {
      const reducer = (state: State, action: Action): State => {
        if (action.type === "clone") {
          return { count: state.count };
        }
        return state;
      };

      const store = createStore(reducer, { count: 1 });
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "clone" });

      expect(store.getState()).toEqual({ count: 1 });
      expect(listener).not.toHaveBeenCalled();
    });

    it("emits when prototype differs", () => {
      type S = Date;

      const reducer = (_: S, action: Action): S => {
        if (action.type === "new") {
          return new Date(2020);
        }
        return _;
      };

      const store = createStore(reducer, new Date(2020));
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "new" });

      expect(listener).not.toHaveBeenCalled();
    });

    it("treats NaN as equal", () => {
      const reducer = (state: number, action: Action) =>
        action.type === "noop" ? NaN : state;

      const store = createStore(reducer, NaN);
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "noop" });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("Set and Map support", () => {
    it("does not emit for deep-equal Sets", () => {
      type S = Set<{ a: number }>;

      const reducer = (_: S, action: Action): S => {
        if (action.type === "clone") {
          return new Set([{ a: 1 }]);
        }
        return _;
      };

      const store = createStore(reducer, new Set([{ a: 1 }]));
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "clone" });

      expect(listener).not.toHaveBeenCalled();
    });

    it("emits for changed Map values", () => {
      type S = Map<string, number>;

      const reducer = (state: S, action: Action): S => {
        if (action.type === "inc") {
          return new Map([["a", (state.get("a") ?? 0) + 1]]);
        }
        return state;
      };

      const store = createStore(reducer, new Map([["a", 0]]));
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "inc" });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscriptions", () => {
    it("supports multiple listeners", () => {
      const store = createStore(reducer, { count: 0 });
      const l1 = jest.fn();
      const l2 = jest.fn();

      store.subscribe(l1);
      store.subscribe(l2);

      store.dispatch({ type: "inc" });

      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });

    it("unsubscribe stops notifications", () => {
      const store = createStore(reducer, { count: 0 });
      const listener = jest.fn();

      const unsubscribe = store.subscribe(listener);
      store.dispatch({ type: "inc" });

      unsubscribe();
      store.dispatch({ type: "inc" });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("dispatching inside a listener works safely", () => {
      const store = createStore(reducer, { count: 0 });
      const listener = jest.fn((state) => {
        if (state.count === 1) {
          store.dispatch({ type: "inc" });
        }
      });

      store.subscribe(listener);
      store.dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 2 });
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("supports primitive state", () => {
      const reducer = (state: number, action: Action) =>
        action.type === "inc" ? state + 1 : state;

      const store = createStore(reducer, 0);
      const listener = jest.fn();

      store.subscribe(listener);
      store.dispatch({ type: "inc" });

      expect(store.getState()).toBe(1);
      expect(listener).toHaveBeenCalledWith(1);
    });
  });
});
