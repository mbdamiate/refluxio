import type { ReactNode } from "react";
import type { Store } from "../create-store";
import { StoreContext } from "./store-context";

type StoreProviderProps<T> = {
  children: ReactNode;
  store: Store<T>;
};

export function StoreProvider<T>({ children, store }: StoreProviderProps<T>) {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
