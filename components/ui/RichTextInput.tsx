"use client";

import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from '@tiptap/extension-placeholder';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";
import { Toggle } from "./toggle";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const options = [
    { icon: <Heading1 className="size-4" />, label: "Heading 1", onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), pressed: editor.isActive("heading", { level: 1 }) },
    { icon: <Heading2 className="size-4" />, label: "Heading 2", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), pressed: editor.isActive("heading", { level: 2 }) },
    { icon: <Heading3 className="size-4" />, label: "Heading 3", onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), pressed: editor.isActive("heading", { level: 3 }) },
    { icon: <Bold className="size-4" />, label: "Bold", onClick: () => editor.chain().focus().toggleBold().run(), pressed: editor.isActive("bold") },
    { icon: <Italic className="size-4" />, label: "Italic", onClick: () => editor.chain().focus().toggleItalic().run(), pressed: editor.isActive("italic") },
    { icon: <Strikethrough className="size-4" />, label: "Strikethrough", onClick: () => editor.chain().focus().toggleStrike().run(), pressed: editor.isActive("strike") },
    { icon: <AlignLeft className="size-4" />, label: "Align Left", onClick: () => (editor as any).chain().focus().setTextAlign("left").run(), pressed: editor.isActive({ textAlign: "left" }) },
    { icon: <AlignCenter className="size-4" />, label: "Align Center", onClick: () => (editor as any).chain().focus().setTextAlign("center").run(), pressed: editor.isActive({ textAlign: "center" }) },
    { icon: <AlignRight className="size-4" />, label: "Align Right", onClick: () => (editor as any).chain().focus().setTextAlign("right").run(), pressed: editor.isActive({ textAlign: "right" }) },
    { icon: <List className="size-4" />, label: "Bullet List", onClick: () => editor.chain().focus().toggleBulletList().run(), pressed: editor.isActive("bulletList") },
    { icon: <ListOrdered className="size-4" />, label: "Ordered List", onClick: () => editor.chain().focus().toggleOrderedList().run(), pressed: editor.isActive("orderedList") },
    { icon: <Highlighter className="size-4" />, label: "Highlight", onClick: () => (editor as any).chain().focus().toggleHighlight().run(), pressed: editor.isActive("highlight") },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 p-2 mb-2 rounded-lg border border-border/60 bg-card">
        {options.map((option, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={option.label}
                onClick={option.onClick}
                className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors duration-150
                  ${option.pressed ? "bg-primary text-primary-foreground shadow" : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground"}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70`}
              >
                {option.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{option.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export default function RichTextInput({ value, onChange, placeholder, className }: RichTextInputProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-3",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Placeholder.configure({
        placeholder: placeholder || 'Enter your detailed response here...',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        className: `min-h-[96px] w-full bg-transparent focus:outline-none text-base md:text-lg leading-relaxed ${className || ''}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  return (
    <div>
      <MenuBar editor={editor} />
      <div className="w-full min-h-[120px] rounded-lg border border-border/60 bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary/70 transition-all">
        <EditorContent editor={editor} className="rich-text-prosemirror" />
      </div>
    </div>
  );
} 