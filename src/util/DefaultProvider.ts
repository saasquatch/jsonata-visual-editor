import {
  BinaryNode,
  ConditionNode,
  StringNode,
  NumberNode,
  PathNode
} from "./jsonata";
import { DefaultProvider } from "../Types";

export const StandardDefaultProvider: DefaultProvider = {
  defaultString,
  defaultNumber,
  defaultComparison,
  defaultCondition,
  defaultPath
};
function defaultString(): StringNode {
  return {
    value: "text",
    type: "string",
    position: undefined
  };
}
function defaultNumber(): NumberNode {
  return {
    value: 0,
    type: "number",
    position: undefined
  };
}
function defaultComparison(): BinaryNode {
  return {
    type: "binary",
    value: "=",
    lhs: defaultPath(),
    rhs: defaultNumber(),
    position: undefined
  };
}
function defaultCondition(): ConditionNode {
  return {
    type: "condition",
    condition: defaultComparison(),
    then: defaultString(),
    else: defaultString(),
    position: undefined,
    value: undefined
  };
}

export function defaultPath(): PathNode {
  return {
    type: "path",
    steps: [
      {
        type: "name",
        value: "revenue",
        position: 0
      }
    ],
    position: undefined,
    value: undefined
  };
}
