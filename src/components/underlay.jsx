import { useMemo } from "react";
import { useAnimatedProps, useDerivedValue } from "react-native-reanimated";
import { MotiView } from "moti";
import { OpenDirection, UnderlayContext } from "../context";
import { styles } from "../styles";
import { isWeb, MAX_Z_INDEX } from "../shared";
export default function Underlay({
  item,
  direction,
  sharedParams,
  open,
  percentOpenNext,
  percentOpenPrevious,
  renderUnderlayNext,
  renderUnderlayPrevious,
}) {
  const underlayParams = useMemo(
    () => ({
      open: open(direction),
      percentOpen: percentOpenNext,
      direction: direction,
      ...sharedParams,
    }),
    [item, percentOpenNext, open, sharedParams]
  );
  const animatedProps = useAnimatedProps(
    () =>
      // useAnimatedProps broken on web: https://github.com/software-mansion/react-native-reanimated/issues/1808
      // update: shouldn't be necessary anymore: https://github.com/software-mansion/react-native-reanimated/pull/1819
      // if (isWeb)
      //     return { pointerEvents: "auto" };
      direction === OpenDirection.NEXT
        ? {
            pointerEvents: percentOpenNext.value > 0 ? "auto" : "none",
          }
        : {
            pointerEvents: percentOpenPrevious.value > 0 ? "auto" : "none",
          },
    []
  );
  return (
    <MotiView
      // Split animatedProps and animate into separate components for web, per Moti docs
      animatedProps={animatedProps}
      style={[styles.underlay]}
    >
      <MotiView
        style={[styles.underlay]}
        animate={useDerivedValue(() => {
          const opacity =
            (direction === OpenDirection.NEXT
              ? percentOpenNext.value
              : percentOpenPrevious.value) > 0
              ? 1
              : 0;
          const zIndex = Math.floor(
            Math.min(
              (direction === OpenDirection.NEXT
                ? percentOpenNext.value
                : percentOpenPrevious.value) * MAX_Z_INDEX,
              MAX_Z_INDEX - 1
            )
          );
          return isWeb ? { opacity, zIndex } : { opacity };
        }, [])}
      >
        <UnderlayContext.Provider value={underlayParams}>
          {direction === OpenDirection.NEXT
            ? renderUnderlayNext(underlayParams)
            : renderUnderlayPrevious(underlayParams)}
        </UnderlayContext.Provider>
      </MotiView>
    </MotiView>
  );
}
