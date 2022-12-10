import { UnderlayParams, OverlayParams, OpenDirection } from "../context";
export declare function useUnderlayParams<T>(): UnderlayParams<T>;
export declare function useOverlayParams<T>(): OverlayParams<T>;
export declare function useSwipeableParams<T>(): {
  open: (
    snapPoint?: number | undefined,
    direction?: OpenDirection | undefined
  ) => Promise<void>;
  percentOpen: Readonly<{
    value: number;
  }>;
  item: T;
  openNext: import("../context").OpenPromiseFn;
  openPrevious: import("../context").OpenPromiseFn;
  close: import("../context").ClosePromiseFn;
  openDirection: OpenDirection;
  percentOpenNext: Readonly<{
    value: number;
  }>;
  percentOpenPrevious: Readonly<{
    value: number;
  }>;
};
