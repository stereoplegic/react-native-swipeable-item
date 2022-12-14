import { useAnimatedStyle } from "react-native-reanimated";
import { MotiView } from "moti";
import { isWeb, MAX_Z_INDEX } from "../shared";
import { styles } from "../styles";

export default function Overlay({ vertical, animStatePos, children }) {
  const overlayStyle = useAnimatedStyle(() => {
    const transform = [
      vertical
        ? { translateY: animStatePos.value }
        : { translateX: animStatePos.value },
    ];
    const zIndex = MAX_Z_INDEX;

    return isWeb ? { transform, zIndex } : { transform };
  }, [animStatePos]);
  return <MotiView style={[styles.flex, overlayStyle]}>{children}</MotiView>;
}
