import { NextApiRequest, NextApiResponse } from "next"

import { prisma } from "../../lib/server/db"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { imageId } = req.query
  const image = await prisma.image.findUnique({
    include: { salary: true },
    where: {
      id: imageId as string,
    },
  })
  if (!image?.salary?.data) {
    return res.status(404).json({ error: "Salary not found" })
  }
  const {
    salary: { data },
  } = image
  return res.status(200).json(data)
}
