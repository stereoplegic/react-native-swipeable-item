import {
  forwardRef,
  ForwardedRef,
  lazy,
  ReactElement,
  ReactNode,
  Suspense,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  WithSpringConfig,
} from "react-native-reanimated";
import { MotiView } from "moti";
import {
  UnderlayParams,
  OverlayParams,
  OpenDirection,
  OpenDirectionType,
  OpenCloseOptions,
  ClosePromiseFn,
  OpenPromiseFn,
  OverlayContext,
  RenderUnderlay,
  RenderOverlay,
} from "../context";
import { styles } from "../styles";
import { renderNull, isWeb, isRTL, MAX_Z_INDEX } from "../shared";

const Underlay = lazy(() => import("./underlay"));
const Overlay = lazy(() => import("./overlay"));

type Props<T> = {
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

export type SwipeableImperativeRef = {
  open: (
    openDirection: OpenDirectionType,
    snapPoint?: number,
    options?: OpenCloseOptions
  ) => Promise<void>;
  close: ClosePromiseFn;
};

function Swipeable<T>(
  props: Props<T>,
  ref: ForwardedRef<SwipeableImperativeRef>
) {
  const {
    item,
    children,
    vertical = false,
    renderOverlay = renderNull,
    renderUnderlayNext = renderNull,
    renderUnderlayPrevious = renderNull,
    snapPointsNext = [],
    snapPointsPrevious = [],
    swipeEnabled,
    activationThreshold = 20,
    overSwipe = 20,
    swipeDamping = 10,
    onChange = () => {},
    animationConfig = {},
  } = props;
  const springConfig: WithSpringConfig = {
    damping: 20,
    mass: 0.2,
    stiffness: 100,
    overshootClamping: false,
    restSpeedThreshold: 0.5,
    restDisplacementThreshold: 0.5,
    ...animationConfig,
  };

  const [openDirection, setOpenDirection] = useState<OpenDirectionType>(
    OpenDirection.NONE
  );

  const animStatePos = useSharedValue<number>(0);
  const isGestureActive = useSharedValue<boolean>(false);

  const swipingNext = useDerivedValue<boolean>(
    () => animStatePos.value < 0,
    [animStatePos]
  );
  const swipingPrevious = useDerivedValue<boolean>(
    () => animStatePos.value > 0,
    [animStatePos]
  );

  const maxSnapPointNext =
    -1 * Math.max(...(snapPointsNext.length ? snapPointsNext : [0]));
  const maxSnapPointPrevious = Math.max(
    ...(snapPointsPrevious.length ? snapPointsPrevious : [0])
  );

  // Only include overswipe if the max snap point is greater than zero
  const maxTranslateNext =
    maxSnapPointNext - (maxSnapPointNext ? overSwipe : 0);
  const maxTranslatePrevious =
    maxSnapPointPrevious + (maxSnapPointPrevious ? overSwipe : 0);

  const percentOpenNext = useDerivedValue(() => {
    return swipingNext.value && maxSnapPointNext
      ? Math.abs(animStatePos.value / maxSnapPointNext)
      : 0;
  }, [maxSnapPointNext]);
  const percentOpenPrevious = useDerivedValue(() => {
    return swipingPrevious.value && maxSnapPointPrevious
      ? Math.abs(animStatePos.value / maxSnapPointPrevious)
      : 0;
  }, [maxSnapPointPrevious]);

  const hasNext = !!snapPointsNext?.length;
  const hasPrevious = !!snapPointsPrevious?.length;

  const activeOffsetNext =
    hasNext || openDirection === OpenDirection.PREVIOUS
      ? -activationThreshold
      : -Number.MAX_VALUE;
  const activeOffsetPrevious =
    hasPrevious || openDirection === OpenDirection.NEXT
      ? activationThreshold
      : Number.MAX_VALUE;
  const activeOffsetPrimaryAxis: number[] = [
    activeOffsetNext,
    activeOffsetPrevious,
  ];

  const open: OpenPromiseFn = (
    direction: typeof OpenDirection.NEXT | typeof OpenDirection.PREVIOUS,
    snapPoint: number | undefined,
    options: OpenCloseOptions | undefined
  ) => {
    const toValue =
      snapPoint ?? direction === OpenDirection.NEXT
        ? maxSnapPointNext
        : maxSnapPointPrevious;

    return new Promise<void>((resolve) => {
      function resolvePromiseIfFinished(isFinished: boolean) {
        if (isFinished) resolve();
        onAnimationEnd(
          direction === OpenDirection.NEXT
            ? OpenDirection.NEXT
            : OpenDirection.PREVIOUS,
          toValue
        );
      }

      if (options?.animated === false) {
        animStatePos.value = toValue;
        runOnJS(resolvePromiseIfFinished)(true);
      } else {
        animStatePos.value = withSpring(toValue, springConfig, (isFinished) => {
          if (isFinished) {
            runOnJS(resolvePromiseIfFinished)(isFinished);
          }
        });
      }
    });
  };

  const close: ClosePromiseFn = (options) => {
    const toValue = 0;
    return new Promise<void>((resolve) => {
      function resolvePromiseIfFinished(isFinished: boolean) {
        if (isFinished) resolve();
        onAnimationEnd(OpenDirection.NONE, toValue);
      }

      if (options?.animated === false) {
        animStatePos.value = toValue;
        runOnJS(resolvePromiseIfFinished)(true);
      } else {
        animStatePos.value = withSpring(toValue, springConfig, (isFinished) => {
          if (isFinished) {
            runOnJS(resolvePromiseIfFinished)(isFinished);
          }
        });
      }
    });
  };

  useImperativeHandle(ref, () => {
    const refObject: SwipeableImperativeRef = {
      open: (openDirection, snapPoint, options) => {
        if (openDirection === OpenDirection.NEXT || OpenDirection.PREVIOUS)
          return open(openDirection, snapPoint, options);
        return close();
      },
      close,
    };
    return refObject;
  });

  function onAnimationEnd(
    _openDirection: OpenDirectionType,
    snapPoint: number
  ) {
    setOpenDirection(_openDirection);
    const didChange =
      openDirection !== OpenDirection.NONE ||
      _openDirection !== OpenDirection.NONE;
    if (didChange) {
      onChange({ openDirection: _openDirection, snapPoint });
    }
  }

  const startPrimaryAxis = useSharedValue(0);

  const onBegin = () => {
    if (isWeb) {
      // onStart not called on web
      // remove when fixed: https://github.com/software-mansion/react-native-gesture-handler/issues/2057
      startPrimaryAxis.value = animStatePos.value;
      isGestureActive.value = true;
    }
  };
  const onStart = () => {
    startPrimaryAxis.value = animStatePos.value;
    isGestureActive.value = true;
  };
  const onUpdate = (evt: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    const rawVal =
      (vertical ? evt.translationY : evt.translationX) + startPrimaryAxis.value;
    const clampedVal = interpolate(
      rawVal,
      [maxTranslateNext, maxTranslatePrevious],
      [maxTranslateNext, maxTranslatePrevious],
      Extrapolate.CLAMP
    );
    animStatePos.value = clampedVal;
  };
  const onEnd = (
    evt: GestureStateChangeEvent<PanGestureHandlerEventPayload>
  ) => {
    isGestureActive.value = false;

    // Approximate where item would end up with velocity taken into account
    const velocityModifiedPosition =
      animStatePos.value +
      (vertical ? evt.velocityY : evt.velocityX) / swipeDamping;

    const allSnapPoints = snapPointsNext
      .map((p) => p * -1)
      .concat(snapPointsPrevious);

    // The user is not required to designate [0] in their snap point array,
    // but we need to make sure 0 is a snap point.
    allSnapPoints.push(0);

    const closestSnapPoint = allSnapPoints.reduce((acc, cur) => {
      const diff = Math.abs(velocityModifiedPosition - cur);
      const prevDiff = Math.abs(velocityModifiedPosition - acc);
      return diff < prevDiff ? cur : acc;
    }, Infinity);

    const onComplete = () => {
      "worklet";
      const openDirection =
        closestSnapPoint === 0
          ? OpenDirection.NONE
          : !vertical && isRTL // No need to flip next/previous for vertical
          ? closestSnapPoint > 0
            ? OpenDirection.NEXT
            : OpenDirection.PREVIOUS
          : closestSnapPoint > 0
          ? OpenDirection.PREVIOUS
          : OpenDirection.NEXT;
      runOnJS(onAnimationEnd)(openDirection, Math.abs(closestSnapPoint));
    };
    if (animStatePos.value === closestSnapPoint) onComplete();
    else
      animStatePos.value = withSpring(
        closestSnapPoint,
        springConfig,
        onComplete
      );
  };
  const gesture = Gesture.Pan()
    .onBegin(onBegin)
    .onStart(onStart)
    .onUpdate(onUpdate)
    .onEnd(onEnd)
    .enabled(swipeEnabled !== false)
    .activeOffsetX(vertical ? 0 : activeOffsetPrimaryAxis)
    .activeOffsetY(vertical ? activeOffsetPrimaryAxis : 0);

  const sharedParams = useMemo(
    () => ({
      item,
      isGestureActive,
      close,
    }),
    []
  );

  const overlayParams = useMemo(() => {
    // If there is only one swipe direction, use it as the 'open' function. Otherwise we need to choose one.
    const openFn =
      hasNext && !hasPrevious
        ? open(OpenDirection.NEXT)
        : hasPrevious && !hasNext
        ? open(OpenDirection.PREVIOUS)
        : open(OpenDirection.NEXT);

    return {
      open: open,
      percentOpenNext,
      percentOpenPrevious,
      openDirection,
      openFn,
      ...sharedParams,
    };
  }, [
    open,
    openDirection,
    percentOpenNext,
    percentOpenPrevious,
    hasNext,
    hasPrevious,
  ]);

  return (
    <OverlayContext.Provider value={overlayParams}>
      {renderUnderlayNext && (
        <Suspense fallback={null}>
          <Underlay
            direction={OpenDirection.NEXT}
            item={item}
            open={open}
            sharedParams={sharedParams}
            percentOpenNext={percentOpenNext}
            percentOpenPrevious={percentOpenPrevious}
            renderUnderlayNext={renderUnderlayNext}
            renderUnderlayPrevious={renderUnderlayPrevious}
          />
        </Suspense>
      )}
      <GestureDetector gesture={gesture}>
        <Suspense fallback={null}>
          <Overlay vertical={vertical} animStatePos={animStatePos}>
            {children}
            {renderOverlay(overlayParams)}
          </Overlay>
        </Suspense>
      </GestureDetector>
    </OverlayContext.Provider>
  );
}

export default forwardRef(Swipeable) as <T>(
  props: Props<T> & { ref?: ForwardedRef<SwipeableImperativeRef> }
) => ReactElement;
