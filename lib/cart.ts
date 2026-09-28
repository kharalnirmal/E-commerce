export function parseCartQuantity(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= 99
    ? quantity
    : null;
}
