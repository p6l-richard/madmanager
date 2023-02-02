"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastViewport,
  useToaster,
} from "../components/toast"

export default function Providers({
  children,
}: {
  children?: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())
  const { toasts } = useToaster()
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {toasts.map(({ id, children, ...props }) => (
          <Toast key={id} {...props}>
            {children}
            <ToastClose />
          </Toast>
        ))}

        {children}
        <ToastViewport position="bottom-right" />
      </ToastProvider>
    </QueryClientProvider>
  )
}
