import { createContext } from "react";
export var OpenDirection;
(function (OpenDirection) {
  OpenDirection["NEXT"] = "next";
  OpenDirection["PREVIOUS"] = "previous";
  OpenDirection["NONE"] = "none";
})(OpenDirection || (OpenDirection = {}));
export const UnderlayContext = createContext(undefined);
export const OverlayContext = createContext(undefined);
