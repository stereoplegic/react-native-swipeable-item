import { ReactNode } from "react";
import { DerivedValue } from "react-native-reanimated";
export declare type OpenCloseOptions = {
  animated?: boolean;
};
export declare type OpenDirectionType =
  typeof OpenDirection[keyof typeof OpenDirection];
export declare const OpenDirection: Readonly<{
  NEXT: symbol;
  PREVIOUS: symbol;
  NONE: symbol;
}>;
export declare type OpenPromiseFn = (
  direction: typeof OpenDirection.NEXT | typeof OpenDirection.PREVIOUS,
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
  direction: OpenDirectionType;
};
export declare type OverlayParams<T> = {
  item: T;
  open: OpenPromiseFn;
  close: ClosePromiseFn;
  openDirection: OpenDirectionType;
  percentOpenNext: DerivedValue<number>;
  percentOpenPrevious: DerivedValue<number>;
};
export declare type RenderUnderlay<T> = (
  params: UnderlayParams<T>
) => ReactNode;
export declare type RenderOverlay<T> = (params: OverlayParams<T>) => ReactNode;
export declare const UnderlayContext: import("react").Context<
  UnderlayParams<unknown>
>;
export declare const OverlayContext: import("react").Context<
  OverlayParams<unknown>
>;
