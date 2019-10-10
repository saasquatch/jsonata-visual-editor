export function serializer(node) {
  if (node.type === "binary") {
    return serializer(node.lhs) + " " + node.value + " " + serializer(node.rhs);
  } else if (node.type === "function") {
    /*{
        "type": "function",
        "value": "(",
        "position": 9,
        "arguments": [
          {
            "value": 10,
            "type": "number",
            "position": 11
          }
        ],
        "procedure": {
          "value": "revenue",
          "type": "variable",
          "position": 8
        }
    }
    */
    return (
      serializer(node.procedure) +
      "(" +
      (node.arguments ? node.arguments.map(serializer).join(", ") : "") +
      ")"
    );
  } else if (node.type === "variable") {
    const predicate = node.predicate
      ? node.predicate.map(serializer).join()
      : "";
    return "$" + node.value + predicate;
  } else if (node.type === "wildcard") {
    return node.value;
  } else if (node.type === "number") {
    return node.value;
  } else if (node.type === "string") {
    return `"` + node.value + `"`;
  } else if (node.type === "name") {
    let stages = "";
    if (node.stages) {
      stages = node.stages.map(serializer).join("");
    }
    let name = node.value;
    if (/\s/.test(name) || ["null", "false", "true"].includes(name)) {
      // Escaped for whitespace
      name = "`" + name + "`";
    }
    return name + stages;
  } else if (node.type === "filter") {
    return "[" + serializer(node.expr) + "]";
  } else if (node.type === "value") {
    if (node.value === null) return "null";
    if (node.value === false) return "false";
    if (node.value === true) return "true";
    throw Error("Unhandled value node " + node.value);
  } else if (node.type === "block") {
    return "(" + node.expressions.map(serializer).join("; ") + ")";
  } else if (node.type === "path") {
    return node.steps.map(serializer).join(".");
  } else if (node.type === "apply") {
    return node.value;
  } else if (node.type === "unary") {
    return (
      node.value +
      "\n\t" +
      node.lhs
        .map(set => serializer(set[0]) + ":" + serializer(set[1]))
        .join(",\n\t") +
      "\n}"
    );
  }

  return "Error: Invalid node type.";
}
