import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "cn"

/** Renderiza markdown (contenido de módulos/writeups) con estilos de tipografía. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground prose-code:text-primary",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
