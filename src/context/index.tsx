import { createContext, ReactNode } from "react";
import { DerivedValue } from "react-native-reanimated";

export type OpenCloseOptions = { animated?: boolean };
export type OpenDirectionType =
  typeof OpenDirection[keyof typeof OpenDirection];

export const OpenDirection = Object.freeze({
  NEXT: Symbol("next"),
  PREVIOUS: Symbol("previous"),
  NONE: Symbol("none"),
});

export type OpenPromiseFn = (
  direction: typeof OpenDirection.NEXT | typeof OpenDirection.PREVIOUS,
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
  direction: OpenDirectionType;
};

export type OverlayParams<T> = {
  item: T;
  open: OpenPromiseFn;
  close: ClosePromiseFn;
  openDirection: OpenDirectionType;
  percentOpenNext: DerivedValue<number>;
  percentOpenPrevious: DerivedValue<number>;
};

export type RenderUnderlay<T> = (params: UnderlayParams<T>) => ReactNode;
export type RenderOverlay<T> = (params: OverlayParams<T>) => ReactNode;

export const UnderlayContext = createContext<
  UnderlayParams<unknown> | undefined
>(undefined);
export const OverlayContext = createContext<OverlayParams<unknown> | undefined>(
  undefined
);
