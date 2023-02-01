import { Image } from "@prisma/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "../../components/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../components/hover-card"
import { Input } from "../../components/input"
import { Label } from "../../components/label"
import { TypographyInlineCode, TypographyP } from "../../components/typography"
import { cn } from "../../lib/utils"
import { SalaryData, tableData } from "./page"

export const fetchSalary = async ({ imageId }: { imageId: Image["id"] }) => {
  const res = await fetch("/api/salary?imageId=" + imageId)
  if (!res.ok) {
    throw new Error("Unable to fetch salary data")
  }
  return res.json() as Promise<SalaryData>
}

export const Table = ({
  imageId,
  data: salaryData,
}: {
  imageId: string
  data: SalaryData
}) => {
  const queryClient = useQueryClient()

  const updateCell = useMutation(
    async ({
      value,
      at,
      imageId,
    }: {
      value: string
      at: [number, number]
      imageId: string
    }) => {
      const res = await fetch("/api/update-cell?imageId=" + imageId, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value, at }),
      })
      if (!res.ok) {
        throw new Error("Unable to update cell")
      }
      return res.json() as Promise<SalaryData>
    }
  )

  return (
    <div className="w-full my-6 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="p-0 m-0 border-t border-slate-300 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
            {salaryData[0].map((header) => (
              <th className="border border-slate-200 px-4 py-2 text-left font-bold dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {salaryData.slice(1).map((row, rowIdx) => (
            <tr className="p-0 m-0 border-t border-slate-200 even:bg-slate-100 dark:border-slate-700 dark:even:bg-slate-800">
              {row.map((cell, colIdx) => (
                <td
                  className={cn(
                    "border border-slate-200 px-4 py-2 text-left dark:border-slate-700 [&[align=center]]:text-center [&[align=right]]:text-right",
                    "group cursor-help"
                  )}
                >
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger>
                      {" "}
                      {isNaN(Number(cell))
                        ? cell
                        : Intl.NumberFormat("en-US", {
                            notation: "compact",
                          }).format(Number(cell))}
                    </HoverCardTrigger>
                    <HoverCardContent asChild>
                      <div className="flex justify-between space-x-4">
                        <div className="space-y-1">
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="update-cell-input">
                              The value for F
                              <TypographyInlineCode>
                                {salaryData[0][colIdx]}
                              </TypographyInlineCode>{" "}
                              is not correct?
                            </Label>
                            <div className="flex items-center w-full max-w-sm space-x-2">
                              <Input
                                id="update-cell-input"
                                placeholder={cell}
                              />
                              <Button
                                onClick={(e) =>
                                  updateCell.mutateAsync(
                                    {
                                      value: (
                                        document.getElementById(
                                          "update-cell-input"
                                        ) as HTMLInputElement
                                      ).value,
                                      at: [rowIdx + 1, colIdx],
                                      imageId,
                                    },
                                    {
                                      // update the cached data with our response to avoid another refetch
                                      onSuccess: (newData) => {
                                        console.log({ newData })
                                        return queryClient.setQueryData(
                                          ["salary", imageId],
                                          newData
                                        )
                                      },
                                    }
                                  )
                                }
                              >
                                Save
                              </Button>
                            </div>
                            <TypographyP className="text-sm text-slate-500">
                              Enter the correct one here.
                            </TypographyP>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
