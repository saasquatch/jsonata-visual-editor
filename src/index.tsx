import React, { useState } from "react";
import ReactDOM from "react-dom";
import jsonata from "jsonata";

import { Editor } from "./AstEditor";
import { ErrorBoundary } from "./ErrorBoundary";

const set = `[Q = 0, Q = 1, Q = 3]`;
const obj = `{"one":Q = 0, "two": Q = 1,  "three": Q = 3}`;
const cond = `Q = 0 ? "one" : Q =1 ? "two" : "three"`;

const simpleCondition = cond;
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
      <div style={{ marginTop: "500px" }}>
        <pre>
          Keys used: {JSON.stringify(keys, null, 2)} {typeof keys} <br />
          {JSON.stringify(ast, null, 2)}
        </pre>
      </div>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
