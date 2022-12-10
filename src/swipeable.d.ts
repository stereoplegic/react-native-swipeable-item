import { ForwardedRef, ReactElement, ReactNode } from "react";
import { WithSpringConfig } from "react-native-reanimated";
import {
  UnderlayParams,
  OverlayParams,
  OpenDirection,
  OpenCloseOptions,
  ClosePromiseFn,
} from "./context";
export declare type RenderUnderlay<T> = (
  params: UnderlayParams<T>
) => ReactNode;
export declare type RenderOverlay<T> = (params: OverlayParams<T>) => ReactNode;
declare type Props<T> = {
  item: T;
  children?: ReactNode;
  vertical?: boolean;
  renderOverlay?: RenderOverlay<T>;
  renderUnderlayNext?: RenderUnderlay<T>;
  renderUnderlayPrevious?: RenderUnderlay<T>;
  onChange?: (params: {
    openDirection: OpenDirection;
    snapPoint: number;
  }) => void;
  overSwipe?: number;
  animationConfig?: Partial<WithSpringConfig>;
  activationThreshold?: number;
  swipeEnabled?: boolean;
  snapPointsNext?: number[];
  snapPointsPrevious?: number[];
  swipeDamping?: number;
};
export declare type SwipeableImperativeRef = {
  open: (
    openDirection: OpenDirection,
    snapPoint?: number,
    options?: OpenCloseOptions
  ) => Promise<void>;
  close: ClosePromiseFn;
};
declare const _default: <T>(
  props: Props<T> & {
    ref?: ForwardedRef<SwipeableImperativeRef> | undefined;
  }
) => ReactElement;
export default _default;
