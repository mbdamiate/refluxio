import type { MiddlewareFunction, ThunkAction } from "./apply-middleware";
import { applyMiddleware } from "./apply-middleware";
import type { Action, Dispatch, Reducer } from "./create-store";
import { createStore } from "./create-store";

describe("applyMiddleware", () => {
  type State = { count: number };

  const reducer: Reducer<State> = (state: State, action: Action): State => {
    switch (action.type) {
      case "inc":
        return { count: state.count + 1 };
      case "add":
        return { count: state.count + (action.payload as number) };
      default:
        return state;
    }
  };

  describe("basic behavior", () => {
    it("returns a dispatch function", () => {
      const store = createStore(reducer, { count: 0 });
      const dispatch = applyMiddleware(store, []);

      expect(typeof dispatch).toBe("function");
    });

    it("dispatches actions to the store when no middleware is provided", () => {
      const store = createStore(reducer, { count: 0 });
      const dispatch = applyMiddleware(store, []);

      dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 1 });
    });
  });

  describe("middleware execution", () => {
    it("executes middleware before reaching the reducer", () => {
      const store = createStore(reducer, { count: 0 });

      const middleware: MiddlewareFunction<State> =
        () => (next) => (action) => {
          if ((action as Action).type === "inc") {
            return next({ type: "add", payload: 2 });
          }
          return next(action);
        };

      const dispatch = applyMiddleware(store, [middleware]);
      dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 2 });
    });

    it("allows middleware to block actions", () => {
      const store = createStore(reducer, { count: 0 });

      const middleware: MiddlewareFunction<State> = () => () => () => {};

      const dispatch = applyMiddleware(store, [middleware]);
      dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 0 });
    });
  });

  describe("middleware order", () => {
    it("applies middleware from left to right", () => {
      const store = createStore(reducer, { count: 0 });
      const calls: string[] = [];

      const mw1: MiddlewareFunction<State> = () => (next) => (action) => {
        calls.push("mw1 before");
        const result = next(action);
        calls.push("mw1 after");
        return result;
      };

      const mw2: MiddlewareFunction<State> = () => (next) => (action) => {
        calls.push("mw2 before");
        const result = next(action);
        calls.push("mw2 after");
        return result;
      };

      const dispatch = applyMiddleware(store, [mw1, mw2]);
      dispatch({ type: "inc" });

      expect(calls).toEqual([
        "mw1 before",
        "mw2 before",
        "mw2 after",
        "mw1 after",
      ]);
    });
  });

  describe("getState access", () => {
    it("middleware can read current state", () => {
      const store = createStore<State>(reducer, { count: 0 });

      const middleware: MiddlewareFunction<State> =
        ({ getState }) =>
        (next) =>
        (action) => {
          const { count } = getState() as State;
          if ((action as Action).type === "inc" && count === 0) {
            return next({ type: "add", payload: 5 });
          }
          return next(action);
        };

      const dispatch = applyMiddleware(store, [middleware]);
      dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 5 });
    });
  });

  describe("dispatch access", () => {
    it("middleware can dispatch additional actions safely", () => {
      const store = createStore(reducer, { count: 0 });

      const middleware: MiddlewareFunction<State> =
        ({ dispatch }) =>
        (next) =>
        (action) => {
          if ((action as Action).type === "inc") {
            dispatch({ type: "add", payload: 1 });
          }
          return next(action);
        };

      const dispatch = applyMiddleware(store, [middleware]);
      dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 2 });
    });
  });

  describe("multiple middleware interaction", () => {
    it("supports chaining multiple transformations", () => {
      const store = createStore(reducer, { count: 0 });

      const double: MiddlewareFunction<State> = () => (next) => (action) => {
        if ((action as Action).type === "add") {
          return next({
            ...action,
            payload: ((action as Action).payload as number) * 2,
          } as Action);
        }
        return next(action);
      };

      const increment: MiddlewareFunction<State> = () => (next) => (action) => {
        if ((action as Action).type === "inc") {
          return next({ type: "add", payload: 1 });
        }
        return next(action);
      };

      const dispatch = applyMiddleware(store, [increment, double]);
      dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 2 });
    });
  });

  describe("edge cases", () => {
    it("middleware calling next multiple times applies multiple updates", () => {
      const store = createStore(reducer, { count: 0 });

      const middleware: MiddlewareFunction<State> =
        () => (next) => (action) => {
          next(action);
          next(action);
        };

      const dispatch = applyMiddleware(store, [middleware]);
      dispatch({ type: "inc" });

      expect(store.getState()).toEqual({ count: 2 });
    });

    it("middleware receives stable dispatch reference", () => {
      const store = createStore(reducer, { count: 0 });
      let capturedDispatch!: Dispatch<State>;

      const middleware: MiddlewareFunction<State> = ({ dispatch }) => {
        capturedDispatch = dispatch;
        return (next) => (action) => next(action);
      };

      applyMiddleware(store, [middleware]);

      expect(typeof capturedDispatch).toBe("function");
    });
  });

  describe("applyMiddleware – async / ThunkAction cases", () => {
    it("dispatches a simple ThunkAction", async () => {
      const store = createStore(reducer, { count: 0 });

      const ThunkActionMiddleware: MiddlewareFunction<State> =
        ({ dispatch, getState }) =>
        (next) =>
        (action: Action | ThunkAction<State>) =>
          typeof action === "function"
            ? action(dispatch, getState)
            : next(action);

      const dispatch = applyMiddleware(store, [ThunkActionMiddleware]);

      await dispatch((dispatch) => {
        dispatch({ type: "inc" });
      });

      expect(store.getState().count).toBe(1);
    });

    it("allows ThunkAction to dispatch multiple actions", async () => {
      const store = createStore(reducer, { count: 0 });

      const ThunkActionMiddleware: MiddlewareFunction<State> =
        ({ dispatch, getState }) =>
        (next) =>
        (action: Action | ThunkAction<State>) =>
          typeof action === "function"
            ? action(dispatch, getState)
            : next(action);

      const dispatch = applyMiddleware(store, [ThunkActionMiddleware]);

      await dispatch((dispatch) => {
        dispatch({ type: "inc" });
        dispatch({ type: "add", payload: 5 });
      });

      expect(store.getState().count).toBe(6);
    });

    it("supports async/ThunkAction with setTimeout", async () => {
      const store = createStore(reducer, { count: 0 });

      const ThunkActionMiddleware: MiddlewareFunction<State> =
        ({ dispatch, getState }) =>
        (next) =>
        (action: Action | ThunkAction<State>) =>
          typeof action === "function"
            ? action(dispatch, getState)
            : next(action);

      const dispatch = applyMiddleware(store, [ThunkActionMiddleware]);

      await dispatch(async (dispatch) => {
        await new Promise((r) => setTimeout(r, 10));
        dispatch({ type: "inc" });
      });

      expect(store.getState().count).toBe(1);
    });

    it("ThunkActions can conditionally dispatch", async () => {
      const store = createStore(reducer, { count: 0 });

      const ThunkActionMiddleware: MiddlewareFunction<State> =
        ({ dispatch, getState }) =>
        (next) =>
        (action: Action | ThunkAction<State>) =>
          typeof action === "function"
            ? action(dispatch, getState)
            : next(action);

      const dispatch = applyMiddleware(store, [ThunkActionMiddleware]);

      await dispatch((dispatch, getState) => {
        const { count } = getState() as State;
        if (count === 0) {
          dispatch({ type: "add", payload: 10 });
        }
      });

      expect(store.getState().count).toBe(10);
    });

    it("supports ThunkAction chaining with multiple middleware", async () => {
      const store = createStore(reducer, { count: 0 });

      const ThunkActionMiddleware: MiddlewareFunction<State> =
        ({ dispatch, getState }) =>
        (next) =>
        (action) =>
          typeof action === "function"
            ? action(dispatch, getState)
            : next(action);

      const loggerMiddleware =
        () =>
        (next: Dispatch<State>) =>
        (action: Action | ThunkAction<State>) =>
          next(action);

      const dispatch = applyMiddleware(store, [
        ThunkActionMiddleware,
        loggerMiddleware,
      ]);

      dispatch((dispatch) => {
        dispatch({ type: "inc" });
      });

      expect(store.getState().count).toBe(1);
    });
  });
});
