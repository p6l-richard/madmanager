import { NextApiRequest, NextApiResponse } from "next"
import { Prisma } from "@prisma/client"

import { prisma } from "../../lib/server/db"
import { convertCurrencyString } from "../../lib/server/parsers"

// a next api handler that updates the database's salary data object
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.dir({ BODAY: req.body, QUERAY: req.query })
  // get the image from the database
  const image = await prisma.image.findUnique({
    where: {
      id: req.query.imageId as string,
    },
    include: {
      salary: true,
    },
  })
  // return 404 if not found
  if (!image) {
    return res.status(404).json({ error: "image not found" })
  }
  // return 404 if the image does not have salary data
  if (!image.salary?.data) {
    return res.status(404).json({ error: "image does not have salary data" })
  }
  // if the salary data already exists, update it
  let data = image.salary.data as Prisma.JsonArray
  // patch the data
  const {
    value,
    at: [rowIndex, columnIndex],
  } = req.body
  console.log("update-cell.ts: value", value, rowIndex, columnIndex)
  // @ts-expect-error need zod here I think
  data[rowIndex][columnIndex] = convertCurrencyString(value)
  const updated = await prisma.salary.update({
    where: {
      imageId: image.id,
    },
    data: {
      data,
    },
  })
  return res.status(200).json(updated.data)
}
