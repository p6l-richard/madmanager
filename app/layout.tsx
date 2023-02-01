import { cn } from "../lib/utils"
import "../styles/globals.css"
import { Inter as FontSans } from "@next/font/google"

import Providers from "./providers"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export default function RootLayout({
  children,
}: {
  children?: React.ReactNode
}) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-white font-sans text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-50",
            fontSans.variable
          )}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
      {/* <VercelAnalytics /> */}
    </>
  )
}
