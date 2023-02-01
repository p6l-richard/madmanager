"use client"

import { create } from "zustand"

// ⬇️ not exported, so that no one can subscribe to the entire store
const useImageStore = create((set) => ({
  image: null,
  actions: {
    setImage: (filename) => set((state) => ({ image: filename })),
    removeImage: () => set((state) => ({ image: null })),
  },
}))

// 💡 exported - consumers don't need to write selectors
export const useImage = () => useImageStore((state) => state.image)
// 🎉 one selector for all our actions
export const useImageActions = () => useImageStore((state) => state.actions)

const useDataStore = create((set) => ({
  data: null,
  actions: {
    overwriteData: (data) => {
      console.log("overwriting data", data)
      set({ data: data.map((row) => row.map(convertCurrencyString)) })
    },
    updateCell: ({ value, at: [rowIndex, colIndex] }) =>
      set(
        (state) =>
          (state.data[rowIndex][colIndex] = convertCurrencyString(value))
      ),
    removeData: () => set((state) => ({ data: null })),
  },
}))

// export data selector and actions
export const useData = () => useDataStore((state) => state.data)

export const useDataActions = () => useDataStore((state) => state.actions)

/**
 
*/

/**
 * Converts a currency string in compact notation to a number.
 *
 * This function uses a regular expression to match the pattern of the currency string and extract the amount and multiplier.
 *
 * It then converts the amount to a number and multiplies it by the appropriate value (1_000 for "k" and 1_000_000 for "M").
 *
 * If the input string does not match the pattern, the function returns the original string.
 *
 * @param {string} str - The currency string to convert.
 * @returns {number} The converted currency value, or the original string if the string is not in a valid format.
 */
export function convertCurrencyString(str) {
  // Match the pattern of the currency string:
  //   - starts with a "$" sign
  //   - followed by a number, which may have a decimal point
  //   - optionally followed by "k" or "M"
  //   - ends with the end of the string
  const match = str.match(/^\$(\d+(?:\.\d+)?)(k|M)?$/i)
  if (!match) return str

  let [, amount, multiplier] = match
  amount = Number(amount)

  // Multiply the amount by 1000 or 1000000 if there is a "k" or "M" multiplier
  if (multiplier === "k" || multiplier === "K") amount *= 1000
  if (multiplier === "m" || multiplier === "M") amount *= 1000000

  return amount
}
