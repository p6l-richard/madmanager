import Link from "next/link"
import { Laugh } from "lucide-react"

import { siteConfig } from "../lib/site-config"
import { TypographyLarge } from "./typography"

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-b-slate-200 dark:border-b-slate-700 dark:bg-slate-900">
      <div className="flex items-center h-16 px-5">
        <Link href="/" className="flex items-center space-x-2">
          <Laugh className="w-6 h-6" />
          <TypographyLarge>{siteConfig.name}</TypographyLarge>
        </Link>
      </div>
    </header>
  )
}
