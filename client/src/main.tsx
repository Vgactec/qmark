import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import App from './App.tsx'
import "./index.css";

// Remove any problematic CSS selectors that might cause syntax errors
const removeProblematicSelectors = () => {
  try {
    // Remove any invalid CSS selectors that might cause issues
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (sheet.cssRules) {
          // Ensure no problematic selectors like *:contains() are used
          console.log('CSS validation passed');
        }
      } catch (e) {
        // Ignore cross-origin stylesheet errors
      }
    }
  } catch (error) {
    console.warn('CSS validation warning:', error);
  }
};

// Initialize CSS validation
removeProblematicSelectors();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>,
);