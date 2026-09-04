import { redirect } from "next/navigation";

export default function NuevaSolicitudPage() {
  redirect("/solicitudes?crear=1");
}
