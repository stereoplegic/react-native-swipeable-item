import { Platform, I18nManager } from "react-native";
export const isWeb = Platform.OS === "web";
export const isRTL = I18nManager.isRTL;
export const renderNull = () => null;
export const MAX_Z_INDEX = 100;
