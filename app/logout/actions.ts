"use server"; // This directive must be at the very top of the file

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/appwrite/appwriteClient"; // Assuming you need this to delete Appwrite session
// import auth from "@/utils/auth"; // auth utility is not directly used in this action, can be removed if not used elsewhere

/**
 * Server Action to log out the current user.
 * It deletes the session cookie and redirects to the login page.
 */
export async function logoutAction() {
  const cookiesStore = await cookies();
  const sessionCookie = cookiesStore.get("session")?.value;

  if (sessionCookie) {
    try {
      const { account } = await createSessionClient(sessionCookie);
      await account.deleteSession("current"); // Delete the current Appwrite session
      console.log("Appwrite session deleted.");
    } catch (error) {
      console.error("Error deleting Appwrite session:", error);
      // Continue to delete cookie even if Appwrite session deletion fails
    }
    cookiesStore.delete("session"); // Delete the session cookie from the browser
    console.log("Session cookie deleted.");
  } else {
    console.log("No session cookie found to delete.");
  }

  redirect("/login"); // Redirect to the login page after logout
}
