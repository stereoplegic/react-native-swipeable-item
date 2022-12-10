import { createContext } from "react";
import { DerivedValue } from "react-native-reanimated";

export type OpenCloseOptions = { animated?: boolean };
export enum OpenDirection {
  NEXT = "next",
  PREVIOUS = "previous",
  NONE = "none",
}
export type OpenPromiseFn = (
  snapPoint?: number,
  options?: OpenCloseOptions
) => Promise<void>;
export type ClosePromiseFn = (options?: OpenCloseOptions) => Promise<void>;

export type UnderlayParams<T> = {
  item: T;
  open: OpenPromiseFn;
  close: ClosePromiseFn;
  percentOpen: DerivedValue<number>;
  isGestureActive: DerivedValue<boolean>;
  direction: OpenDirection;
};

export type OverlayParams<T> = {
  item: T;
  openNext: OpenPromiseFn;
  openPrevious: OpenPromiseFn;
  close: ClosePromiseFn;
  openDirection: OpenDirection;
  percentOpenNext: DerivedValue<number>;
  percentOpenPrevious: DerivedValue<number>;
};
export const UnderlayContext = createContext<
  UnderlayParams<unknown> | undefined
>(undefined);
export const OverlayContext = createContext<OverlayParams<unknown> | undefined>(
  undefined
);
