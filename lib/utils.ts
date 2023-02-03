import { ImageLoader } from "next/image"
import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const imageLoader: ImageLoader = ({
  src,
  width,
  quality = 75,
}: {
  src: string
  width: number
  quality?: number
}) => {
  return `https://storage.googleapis.com/madden-regression-bucket/${src}?w=${width}&q=${quality}`
}
