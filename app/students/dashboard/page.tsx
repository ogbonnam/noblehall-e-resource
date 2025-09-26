// This page is a Server Component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import auth from "@/auth"; // Your auth utility
import { createSessionClient } from "@/appwrite/appwriteClient"; // Appwrite client for profile check
import { Query } from "node-appwrite"; // Query for database queries
import { appwriteConfig } from "@/appwrite/config";

import StudentDashboardContent from "@/components/StudentDashboardContent"; // Import the new Client Component
import {
  getStudentBooksAction,
  getAssignmentsForStudentAction,
} from "./actions"; // Import all student-related server actions

export default async function StudentDashboardPage() {
  // Server-side authentication check
  const user = await auth.getUser();

  if (!user) {
    // If no user is logged in, redirect to login page
    redirect("/login");
    return null; // Don't render anything if redirecting
  }

  // Fetch user profile to ensure they are a student and get their yearGroup
  let userProfile: any = null;
  let studentYearGroup: string; // Ensure this is definitely a string before using

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      console.error("Session cookie missing for fetching user profile.");
      redirect("/login"); // Redirect if session is unexpectedly missing
      return null;
    }

    const { databases } = await createSessionClient(sessionCookie);
    const { documents } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("userId", user.$id)]
    );
    userProfile = documents.length > 0 ? documents[0] : null;
  } catch (error) {
    console.error(
      "Failed to fetch user profile in StudentDashboardPage:",
      error
    );
    redirect("/"); // Redirect on error
    return null;
  }

  // Essential check: If not a student or yearGroup is missing/invalid, redirect
  if (
    !userProfile ||
    userProfile.accountType !== "student" ||
    !userProfile.yearGroup ||
    userProfile.yearGroup.trim() === ""
  ) {
    console.log(
      "Unauthorized access or incomplete student profile. Redirecting."
    );
    // Redirect students with incomplete profiles to complete-profile, others to home.
    if (userProfile && userProfile.accountType === "student") {
      redirect("/complete-profile");
    } else {
      redirect("/"); // For non-students or unknown profile issues
    }
    return null;
  }

  studentYearGroup = userProfile.yearGroup; // Now confident it's a string

  // Server-side reading of dashboard error/success cookies (if you implement for students)
  const cookiesStore = await cookies();
  const dashboardError = cookiesStore.get("dashboardError")?.value; // Placeholder if needed
  const dashboardSuccess = cookiesStore.get("dashboardSuccess")?.value; // Placeholder if needed

  // Fetch books for the specific student's year group using the server action
  const studentBooks = await getStudentBooksAction(studentYearGroup);
  // Fetch assignments for the specific student's year group and current student's ID
  const studentAssignmentsWithSubmissions =
    await getAssignmentsForStudentAction(studentYearGroup, user.$id);

  return (
    <div className="min-h-screen bg-gray-100 font-inter flex flex-col items-center py-10 px-4">
      <StudentDashboardContent
        initialBooks={studentBooks}
        initialAssignments={studentAssignmentsWithSubmissions} // Pass initial assignments with submission status
        studentYearGroup={studentYearGroup} // This is now definitely a string
        dashboardError={dashboardError}
        dashboardSuccess={dashboardSuccess}
      />
    </div>
  );
}
