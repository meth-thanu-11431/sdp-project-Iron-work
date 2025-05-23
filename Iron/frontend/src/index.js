import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client"; // Updated import
import { BrowserRouter as Router } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root")); // Updated rendering
root.render(
  <Router>
    <App />
  </Router>
);
