import React from "react";
import { Card } from "@/components/ui/card";

export default function AppBlock({ children, className = "" }) {
  return (
    <Card className={`w-full rounded-3xl border-0 bg-white p-6 shadow-xl ${className}`}>
      {children}
    </Card>
  );
}