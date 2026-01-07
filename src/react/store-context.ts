import { createContext } from "react";
import type { Store } from "../create-store";

// biome-ignore lint/suspicious/noExplicitAny: State not yet defined
export const StoreContext = createContext<Store<any> | null>(null);
