/// <reference types="react" />
import { DerivedValue } from "react-native-reanimated";
export declare type OpenCloseOptions = {
  animated?: boolean;
};
export declare enum OpenDirection {
  NEXT = "next",
  PREVIOUS = "previous",
  NONE = "none",
}
export declare type OpenPromiseFn = (
  snapPoint?: number,
  options?: OpenCloseOptions
) => Promise<void>;
export declare type ClosePromiseFn = (
  options?: OpenCloseOptions
) => Promise<void>;
export declare type UnderlayParams<T> = {
  item: T;
  open: OpenPromiseFn;
  close: ClosePromiseFn;
  percentOpen: DerivedValue<number>;
  isGestureActive: DerivedValue<boolean>;
  direction: OpenDirection;
};
export declare type OverlayParams<T> = {
  item: T;
  openNext: OpenPromiseFn;
  openPrevious: OpenPromiseFn;
  close: ClosePromiseFn;
  openDirection: OpenDirection;
  percentOpenNext: DerivedValue<number>;
  percentOpenPrevious: DerivedValue<number>;
};
export declare const UnderlayContext: import("react").Context<
  UnderlayParams<unknown> | undefined
>;
export declare const OverlayContext: import("react").Context<
  OverlayParams<unknown> | undefined
>;
