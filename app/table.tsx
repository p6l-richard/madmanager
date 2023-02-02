import { ReactNode } from "react"

import { cn } from "../lib/utils"

const TableRoot = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return <table className={cn("w-full", className)}>{children}</table>
}
const TableHeaderCell = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <th
    className={cn(
      "border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right",
      className
    )}
  >
    {children}
  </th>
)
const TableHeader = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <thead>
      <tr
        className={cn(
          "p-0 m-0 border-t border-slate-300 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800",
          className
        )}
      >
        {children}
      </tr>
    </thead>
  )
}
const TableBody = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return <tbody>{children}</tbody>
}
const TableRow = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <tr
      className={cn(
        "p-0 m-0 border-t border-slate-300 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800",
        className
      )}
    >
      {children}
    </tr>
  )
}

const TableData = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <td
      className={cn(
        "border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
    >
      {children}
    </td>
  )
}
export {
  TableRoot,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableData,
}
