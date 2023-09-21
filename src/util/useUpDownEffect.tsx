import React, { useEffect, useState } from "react";

/**
 *
 * @param value the prop value
 * @param onChange the onChange callback
 * @param effect the effect to call when the downward value changes
 */
export function useUpDownEffect<T>(
  value: T,
  onChange: (v: T) => void,
  effect: React.EffectCallback
) {
  const [upwardValue, setUpward] = useState<T | null>(null);
  useEffect(() => {
    if (value !== upwardValue) {
      setUpward(value);
      effect();
    }
  }, [value]);
  const upWardChange = (up: T) => {
    setUpward(up);
    onChange(up);
  };
  return [upWardChange];
}
