import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import auth from "@/auth";
import CompleteProfileForm from "@/components/CompleteProfileForm"; // Import the new client component
import { updateProfile } from "./actions"; // The server action for profile update
import { createSessionClient } from "@/appwrite/appwriteClient"; // To fetch user profile, and appwriteConfig
import { Query } from "node-appwrite"; // Import Query directly from node-appwrite
import { appwriteConfig } from "@/appwrite/config";

// This page is a Server Component
export default async function CompleteProfilePage() {
  // Server-side check for authenticated user
  const user = await auth.getUser();

  if (!user) {
    console.log("User not found on /complete-profile, redirecting to /login"); // Debug log
    redirect("/login");
    return null; // Ensure nothing else renders if redirected
  }
  console.log("User found on /complete-profile:", user.name || user.email); // Debug log

  // Server-side reading of error/success cookies
  const cookiesStore = await cookies();
  const profileError = cookiesStore.get("profileError")?.value;
  const profileSuccess = cookiesStore.get("profileSuccess")?.value;
  const signupSuccess = cookiesStore.get("signupSuccess")?.value;

  // Fetch the existing user's custom profile from your database to pre-fill the form
  let initialYearGroup: string | undefined;
  let initialSubjects: string[] | undefined;
  let isStudentAndProfileIncomplete = false;

  try {
    // Get the session cookie value to pass to createSessionClient
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      console.error(
        "Session cookie not found when trying to fetch user profile in CompleteProfilePage."
      );
      redirect("/login"); // If session cookie is missing here, user is truly not authenticated
      return null;
    }

    const { databases } = await createSessionClient(sessionCookie); // Pass the sessionCookie value
    const { documents } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("userId", user.$id)] // Corrected query syntax using Query.equal()
    );

    if (documents.length > 0) {
      const userProfile = documents[0];
      initialYearGroup = userProfile.yearGroup || undefined;
      initialSubjects = userProfile.subjects || undefined;

      if (userProfile.accountType === "student") {
        const yearGroupMissing =
          !userProfile.yearGroup || userProfile.yearGroup.trim() === "";
        const subjectsMissing =
          !userProfile.subjects || userProfile.subjects.length === 0;
        if (yearGroupMissing || subjectsMissing) {
          isStudentAndProfileIncomplete = true;
        }
      }
    } else {
      console.warn("User profile document not found for user:", user.$id);
      // If no profile document, and user is a student, consider profile incomplete
      if (user.labels?.[0] === "student") {
        isStudentAndProfileIncomplete = true;
      }
    }
  } catch (error) {
    console.error("Failed to fetch user profile for pre-filling form:", error);
    // If fetching fails, and user is a student, assume profile is incomplete for safety
    if (user.labels?.[0] === "student") {
      isStudentAndProfileIncomplete = true;
    }
  }

  // FIX: Modify the guard. Only redirect to '/' if profile is complete AND
  // it's not immediately after signup OR a profile update (to allow toasts to show).
  if (
    user.labels?.[0] === "student" &&
    !isStudentAndProfileIncomplete &&
    !signupSuccess &&
    !profileSuccess
  ) {
    console.log(
      "Student profile complete or not a student, redirecting from /complete-profile to /"
    );
    redirect("/");
    return null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 font-inter relative
                    bg-gradient-to-br from-green-600 via-teal-700 to-cyan-800"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-10"></div>

      {/* Render the Client Component and pass props */}
      <CompleteProfileForm
        profileError={profileError}
        profileSuccess={profileSuccess}
        signupSuccess={signupSuccess}
        updateProfile={updateProfile}
        initialYearGroup={initialYearGroup}
        initialSubjects={initialSubjects}
      />
    </div>
  );
}
