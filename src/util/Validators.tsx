import { SchemaProvider, ValidatorError, AST } from "../Types";
import { isPathNode, isNumberNode } from "../AstEditor";

export function Validators(schemaProvider: SchemaProvider) {
  return {
    onlyNumberValidator(ast: AST) {
      let error: ValidatorError;
      if (isPathNode(ast)) {
        const pathType =
          schemaProvider && schemaProvider.getTypeAtPath(ast);
        if (!pathType) {
          error = null;
        } else if (["integer", "number", "float"].includes(pathType)) {
          error = null;
        } else {
          error = {
            error: "non-number-schema",
            message: "Use a variable that is a number"
          };
        }
      } else if (!isNumberNode(ast)) {
        error = {
          error: "non-number",
          message: "Use a number"
        };
      }
      return error;
    }
  };
}


