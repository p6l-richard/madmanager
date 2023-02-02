"use client"

import * as React from "react"
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "./button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  expandButtonTitle?: string
}

export function CollapsibleTableWrapper({
  expandButtonTitle = "View Preview",
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [isOpened, setIsOpened] = React.useState(false)

  return (
    <Collapsible open={isOpened} onOpenChange={setIsOpened}>
      <div className={cn("relative overflow-hidden", className)} {...props}>
        <CollapsibleContent
          forceMount
          className={cn("overflow-hidden", !isOpened && "max-h-32")}
        >
          <div
            // save some space below the table when it's open
            className={cn(
              "[&_table]:max-h-[650px [&_table]:mb-16 [&_table]:mt-2",
              !isOpened
                ? "[&_table]:overflow-hidden"
                : "[&_table]:overflow-auto"
            )}
          >
            {children}
          </div>
        </CollapsibleContent>
        {isOpened && (
          <div className="absolute right-0 mb-12 border-r-[1px] top-2 bottom-4 left-[85%] bg-gradient-to-r from-transparent to-slate-500/30 border-slate-900 " />
        )}
        <div
          className={cn(
            "absolute flex items-center justify-center",
            !isOpened && "bg-gradient-to-b from-white to-slate-500/10 p-2",
            isOpened ? "inset-x-0 bottom-3 h-12" : "inset-0"
          )}
        >
          <CollapsibleTrigger asChild>
            <Button variant="subtle" className="h-8 text-xs">
              {isOpened ? (
                <>
                  <ChevronsDownUp className="w-6 h-6 pr-2" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronsUpDown className="w-6 h-6 pr-2" />
                  {expandButtonTitle}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
    </Collapsible>
  )
}
