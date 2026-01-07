/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import type { Action, Store } from "../create-store";
import { createStore } from "../create-store";
import { useSelector, useStore } from "./hooks";
import { StoreProvider } from "./store-provider";

type State = {
  count: number;
  text: string;
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "inc":
      return { ...state, count: state.count + 1 };
    case "setText":
      return { ...state, text: action.payload as string };
    default:
      return state;
  }
}

const initialState = { count: 0, text: "hello" };
const store = createStore<State>(reducer, initialState);

function Counter() {
  const count = useSelector<State, number>((s) => s.count);
  return <div data-testid="count">{count}</div>;
}

function Dispatcher() {
  const { dispatch } = useStore();

  return (
    <button
      type="button"
      data-testid="inc"
      onClick={() => dispatch({ type: "inc" })}
    >
      inc
    </button>
  );
}

describe("useSelector", () => {
  it("returns the selected initial state", () => {
    render(
      <StoreProvider store={store}>
        <Counter />
      </StoreProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("re-renders when selected state changes", () => {
    render(
      <StoreProvider store={store}>
        <Counter />
        <Dispatcher />
      </StoreProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");

    fireEvent.click(screen.getByTestId("inc"));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("does not re-render when unrelated state changes", () => {
    const store = createStore(reducer, initialState);
    const renderSpy = jest.fn();

    function SpyComponent() {
      const count = useSelector<State, number>((s) => s.count);
      renderSpy(count);
      return null;
    }

    function TextDispatcher() {
      const { dispatch } = useStore();
      return (
        <button
          type="button"
          data-testid="set-text"
          onClick={() => dispatch({ type: "setText", payload: "world" })}
        />
      );
    }

    render(
      <StoreProvider store={store}>
        <SpyComponent />
        <TextDispatcher />
      </StoreProvider>,
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);

    screen.getByTestId("set-text").click();

    // No re-render because `count` didn't change
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});

describe("useStore", () => {
  it("returns the store instance", () => {
    let storeRef!: Store<State>;

    function Test() {
      storeRef = useStore();
      return null;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(storeRef).toHaveProperty("dispatch");
    expect(storeRef).toHaveProperty("getState");
    expect(storeRef).toHaveProperty("subscribe");
  });

  it("isolates state between multiple providers", () => {
    const storeA = createStore(reducer, { count: 0, text: "" });
    const storeB = createStore(reducer, { count: 10, text: "" });

    function StoreProviderA({ children }: { children: ReactNode }) {
      return <StoreProvider store={storeA}>{children}</StoreProvider>;
    }

    function StoreProviderB({ children }: { children: ReactNode }) {
      return <StoreProvider store={storeB}>{children}</StoreProvider>;
    }

    function CountA() {
      const count = useSelector<State, number>((s) => s.count);
      return <div data-testid="a">{count}</div>;
    }

    function CountB() {
      const count = useSelector<State, number>((s) => s.count);
      return <div data-testid="b">{count}</div>;
    }

    render(
      <>
        <StoreProviderA>
          <CountA />
        </StoreProviderA>
        <StoreProviderB>
          <CountB />
        </StoreProviderB>
      </>,
    );

    expect(screen.getByTestId("a")).toHaveTextContent("0");
    expect(screen.getByTestId("b")).toHaveTextContent("10");
  });
});
