// This page is a Server Component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import auth from "@/auth"; // Your auth utility
import { createSessionClient } from "@/appwrite/appwriteClient"; // Appwrite client for profile check
import { Query } from "node-appwrite"; // Query for database queries
import { appwriteConfig } from "@/appwrite/config";

import TeacherDashboardTabs from "@/components/TeacherDashboardTabs"; // Import the main Client Component
import { getTeacherBooksAction } from "./actions"; // Import the new server action to get books

export default async function TeachersDashboardPage() {
  // Server-side authentication check
  const user = await auth.getUser();

  if (!user) {
    // If no user is logged in, redirect to login page
    redirect("/login");
    return null; // Don't render anything if redirecting
  }

  // Fetch user profile to ensure they are a teacher
  let userProfile: any = null;
  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (sessionCookie) {
      const { databases } = await createSessionClient(sessionCookie);
      const { documents } = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("userId", user.$id)]
      );
      userProfile = documents.length > 0 ? documents[0] : null;
    }
  } catch (error) {
    console.error(
      "Failed to fetch user profile in TeachersDashboardPage:",
      error
    );
    // If profile fetch fails, consider it an issue and redirect
    redirect("/"); // Or to an error page
    return null;
  }

  // If user is not a teacher, redirect them away from the teacher dashboard
  if (!userProfile || userProfile.accountType !== "teacher") {
    console.log(
      "Unauthorized access to Teachers Dashboard. Redirecting to home."
    );
    redirect("/"); // Redirect to home or a generic dashboard
    return null;
  }

  // Server-side reading of dashboard error/success cookies set by server actions
  const cookiesStore = await cookies();
  const dashboardError = cookiesStore.get("dashboardError")?.value;
  const dashboardSuccess = cookiesStore.get("dashboardSuccess")?.value;

  // Fetch books for the logged-in teacher using a server action
  const teacherBooks = await getTeacherBooksAction();

  return (
    <div className="min-h-screen bg-gray-100 font-inter flex flex-col items-center py-10 px-4">
      <TeacherDashboardTabs
        dashboardError={dashboardError}
        dashboardSuccess={dashboardSuccess}
        initialBooks={teacherBooks} // Pass the fetched books as a prop
      />
    </div>
  );
}
