import React from "react";

/**
 * RichTextDisplay
 * Renders HTML content from TipTap (or any rich text editor) with beautiful formatting.
 * Uses Tailwind Typography for consistent, readable styles in both light and dark mode.
 *
 * Props:
 * - html: string (required) - The HTML string to render
 * - className?: string - Optional extra classes
 */
export interface RichTextDisplayProps {
  html: string;
  className?: string;
}

export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ html, className }) => (
  <div
    className={`prose prose-base max-w-none dark:prose-invert ${className || ""}`}
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

// Smart wrapper to handle both HTML and plain text
function isHtml(str: string) {
  return /<[a-z][\s\S]*>/i.test(str);
}

export const SmartRichTextDisplay: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  if (!value) return <span className="text-muted-foreground italic">Not provided</span>;
  const html = isHtml(value) ? value : `<p>${value.replace(/\n/g, '<br />')}</p>`;
  return <RichTextDisplay html={html} className={className} />;
};

export default SmartRichTextDisplay; 