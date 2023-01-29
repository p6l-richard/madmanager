import React from "react"

import { cn } from "../../lib/utils"

export function Steps({ steps, activeStep }) {
  console.log("activeStep: ", activeStep)
  console.log("steps: ", steps)
  return (
    <ul className="grid grid-flow-col-dense gap-0.5">
      {/* Steps */}
      {steps.map((step) => (
        <li
          key={step.id}
          className={cn([
            `relative py-3 pl-4 pr-6 my-2`,
            activeStep === step.id ? "bg-indigo-500 text-white" : "bg-gray-50",
          ])}
        >
          <div className="flex items-center">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full">
              {activeStep > step.id ? (
                // completed
                <svg
                  className="bg-gray-50 fill-indigo-500 stroke-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              ) : activeStep === step.id ? (
                // active
                <svg
                  className="fill-white-500 stroke-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              ) : (
                // outstanding
                <svg
                  className="bg-gray-50 stroke-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              )}
            </div>
            <div className="flex flex-row ml-4 justify-items-start">
              <h4
                className={`text-base font-medium ${
                  activeStep === step.id
                    ? // current
                      "text-white"
                    : // completed
                    activeStep > step.id
                    ? "text-gray-600"
                    : // outstanding
                      "text-gray-400"
                }`}
              >
                {step.id + " " + step.title}
              </h4>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

// <p
// className={`text-sm ${
//     activeStep === step.id
//       ? // current
//         "text-white"
//       : // completed
//       activeStep > step.id
//       ? "text-gray-600"
//       : // outstanding
//         "text-gray-400"
//   }`}
// >
//   {step.description}
// </p>
