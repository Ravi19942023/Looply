"use client";

import React from "react";
import { MessageResponse } from "./MessageResponse";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return <MessageResponse>{content}</MessageResponse>;
});
