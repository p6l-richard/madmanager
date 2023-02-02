// HOOK
import React, { useEffect, useState } from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../lib/utils"

// COMPONENT
const ToastAction: React.FC<ToastPrimitives.ToastActionProps> = ({
  className,
  ...props
}) => (
  <ToastPrimitives.Action
    className={cn(
      "inline-flex h-6 items-center justify-center rounded-md border border-slate-400/30 bg-transparent px-2 text-sm font-medium leading-none transition-colors hover:bg-slate-500/10 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-slate-100 dark:border-slate-50/50 dark:text-slate-100 dark:hover:bg-slate-100/30 dark:hover:text-slate-100 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900 dark:data-[state=open]:bg-slate-800",
      className
    )}
    {...props}
  />
)

const ToastClose: React.FC<ToastPrimitives.ToastCloseProps> = ({
  className,
  ...props
}) => (
  <ToastPrimitives.Close
    className={cn(
      "absolute top-1 right-1 rounded-md p-1 hover:bg-slate-500/10 dark:hover:bg-slate-100/30",
      className
    )}
    {...props}
  >
    <X className="w-4 h-4" />
  </ToastPrimitives.Close>
)

const ToastTitle: React.FC<ToastPrimitives.ToastTitleProps> = ({
  className,
  ...props
}) => (
  <ToastPrimitives.Title
    className={cn("font-semibold text-slate-900 dark:text-slate-50", className)}
    {...props}
  />
)

const ToastDescription: React.FC<ToastPrimitives.ToastDescriptionProps> = ({
  className,
  ...props
}) => (
  <ToastPrimitives.Description
    className={cn("text-sm leading-none", className)}
    {...props}
  />
)

type ToastProps = ToastPrimitives.ToastProps

const Toast: React.FC<ToastProps> = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ className, ...props }) => (
    <ToastPrimitives.Root
      className={cn(
        [
          "pointer-events-auto relative w-full items-start rounded-md border border-b-4 border-slate-900 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[swipe-direction=right]:data-[state=open]:slide-in-from-right-52 data-[swipe-direction=left]:data-[state=open]:slide-in-from-left-52 data-[swipe-direction=up]:data-[state=open]:slide-in-from-top-52 data-[swipe-direction=down]:data-[state=open]:slide-in-from-bottom-52",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out",
          "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)]",
          "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)] data-[swipe=end]:animate-out data-[swipe=end]:fade-out data-[swipe-direction=down]:data-[swipe=end]:slide-out-to-bottom-full data-[swipe-direction=right]:data-[swipe=end]:slide-out-to-right-full data-[swipe-direction=left]:data-[swipe=end]:slide-out-to-left-full data-[swipe-direction=up]:data-[swipe=end]:slide-out-to-top-full",
          "data[swipe=cancel]:transition data[swipe=cancel]:duration-200 data-[swipe=cancel]:translate-x-0",
        ],
        className
      )}
      {...props}
    />
  )
)

const ToastProvider: React.FC<ToastPrimitives.ToastProviderProps> = (props) => (
  <ToastPrimitives.Provider swipeDirection="right" duration={3000} {...props} />
)

const toastViewportVariants = cva(
  "fixed z-50 flex max-h-screen w-full flex-col items-end justify-end gap-3 p-6 md:max-w-[390px] pointer-events-none",
  {
    variants: {
      position: {
        "top-left": "top-0 left-0",
        "top-center": "top-0 left-[50%] -translate-x-[50%]",
        "top-right": "top-0 right-0",
        "bottom-left": "bottom-0 left-0 flex-col-reverse",
        "bottom-center":
          "bottom-0 left-[50%] -translate-x-[50%] flex-col-reverse",
        "bottom-right": "bottom-0 right-0 flex-col-reverse",
      },
    },
    defaultVariants: {
      position: "bottom-right",
    },
  }
)

const ToastViewport: React.FC<
  ToastPrimitives.ToastViewportProps &
    VariantProps<typeof toastViewportVariants>
> = ({ className, position, ...props }) => (
  <ToastPrimitives.Viewport
    className={cn(toastViewportVariants({ position }), className)}
    {...props}
  />
)

// Inspired by react-hot-toast library
const TOAST_LIMIT = 10
const TOAST_REMOVE_DELAY = 1000

type ToasterToast = ToastProps & { id: string }

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

const genId = () => {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST":
      const { toastId } = action

      // ! Side effects ! - This could be execrated into a dismissToast() action, but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

const dispatch = (action: Action) => {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

interface NewToast extends Omit<ToasterToast, "id" | "children"> {
  content: ToasterToast["children"]
}

const toast = ({ content: newToastContent, ...newToastProps }: NewToast) => {
  const id = genId()
  const update = ({ content, ...props }: NewToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id, children: content },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...newToastProps,
      children: newToastContent,
      open: true,
      onOpenChange: (open: boolean) => {
        if (open === false) dismiss()
      },
      id,
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

const useToaster = () => {
  const [state, setState] = useState<State>(memoryState)
  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismissToast: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  type ToastProps,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  useToaster,
  toast,
}
