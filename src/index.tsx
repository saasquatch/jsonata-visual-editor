import React, { useState } from "react";
import ReactDOM from "react-dom";
import jsonata from "jsonata";

import { Editor } from "./AstEditor";
import { ErrorBoundary } from "./ErrorBoundary";
import { DefaultTheme } from "./DefaultTheme";

const set = jsonata(`[Q = 0, Q = 1, Q = 3]`).ast();
const obj = jsonata(`{"one":Q = 0, "two": Q = 1,  "three": Q = 3}`).ast();
const cond = jsonata(`Q = 0 ? "one" : Q =1 ? "two" : "three"`).ast();

const defaultAst = set;
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
      <Editor ast={ast} onChange={setAst} theme={DefaultTheme} />
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
