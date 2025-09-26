// This page is a Server Component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import auth from "@/auth"; // Assuming your auth.ts is in utils
import LoginForm from "@/components/LoginForm"; // Import the client component
import { loginAction } from "./actions"; // The server action
import { createSessionClient } from "@/appwrite/appwriteClient"; // Import necessary Appwrite client functions and config
import { Query } from "node-appwrite"; // Import Query for database queries
import { appwriteConfig } from "@/appwrite/config";

export default async function LoginPage() {
  // Server-side check for authenticated user
  const user = await auth.getUser();

  // If user is already authenticated, perform role-based redirection
  if (user) {
    let userProfile: any = null; // To store the fetched user profile

    try {
      // Get the session cookie value to initialize Appwrite client
      const cookiesStoreForSession = await cookies(); // Need a fresh cookies store here
      const sessionCookie = cookiesStoreForSession.get("session")?.value;

      if (sessionCookie) {
        const { databases } = await createSessionClient(sessionCookie);
        const { documents } = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          [Query.equal("userId", user.$id)]
        );

        if (documents.length > 0) {
          userProfile = documents[0];
        }
      }
    } catch (error) {
      console.error(
        "Failed to fetch user profile for redirection in LoginPage:",
        error
      );
      // Fallback: If profile fetch fails, redirect to home or a generic dashboard
      redirect("/");
    }

    // --- Redirection Logic based on Account Type and Profile Completion ---
    if (userProfile) {
      if (userProfile.accountType === "teacher") {
        console.log("LoginPage: Redirecting teacher to /teachers/dashboard.");
        redirect("/teachers/dashboard");
      } else if (userProfile.accountType === "student") {
        const yearGroupMissing =
          !userProfile.yearGroup || userProfile.yearGroup.trim() === "";
        const subjectsMissing =
          !userProfile.subjects || userProfile.subjects.length === 0;

        if (yearGroupMissing || subjectsMissing) {
          console.log(
            "LoginPage: Redirecting incomplete student profile to /complete-profile."
          );
          redirect("/students/complete-profile");
        } else {
          console.log(
            "LoginPage: Redirecting complete student profile to /students/dashboard."
          );
          redirect("/students/dashboard");
        }
      } else if (userProfile.accountType === "admin") {
        // --- NEW ADMIN REDIRECTION ---
        console.log("LoginPage: Redirecting admin to /admin.");
        redirect("/admin");
      } else {
        // Handle other account types or default if accountType is not student/teacher/admin
        console.log("LoginPage: Redirecting other account type to /.");
        redirect("/"); // Default redirect for other roles or complete users
      }
    } else {
      // If user is authenticated but no user profile document found (e.g., just signed up but profile not created yet, or profile creation failed)
      // For now, redirect to complete-profile for students, or default to home for others.
      // This is a fallback to ensure we don't get stuck in a loop if profile isn't there.
      console.log(
        "LoginPage: User authenticated but profile doc not found. Defaulting redirect to complete-profile (if student) or /."
      );
      if (user.labels?.[0] === "student") {
        // Assuming 'student' label from Appwrite Auth for newly signed up
        redirect("/complete-profile");
      } else {
        redirect("/");
      }
    }
  }

  // Server-side reading of the login error cookie (only if user is NOT authenticated)
  const cookiesStore = await cookies();
  const loginError = cookiesStore.get("loginError")?.value;

  return (
    // Main container for the login page with background and overlay
    <div className="min-h-screen flex items-center justify-center p-8 font-inter relative bg-gradient-to-br from-indigo-800 to-blue-600">
      {/* Optional subtle pattern overlay for texture */}
      <div className="absolute inset-0 bg-[url('/images/library.jpg')] "></div>
      <LoginForm loginError={loginError} loginAction={loginAction} />
    </div>
  );
}
