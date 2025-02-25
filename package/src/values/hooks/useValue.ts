import { useMemo } from "react";

import { ValueApi } from "../api";
import type { SkiaValue } from "../types";

/**
 * Creates a new value that holds some data.
 * @param v Value to hold
 * @returns A Value of type of v
 */
export const useValue = <T>(v: T): SkiaValue<T> => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ValueApi.createValue(v), []);
};
