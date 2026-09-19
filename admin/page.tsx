import requireAdmin from "@/lib/require-admin";

export default async function AdminPage() {
  await requireAdmin();
}
