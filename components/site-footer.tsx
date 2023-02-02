import { Laugh } from "lucide-react"

import { siteConfig } from "../lib/site-config"

export function Footer() {
  return (
    <footer className="mt-4 border-t border-t-slate-200 dark:border-t-slate-700">
      <div className="flex flex-col items-center justify-center gap-4 py-10 md:h-16 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-4 md:flex-row md:gap-2 ">
          <Laugh className="w-6 h-6" />
          <p className="text-sm leading-loose text-center text-slate-600 dark:text-slate-400 md:text-left">
            Built by{" "}
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              richard-p6l
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
