import type { MiddlewareFunction, ThunkAction } from "./apply-middleware";
import { applyMiddleware } from "./apply-middleware";
import { deepEqual } from "./deep-equal";

export type Action<P = unknown> = {
  type: string;
  payload?: P;
};

export type Dispatch<S> = (action: Action | ThunkAction<S>) => void;

export type Store<S> = {
  getState: () => S;
  dispatch: Dispatch<S>;
  subscribe: (listener: (state: S) => void) => () => void;
};

export type Reducer<S> = (state: S, action: Action) => S;

export function createStore<S>(
  reducer: Reducer<S>,
  initialState: S,
  middlewares: MiddlewareFunction<S>[] = [],
): Store<S> {
  let currentState = initialState;
  const listeners: Set<(state: S) => void> = new Set();

  function getState(): S {
    return currentState;
  }

  function baseDispatch(action: Action | ThunkAction<S>): void {
    const nextState = reducer(currentState, action as Action);
    if (!deepEqual(nextState, currentState)) {
      currentState = nextState;
      listeners.forEach((listener) => {
        listener(currentState);
      });
    }
  }

  function subscribe(listener: (state: S) => void): () => void {
    listeners.add(listener);

    return function unsubscribe(): void {
      listeners.delete(listener);
    };
  }

  const store: Store<S> = {
    getState,
    dispatch: (action: Action | ThunkAction<S>) => baseDispatch(action),
    subscribe,
  };

  if (middlewares.length > 0) {
    store.dispatch = applyMiddleware(store, middlewares);
  }

  return store;
}
