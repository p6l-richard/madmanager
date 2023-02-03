"use client"

import { NextPage } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "../components/button"
import { SquigglyLines } from "../components/squiggly-lines"
import { TypographyH1, TypographyP } from "../components/typography"
import { siteConfig } from "../lib/site-config"
import { imageLoader } from "../lib/utils"

export const HomePage: NextPage = () => {
  return (
    <main className="flex flex-col items-center justify-center flex-1 w-full px-4 mt-10 space-y-8 text-center sm:mt-14">
      <TypographyH1 className="max-w-2xl">
        Play Madden Franchise{" "}
        <span className="relative text-slate-500 whitespace-nowrap">
          <SquigglyLines />
          <span className="relative">on steroids</span>
        </span>
      </TypographyH1>

      <TypographyP className="max-w-xl">
        Want to quickly play around with your team's salary data in a
        Spreadsheet? Let our AI parse screenshots so you can plan your next
        move.
      </TypographyP>
      <Link href="/salary">
        <Button>
          Parse team's salary <ArrowRight className="h-5 w-7" />
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-between w-full mt-6 sm:mt-10">
        <div className="flex flex-col mt-4 mb-16 space-y-10">
          <div className="flex flex-col sm:space-x-2 sm:flex-row">
            <div>
              <h2 className="mb-1 text-lg font-medium">Screenshot</h2>
              <Image
                alt="A screenshot from Madden 20 Franchise team salary overview"
                loader={(props) => imageLoader(props)}
                src={siteConfig.demoImages.screenshot}
                className="object-fill w-96 h-72 rounded-2xl"
                width={400}
                height={400}
                quality={100}
              />
            </div>
            <div className="mt-8 sm:mt-0">
              <h2 className="mb-1 text-lg font-medium">Parsed Data</h2>
              <Image
                alt="Resulting parsed data from the screenshot"
                loader={(props) => imageLoader(props)}
                src={siteConfig.demoImages.result}
                className="object-cover w-96 h-72 rounded-2xl"
                width={400}
                height={400}
                quality={100}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
