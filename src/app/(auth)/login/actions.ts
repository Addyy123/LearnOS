"use server";

import { signIn } from "@/modules/identity/auth";

export async function guestLoginAction() {
  await signIn("credentials", { 
    isGuest: "true",
    redirectTo: "/"
  });
}
