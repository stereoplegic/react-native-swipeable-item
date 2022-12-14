import { UnderlayParams, OverlayParams } from "../context";
export declare function useUnderlayParams<T>(): UnderlayParams<T>;
export declare function useOverlayParams<T>(): OverlayParams<T>;
export declare function useSwipeableParams<T>(): {
  open: any;
  percentOpen: Readonly<{
    value: number;
  }>;
  item: T;
  close: import("../context").ClosePromiseFn;
  openDirection: symbol;
  percentOpenNext: Readonly<{
    value: number;
  }>;
  percentOpenPrevious: Readonly<{
    value: number;
  }>;
};
