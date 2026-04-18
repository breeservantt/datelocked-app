import React from "react";

// Main Card container
const Card = ({ children, className = "" }) => (
  <div className={`card ${className}`} style={{
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "16px",
    backgroundColor: "#fff"
  }}>
    {children}
  </div>
);

// Card Header
const CardHeader = ({ children }) => (
  <div className="card-header" style={{
    marginBottom: "8px",
    fontWeight: "bold",
    fontSize: "1.2em"
  }}>
    {children}
  </div>
);

// Card Content
const CardContent = ({ children }) => (
  <div className="card-content" style={{
    fontSize: "1em",
    color: "#333"
  }}>
    {children}
  </div>
);

// Card Title
const CardTitle = ({ children }) => (
  <h3 className="card-title" style={{
    margin: 0,
    padding: 0
  }}>
    {children}
  </h3>
);

// Export all components
export { Card, CardHeader, CardContent, CardTitle };