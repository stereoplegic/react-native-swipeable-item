import { useCallback, useContext, useMemo } from "react";
import {
  UnderlayParams,
  OverlayParams,
  OpenDirection,
  OpenDirectionType,
  OverlayContext,
  UnderlayContext,
} from "../context";

export function useUnderlayParams<T>() {
  const underlayContext = useContext(UnderlayContext);
  if (!underlayContext) {
    throw new Error(
      "useUnderlayParams must be called from within an UnderlayContext.Provider!"
    );
  }
  return underlayContext as UnderlayParams<T>;
}

export function useOverlayParams<T>() {
  const overlayContext = useContext(OverlayContext);
  if (!overlayContext) {
    throw new Error(
      "useOverlayParams must be called from within an OverlayContext.Provider!"
    );
  }
  return overlayContext as OverlayParams<T>;
}

export function useSwipeableParams<T>() {
  const overlayContext = useContext(OverlayContext) as
    | OverlayParams<T>
    | undefined;
  if (!overlayContext) {
    throw new Error(
      "useSwipeableParams must be called from within an OverlayContext.Provider!"
    );
  }
  const underlayContext = useContext(UnderlayContext);
  const contextDirection = underlayContext?.direction;

  const open = useCallback(
    (snapPoint?: number, direction?: OpenDirectionType) => {
      const openDirection = direction || contextDirection;
      const openFn =
        openDirection === OpenDirection.NEXT
          ? open(OpenDirection.NEXT)
          : open(OpenDirection.PREVIOUS);
      return openFn(snapPoint);
    },
    [overlayContext, contextDirection]
  );

  const percentOpen = useMemo(() => {
    if (contextDirection) {
      // If we're calling from within an underlay context, return the open percentage of that underlay
      return contextDirection === OpenDirection.NEXT
        ? overlayContext.percentOpenNext
        : overlayContext.percentOpenPrevious;
    }
    // Return the open percentage of the active swipe direction
    return overlayContext.openDirection === OpenDirection.NEXT
      ? overlayContext.percentOpenNext
      : overlayContext.percentOpenPrevious;
  }, [overlayContext]);

  return {
    ...overlayContext,
    open,
    percentOpen,
  };
}
