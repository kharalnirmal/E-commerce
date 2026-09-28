"use server";

import { revalidatePath } from "next/cache";
import { canResetDemo, isDemoEnabled, isResetConfirmation } from "@/lib/demo";
import { restoreCanonicalDemo } from "@/lib/demo-server";
import requireAdmin from "@/lib/require-admin";

export async function resetDemo(_state: { message: string }, formData: FormData) {
  if (!isDemoEnabled()) return { message: "Demo mode is disabled." };

  const user = await requireAdmin();
  if (!canResetDemo(user.email)) {
    return { message: "Only Nirmal can restore the demo." };
  }
  if (!isResetConfirmation(formData.get("confirmation"))) {
    return { message: "Type RESET exactly to continue." };
  }

  await restoreCanonicalDemo();
  revalidatePath("/", "layout");
  return { message: "Canonical demo restored." };
}
