import type { Context } from "react";
import { useContext, useSyncExternalStore } from "react";
import type { Store } from "../create-store";
import { StoreContext } from "./store-context";

export function useSelector<T, S>(selector: (state: T) => S): S {
  const store = useStore();

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState() as T),
    () => selector(store.getState() as T),
  );
}

export function useStore<T>(): Store<T> {
  const store = useContext(StoreContext as unknown as Context<Store<T>>);

  if (!store) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return store;
}
