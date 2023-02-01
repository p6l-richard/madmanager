import { NextApiRequest, NextApiResponse } from "next"
import { SalaryStatus } from "@prisma/client"

import { prisma } from "../../lib/server/db"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { imageId } = JSON.parse(req.body)
  if (!imageId) {
    return res.status(400).json({ error: "Missing imageId" })
  }
  await prisma.salary.update({
    where: {
      imageId,
    },
    data: {
      status: SalaryStatus.CONFIRMED,
    },
  })
  return res.status(200)
}
