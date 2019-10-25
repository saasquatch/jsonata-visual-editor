/**
 * Binary operators that apply (mostly) to numbers.
 *
 * These do work with string, boolean, etc. but they don't make sense for most end-users
 */
export const numberOperators = {
  ">": "greater than",
  "<": "less than",
  "<=": "less than or equal",
  ">=": "greater than or equal"
} as const;

/**
 * Base operators that apply to all types (string, number, boolean, null)
 */
export const baseOperators = {
  "=": "equals",
  "!=": "not equals"
} as const;

/**
 * Only applies to array functions
 */
export const arrayOperators = {
  in: "array contains"
} as const;

/**
 * Set of all comparion operators. These operators should all return boolean values.
 */
export const comparionsOperators = {
  ...baseOperators,
  ...numberOperators,
  ...arrayOperators
} as const;

/**
 * Combiner operators. These operators should return boolean values
 */
export const combinerOperators = {
  and: "and",
  or: "or"
} as const;

/**
 * Math operators. These operators should return number values
 */
export const mathOperators = {
  "-": "minus",
  "+": "plus",
  "*": "times",
  "/": "divided by",
  "%": "modulo"
} as const;

export const stringOperators = {
  "&": "concatenate"
} as const;

/**
 * Set of *all* binary operators
 */
export const operators = {
  ...comparionsOperators,
  ...mathOperators,
  ...combinerOperators,
  ...stringOperators
} as const;
