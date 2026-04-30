import { redirect } from "next/navigation";

export default function LiveDataPage() {
  // Keep existing live dashboard intact.
  redirect("/dashboard");
}

