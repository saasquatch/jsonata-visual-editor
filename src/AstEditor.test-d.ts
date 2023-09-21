import { JsonataASTNode } from "jsonata-ui-core";
import { expectTypeOf, test } from "vitest";
import { isMath, isNumberNode, isPathNode } from "./util/isNode";
/**
 * 
 * Type tests
 * 
 * These are included for backwards compatibility, to make sure we didn't bork our exports
 * for the consumers that are relying on the Component API
 * 
 * 
 * See: https://vitest.dev/guide/testing-types.html
 */


test("Type checking utils are backward compatibly typed", () => {
  expectTypeOf(isPathNode).toBeFunction();
  expectTypeOf(isPathNode).returns.toBeBoolean();
  expectTypeOf(isPathNode).parameter(0).toMatchTypeOf<JsonataASTNode>();

  expectTypeOf(isMath).toBeFunction();
  expectTypeOf(isMath).returns.toBeBoolean();
  expectTypeOf(isMath).parameter(0).toMatchTypeOf<JsonataASTNode>();

  expectTypeOf(isNumberNode).toBeFunction();
  expectTypeOf(isNumberNode).returns.toBeBoolean();
  expectTypeOf(isNumberNode).parameter(0).toMatchTypeOf<JsonataASTNode>();
});
