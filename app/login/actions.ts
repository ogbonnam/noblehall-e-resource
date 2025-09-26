"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/appwrite/appwriteClient"; // Only createAdminClient needed for session creation

// Note: Query, createSessionClient, and appwriteConfig are no longer needed here
// because the role-based redirection logic has been moved to LoginPage.

interface LoginFormData {
  email: string;
  password: string;
}

export async function loginAction(formData: FormData) {
  const data = Object.fromEntries(formData) as unknown as LoginFormData;
  const { email, password } = data;

  // Basic validation
  if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) {
    const cookiesStore = await cookies();
    cookiesStore.set("loginError", "A valid email is required.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/login");
  }
  if (!password || typeof password !== "string" || password.length === 0) {
    const cookiesStore = await cookies();
    cookiesStore.set("loginError", "Password is required.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/login");
  }

  try {
    const { account } = await createAdminClient();

    // Create an email/password session with Appwrite
    const session = await account.createEmailPasswordSession(email, password);

    // Set the session cookie on the user's browser
    const cookiesStore = await cookies();
    cookiesStore.set("session", session.secret, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(session.expire),
      path: "/",
    });

    // Simplify this action: Just establish session and redirect to a common post-login page.
    // The role-based redirection will now be handled by the LoginPage Server Component.
    redirect("/"); // Redirect to the root, which will then be handled by LoginPage/middleware
  } catch (error: any) {
    console.error("Login failed:", error);
    const cookiesStore = await cookies();
    let errorMessage = "Invalid email or password.";

    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }

    cookiesStore.set("loginError", errorMessage, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10,
      path: "/",
    });
    redirect("/login");
  }
}
