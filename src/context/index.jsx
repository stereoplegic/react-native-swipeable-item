import { createContext } from "react";
export const OpenDirection = Object.freeze({
  NEXT: Symbol("next"),
  PREVIOUS: Symbol("previous"),
  NONE: Symbol("none"),
});
export const UnderlayContext = createContext(undefined);
export const OverlayContext = createContext(undefined);
