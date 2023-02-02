import { cn } from "../lib/utils"
import "../styles/globals.css"
import Head from "next/head"
import { Inter as FontSans } from "@next/font/google"

import { Footer } from "../components/site-footer"
import { Header } from "../components/site-header"
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
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="container flex-1">{children}</div>
              <Footer />
            </div>
          </Providers>
        </body>
      </html>
      {/* <VercelAnalytics /> */}
    </>
  )
}
