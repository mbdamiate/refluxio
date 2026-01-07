# Refluxio

A **minimal, type-safe, React state management library** inspired by Redux and Zustand, focused on **predictability**, **performance**, and **simplicity**.

Refluxio provides:

* A small reducer-based store
* Middleware & thunk support
* Optimized state updates via deep equality
* First-class React 18 integration using `useSyncExternalStore`
* Zero external dependencies (besides React)

---

## ✨ Features

* ⚛️ **React 18–ready** (`useSyncExternalStore`)
* 🧠 **Reducer-based state** (predictable updates)
* 🔌 **Middleware pipeline** (Redux-style)
* ⚡ **Selective re-renders** via selectors
* 🧩 **Multiple isolated stores** supported
* 📦 **Tiny API surface**
* 🔒 **Type-safe** (TypeScript-first)

---

## Installation

```bash
npm install refluxio
```

or

```bash
yarn add refluxio
```

---

## Quick Start

### 1. Define a reducer

```ts
type State = {
  count: number;
};

type Action = {
  type: "inc" | "dec";
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "inc":
      return { count: state.count + 1 };
    case "dec":
      return { count: state.count - 1 };
    default:
      return state;
  }
}
```

---

### 2. Setup the store

```ts
import { createStore } from "refluxio";

const store = createStore(reducer, initialState, [/** middlewares */]);
```

---

### 3. Use in React components

```tsx
import { StoreProvider, useSelector, useStore } from "refluxio/react";

function Counter() {
  const count = useSelector((s) => s.count);
  const store = useStore();

  return (
    <button onClick={() => store.dispatch({ type: "inc" })}>
      Count: {count}
    </button>
  );
}

export function App() {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}
```

---

## Middleware & Thunks

### Middleware

```ts
const logger = ({ getState }) => (next) => (action) => {
  console.log("before", getState());
  next(action);
  console.log("after", getState());
};
```

```ts
createStore(reducer, initialState, [logger]);
```

---

### Thunks

```ts
store.dispatch((dispatch, getState) => {
  if (getState().count < 10) {
    dispatch({ type: "inc" });
  }
});
```

---

## Multiple Stores

Refluxio supports **multiple isolated stores**:

```tsx
import { createStore } from "refluxio";
import { StoreProvider } from "refluxio/react";

const storeA = createStore(reducer, {}, [/** middlewares */]);
const storeB = createStore(reducer, {}, [/** middlewares */]);

<StoreProviderA store={storeA}>
  <ComponentUsingA />
</StoreProviderA>

<StoreProviderB store={storeB}>
  <ComponentUsingB />
</StoreProviderB>
```

---

## Testing

Refluxio is designed to be easy to test.

### React hooks testing

* Use `@testing-library/react`
* Use `fireEvent` or `userEvent`
* No mocking required

Example:

```ts
fireEvent.click(screen.getByText("inc"));
expect(screen.getByTestId("count")).toHaveTextContent("1");
```

---

## Design Philosophy

* **Minimalism over magic**
* **Explicit state transitions**
* **No proxies, no mutations**
* **React-first, not React-dependent**
* **Performance by default**

Refluxio avoids:

* Hidden reactivity
* Implicit subscriptions
* Global mutable state

---

## Inspiration

* Redux (reducers & middleware)
* Zustand (hooks-first DX)
* React core (`useSyncExternalStore`)

---

## License

MIT
