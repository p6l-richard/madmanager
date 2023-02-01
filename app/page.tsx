"use client"

import Link from "next/link"

import { Button } from "../components/button"

export default function Homepage() {
  return (
    <div className="flex items-center justify-center">
      <Button>
        <Link href="/salary">Salary</Link>
      </Button>
    </div>
  )
}
