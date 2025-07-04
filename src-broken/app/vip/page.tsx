import VIPClient from "./VIPClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Page() {
  // Check if VIP feature is enabled
  if (process.env.ENABLE_VIP_FEATURE !== "true") {
    redirect("/");
  }
  
  return <VIPClient />;
} 