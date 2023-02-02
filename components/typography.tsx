import { ReactNode } from "react"

import { cn } from "../lib/utils"

export function TypographyH1({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h1
      className={cn(
        "text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl",
        className
      )}
    >
      {children}
    </h1>
  )
}

export function TypographyH3({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      className={cn(
        "mt-8 text-2xl font-semibold tracking-tight scroll-m-20",
        className
      )}
    >
      {children}
    </h3>
  )
}

export function TypographyH4({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <h4
      className={cn(
        "mt-8 text-xl font-semibold tracking-tight scroll-m-20",
        className
      )}
    >
      {children}
    </h4>
  )
}

export function TypographyP({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <p className={cn(["leading-7 [&:not(:first-child)]:mt-6", className])}>
      {children}
    </p>
  )
}

export function TypographyLarge({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "text-lg font-semibold text-slate-900 dark:text-slate-50",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TypographyInlineCode({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <code
      className={cn(
        "relative rounded bg-slate-100 py-[0.2rem] px-[0.3rem] font-mono text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-400",
        className
      )}
    >
      {children}
    </code>
  )
}
