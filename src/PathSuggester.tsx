function getPaths(schema) {
  let paths = [];
  if (schema.anyOf) {
    paths = [...paths, schema.anyOf.map(getPaths)];
  } else if (schema.oneOf) {
    paths = [...paths, schema.oneOf.map(getPaths)];
  } else if (schema.allOf) {
    paths = [...paths, schema.allOf.map(getPaths)];
  }

  if (schema.type === "object") {
    const objectPaths = Object.keys(schema.properties).map(k => {
      const subSchema = schema.properties[k];
      const { title, description } = subSchema;
      return {
        path: k,
        title,
        description,
        subPaths: getPaths(subSchema).map(n => {
          return {
            ...n,
            path: k + "." + n.path
          };
        })
      };
    });
    paths = [...paths, ...objectPaths];
  } else if (schema.type === "array") {
    paths = [
      {
        path: "[0]",
        title: "First Element",
        subPaths: getPaths(schema.items).map(n => {
          return {
            ...n,
            path: "[0]." + n.path
          };
        })
      },
      {
        path: "[-1]",
        title: "Last Element"
        // subPaths: getPaths(schema.items)
      }
    ];
  }
  return paths;
}

export default getPaths;
