import {
  forwardRef,
  ForwardedRef,
  ReactElement,
  ReactNode,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  WithSpringConfig,
  useAnimatedProps,
} from "react-native-reanimated";
import {
  UnderlayParams,
  OverlayParams,
  OpenDirection,
  OpenCloseOptions,
  ClosePromiseFn,
  OpenPromiseFn,
  OverlayContext,
  UnderlayContext,
} from "./context";
import { styles } from "./styles";

const isWeb = Platform.OS === "web";

const renderNull = () => null;

const MAX_Z_INDEX = 100;

export type RenderUnderlay<T> = (params: UnderlayParams<T>) => ReactNode;
export type RenderOverlay<T> = (params: OverlayParams<T>) => ReactNode;

type Props<T> = {
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

export type SwipeableImperativeRef = {
  open: (
    openDirection: OpenDirection,
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

  const [openDirection, setOpenDirection] = useState(OpenDirection.NONE);

  const animStatePos = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  const swipingNext = useDerivedValue(
    () => animStatePos.value < 0,
    [animStatePos]
  );
  const swipingPrevious = useDerivedValue(
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

  const nextStyle = useAnimatedStyle(() => {
    const opacity = percentOpenNext.value > 0 ? 1 : 0;
    const zIndex = Math.floor(
      Math.min(percentOpenNext.value * MAX_Z_INDEX, MAX_Z_INDEX - 1)
    );

    return isWeb ? { opacity, zIndex } : { opacity };
  }, []);
  const previousStyle = useAnimatedStyle(() => {
    const opacity = percentOpenPrevious.value > 0 ? 1 : 0;
    const zIndex = Math.floor(
      Math.min(percentOpenPrevious.value * MAX_Z_INDEX, MAX_Z_INDEX - 1)
    );

    return isWeb ? { opacity, zIndex } : { opacity };
  }, []);
  const overlayStyle = useAnimatedStyle(() => {
    const transform = [
      vertical
        ? { translateY: animStatePos.value }
        : { translateX: animStatePos.value },
    ];
    const zIndex = MAX_Z_INDEX;

    return isWeb ? { transform, zIndex } : { transform };
  }, [animStatePos]);

  const openNext: OpenPromiseFn = (snapPoint, options) => {
    const toValue = snapPoint ?? maxSnapPointNext;

    return new Promise<void>((resolve) => {
      function resolvePromiseIfFinished(isFinished: boolean) {
        if (isFinished) resolve();
        onAnimationEnd(OpenDirection.NEXT, toValue);
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

  const openPrevious: OpenPromiseFn = (snapPoint, options) => {
    const toValue = snapPoint ?? maxSnapPointPrevious;

    return new Promise<void>((resolve) => {
      function resolvePromiseIfFinished(isFinished: boolean) {
        if (isFinished) resolve();
        onAnimationEnd(OpenDirection.PREVIOUS, toValue);
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
        if (openDirection === OpenDirection.NEXT)
          return openNext(snapPoint, options);
        if (openDirection === OpenDirection.PREVIOUS)
          return openPrevious(snapPoint, options);
        return close();
      },
      close,
    };
    return refObject;
  });

  function onAnimationEnd(_openDirection: OpenDirection, snapPoint: number) {
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

  const underlayPreviousParams = useMemo(() => {
    return {
      open: openPrevious,
      percentOpen: percentOpenPrevious,
      direction: OpenDirection.PREVIOUS,
      ...sharedParams,
    };
  }, [percentOpenPrevious, openPrevious, sharedParams]);

  const underlayNextParams = useMemo(() => {
    return {
      open: openNext,
      percentOpen: percentOpenNext,
      direction: OpenDirection.NEXT,
      ...sharedParams,
    };
  }, [item, percentOpenNext, openNext, sharedParams]);

  const overlayParams = useMemo(() => {
    // If there is only one swipe direction, use it as the 'open' function. Otherwise we need to choose one.
    const open =
      hasNext && !hasPrevious
        ? openNext
        : hasPrevious && !hasNext
        ? openPrevious
        : openNext;

    return {
      openNext: openNext,
      openPrevious: openPrevious,
      percentOpenNext,
      percentOpenPrevious,
      openDirection,
      open,
      ...sharedParams,
    };
  }, [
    openNext,
    openPrevious,
    openDirection,
    percentOpenNext,
    percentOpenPrevious,
    hasNext,
    hasPrevious,
  ]);

  const animPropsNext = useAnimatedProps(() => {
    // useAnimatedProps broken on web: https://github.com/software-mansion/react-native-reanimated/issues/1808
    // update: shouldn't be necessary anymore: https://github.com/software-mansion/react-native-reanimated/pull/1819
    // if (isWeb)
    //     return { pointerEvents: "auto" };
    return {
      pointerEvents:
        percentOpenNext.value > 0 ? ("auto" as const) : ("none" as const),
    };
  }, []);

  const animPropsPrevious = useAnimatedProps(() => {
    // useAnimatedProps broken on web: https://github.com/software-mansion/react-native-reanimated/issues/1808
    // update: shouldn't be necessary anymore: https://github.com/software-mansion/react-native-reanimated/pull/1819
    // if (isWeb)
    //     return { pointerEvents: "auto" };
    return {
      pointerEvents:
        percentOpenPrevious.value > 0 ? ("auto" as const) : ("none" as const),
    };
  }, []);

  return (
    <OverlayContext.Provider value={overlayParams}>
      <Animated.View
        animatedProps={animPropsNext}
        style={[styles.underlay, nextStyle]}
      >
        <UnderlayContext.Provider value={underlayNextParams}>
          {renderUnderlayNext(underlayNextParams)}
        </UnderlayContext.Provider>
      </Animated.View>
      <Animated.View
        animatedProps={animPropsPrevious}
        style={[styles.underlay, previousStyle]}
      >
        <UnderlayContext.Provider value={underlayPreviousParams}>
          {renderUnderlayPrevious(underlayPreviousParams)}
        </UnderlayContext.Provider>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.flex, overlayStyle]}>
          {children}
          {renderOverlay(overlayParams)}
        </Animated.View>
      </GestureDetector>
    </OverlayContext.Provider>
  );
}

export default forwardRef(Swipeable) as <T>(
  props: Props<T> & { ref?: ForwardedRef<SwipeableImperativeRef> }
) => ReactElement;
