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
export function convertCurrencyString(str: string) {
  // Match the pattern of the currency string:
  //   - starts with a "$" sign
  //   - followed by a number, which may have a decimal point
  //   - optionally followed by "k" or "M"
  //   - ends with the end of the string
  const match = str.match(/^\$(\d+(?:\.\d+)?)(k|M)?$/i)
  console.log("str: ", str, match)
  if (!match) return str

  const [, amountAsString, multiplier] = match
  let amount = Number(amountAsString)

  // Multiply the amount by 1000 or 1000000 if there is a "k" or "M" multiplier
  if (multiplier === "k" || multiplier === "K") amount *= 1000
  if (multiplier === "m" || multiplier === "M") amount *= 1000000

  return amount
}
