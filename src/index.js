import React, { useState } from "react";
import ReactDOM from "react-dom";
import jsonata from "jsonata";
import { Form } from "react-bootstrap";

import { Editor } from "./AstEditor";
import { ErrorBoundary } from "./ErrorBoundary";
import getPaths from "./PathSuggester";
import PurchaseEvent from "./PurchaseEvent.schema";

const PurchasePaths = getPaths(PurchaseEvent);

const simpleCondition = `a = "one" or b = "two"`;
const expr = jsonata(simpleCondition);
const defaultAst = expr.ast();
const introspection = jsonata(`**[type="name"].value`);

function App() {
  const [ast, setAst] = useState(defaultAst);

  const keys = introspection.evaluate(ast);

  return (
    <ErrorBoundary>
      <h1>Query Builder</h1>
      <p>Filter for which Purchase events will trigger this program</p>
      {/* <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows="4"
          cols="50"
        />
        <button onClick={toAst}>-></button>
      </div> */}
      <Editor ast={ast} text={simpleCondition} onChange={setAst} />
      Paths:{" "}
      {PurchasePaths.map(p => (
        <span>{p["@path"]}</span>
      ))}
      <PathSelect pathList={PurchasePaths} />
      <div style={{ marginTop: "500px" }}>
        <pre>
          Keys used: {JSON.stringify(keys, null, 2)} {typeof keys} <br />
          {JSON.stringify(ast, null, 2)}
        </pre>
      </div>
    </ErrorBoundary>
  );
}

function PathSelect({ pathList }) {
  return (
    <Form.Group controlId="exampleForm.ControlSelect1">
      <Form.Label>Example select fpr {typeof pathList}</Form.Label>
      <Form.Control as="select" children={PathOptions({ pathList })} />
    </Form.Group>
  );
}

function PathOptions({ pathList }) {
  // const children = [<option>foo</option>, <option>foo</option>];

  const children = pathList.reduce((acc, p) => {
    let subPaths = [];
    if (p.subPaths && p.subPaths.length > 0) {
      const nextChildren = PathOptions({ pathList: p.subPaths });
      subPaths = [
        <optgroup label={p.title + " children"} children={nextChildren} />
      ];
    }
    return [
      ...acc,
      <option>
        {p.title} - {p.path.padStart(20 - p.title.length)}
      </option>,
      ...subPaths
    ];
  }, []);
  return children;
}
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
