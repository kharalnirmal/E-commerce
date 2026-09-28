export const DELIVERY_FEE_PAISA = 15_000;
export const FREE_DELIVERY_THRESHOLD_PAISA = 500_000;
export const RESERVATION_MINUTES = 10;

export type DeliveryAddress = {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: string;
  streetAddress: string;
  landmark: string;
};

const requiredAddressFields = [
  "recipientName",
  "phone",
  "province",
  "district",
  "municipality",
  "ward",
  "streetAddress",
] as const;

export function calculateCheckoutTotals(subtotalPaisa: number) {
  if (!Number.isSafeInteger(subtotalPaisa) || subtotalPaisa < 0) {
    throw new Error("Subtotal must be a non-negative whole number of paisa.");
  }
  const deliveryFeePaisa = subtotalPaisa > FREE_DELIVERY_THRESHOLD_PAISA ? 0 : DELIVERY_FEE_PAISA;
  return { subtotalPaisa, deliveryFeePaisa, totalPaisa: subtotalPaisa + deliveryFeePaisa };
}

export function parseDeliveryAddress(values: Record<string, unknown>): DeliveryAddress | { error: string } {
  const address = Object.fromEntries(
    [...requiredAddressFields, "landmark"].map((field) => [
      field,
      typeof values[field] === "string" ? values[field].trim().replace(/\s+/g, " ") : "",
    ]),
  ) as DeliveryAddress;

  if (requiredAddressFields.some((field) => !address[field])) {
    return { error: "Complete every required delivery-address field." };
  }
  if (!/^9[678]\d{8}$/.test(address.phone.replace(/[ -]/g, "")) || !/^([1-9]|[1-2]\d|3[0-5])$/.test(address.ward)) {
    return { error: "Enter a valid Nepal mobile number and ward number." };
  }
  if (Object.values(address).some((value) => value.length > 160)) {
    return { error: "Delivery-address fields must be 160 characters or fewer." };
  }
  address.phone = address.phone.replace(/[ -]/g, "");
  return address;
}

export function formDataToAddress(formData: FormData) {
  return parseDeliveryAddress(Object.fromEntries(formData));
}

export function rupeesToPaisa(value: { toString(): string } | string | number) {
  const text = value.toString();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error("Invalid NPR amount.");
  const [rupees, paisa = ""] = text.split(".");
  const result = Number(rupees) * 100 + Number(paisa.padEnd(2, "0"));
  if (!Number.isSafeInteger(result)) throw new Error("NPR amount is too large.");
  return result;
}

export function formatGatewayAmount(paisa: number) {
  if (!Number.isSafeInteger(paisa) || paisa < 0) throw new Error("Invalid paisa amount.");
  const rupees = Math.floor(paisa / 100);
  const remainder = paisa % 100;
  return remainder ? `${rupees}.${remainder.toString().padStart(2, "0")}` : rupees.toString();
}
