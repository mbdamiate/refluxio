import type { Action, Dispatch, Store } from "./create-store";

export type ThunkAction<S> = (dispatch: Dispatch<S>, getState: () => S) => void;

export type Middleware<S> = {
  dispatch: Dispatch<S>;
  getState: () => S;
};

export type MiddlewareFunction<S> = (
  middleware: Middleware<S>,
) => (next: Dispatch<S>) => Dispatch<S>;

export function applyMiddleware<S>(
  store: Store<S>,
  middlewares: MiddlewareFunction<S>[] = [],
): Dispatch<S> {
  let dispatch: Dispatch<S> = () => {
    throw new Error(
      "Dispatching while constructing middleware is not allowed.",
    );
  };

  let isReducing = false;

  // Wrap the store's dispatch to protect reducer execution
  const guardedDispatch: Dispatch<S> = (action: Action | ThunkAction<S>) => {
    if (isReducing) {
      throw new Error(
        "Dispatching while a reducer is executing is not allowed.",
      );
    }

    try {
      isReducing = true;
      return store.dispatch(action);
    } finally {
      isReducing = false;
    }
  };

  const chain = middlewares.map((mw) =>
    mw({
      getState: store.getState,
      dispatch: (action: Action | ThunkAction<S>) => {
        if (typeof action === "function") {
          return action(dispatch, store.getState);
        }

        dispatch(action);
      },
    }),
  );

  dispatch = chain.reduceRight((next, mw) => mw(next), guardedDispatch);

  return dispatch;
}
