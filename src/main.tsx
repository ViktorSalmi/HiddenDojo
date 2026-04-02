import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app";
import "./styles/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error('Missing root element with id "root".');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
