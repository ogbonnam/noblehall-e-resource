// src/app/admin/dashboard/page.tsx
// This page is a Server Component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import auth from "@/auth"; // Assuming your auth.ts is in utils
import { createSessionClient } from "@/appwrite/appwriteClient";
import { Query } from "node-appwrite";
import { appwriteConfig } from "@/appwrite/config";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getDashboardStats } from "./actions";

export default async function AdminDashboardPage() {
  const user = await auth.getUser();

  // 1. Check if user is authenticated
  if (!user) {
    console.log("AdminDashboardPage: No user found, redirecting to login.");
    redirect("/login");
  }

  let userProfile: any = null;
  try {
    const cookiesStoreForSession = await cookies();
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
    console.error("AdminDashboardPage: Failed to fetch user profile:", error);
    redirect("/"); // Fallback if profile fetch fails
  }

  // 2. Check if user has admin role
  if (!userProfile || userProfile.accountType !== "admin") {
    console.log(
      `AdminDashboardPage: User ${
        user?.name || user?.$id
      } is not an admin. Redirecting to home.`
    );
    redirect("/"); // Redirect non-admin users
  }

  // Fetch initial dashboard statistics
  const { totalBooks, totalStudents, totalTeachers } =
    await getDashboardStats();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <AdminDashboardClient
        initialStats={{ totalBooks, totalStudents, totalTeachers }}
      />
    </div>
  );
}
