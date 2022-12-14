import { ForwardedRef, ReactElement, ReactNode } from "react";
import { WithSpringConfig } from "react-native-reanimated";
import {
  OpenDirectionType,
  OpenCloseOptions,
  ClosePromiseFn,
  RenderUnderlay,
  RenderOverlay,
} from "../context";
declare type Props<T> = {
  item: T;
  children?: ReactNode;
  vertical?: boolean;
  renderOverlay?: RenderOverlay<T>;
  renderUnderlayNext?: RenderUnderlay<T>;
  renderUnderlayPrevious?: RenderUnderlay<T>;
  onChange?: (params: {
    openDirection: OpenDirectionType;
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
    openDirection: OpenDirectionType,
    snapPoint?: number,
    options?: OpenCloseOptions
  ) => Promise<void>;
  close: ClosePromiseFn;
};
declare const _default: <T>(
  props: Props<T> & {
    ref?: ForwardedRef<SwipeableImperativeRef>;
  }
) => ReactElement;
export default _default;
