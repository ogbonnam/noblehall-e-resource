"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createSessionClient,
  Permission,
  Role,
} from "@/appwrite/appwriteClient";
import auth from "@/auth"; // Your auth utility to get current user ID
import { Query } from "node-appwrite"; // FIX: Import Query for correct query syntax
import { appwriteConfig } from "@/appwrite/config";

interface CompleteProfileFormData {
  yearGroup?: string | null; // FIX: Made optional and allowed null
  subjects?: string[] | null; // FIX: Made optional and allowed null
}

export async function updateProfile(formData: FormData) {
  const user = await auth.getUser();

  if (!user) {
    const cookiesStore = await cookies();
    cookiesStore.set(
      "profileError",
      "You must be logged in to complete your profile.",
      { path: "/", maxAge: 5 }
    );
    redirect("/login");
    return;
  }

  const yearGroup = formData.get("yearGroup") as string | null; // Can be null if not selected
  const subjects = formData.getAll("subjects") as string[]; // This correctly gets an array

  try {
    // FIX: Get the session cookie value to pass to createSessionClient
    const cookiesStore = await cookies(); // Re-get cookiesStore here for sessionCookie
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      cookiesStore.set(
        "profileError",
        "Session not found. Please log in again.",
        { path: "/", maxAge: 5 }
      );
      redirect("/login");
      return;
    }

    const { databases } = await createSessionClient(sessionCookie); // FIX: Pass the sessionCookie value

    // Find the user's profile document in your 'users' collection
    const { documents } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("userId", user.$id)] // FIX: Corrected query syntax using Query.equal()
    );

    if (documents.length === 0) {
      cookiesStore.set(
        "profileError",
        "User profile not found. Please contact support.",
        { path: "/", maxAge: 5 }
      );
      redirect("/login");
      return;
    }

    const userProfileDocumentId = documents[0].$id;

    // Prepare data for update: include only if present
    const updateData: Partial<CompleteProfileFormData & { updatedAt: string }> =
      {
        updatedAt: new Date().toISOString(), // Add an updatedAt timestamp if you have this attribute
      };

    if (yearGroup !== null && yearGroup.trim() !== "") {
      updateData.yearGroup = yearGroup;
    } else {
      // If yearGroup is explicitly empty/not provided, set it to null
      updateData.yearGroup = null;
    }

    if (subjects.length > 0) {
      updateData.subjects = subjects;
    } else {
      // If no subjects are selected, explicitly set to an empty array (or null)
      updateData.subjects = [];
    }

    // Update the existing user profile document with new data
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userProfileDocumentId,
      updateData // Use the dynamically built updateData object
      // You might need to update the permissions if they were not set correctly on creation
      // For instance, if you want the user to be able to modify their own document:
      // [
      //   Permission.read(Role.user(user.$id)),
      //   Permission.write(Role.user(user.$id)),
      // ]
    );

    cookiesStore.set("profileSuccess", "Profile updated successfully!", {
      path: "/",
      maxAge: 5,
    });

    // FIX: Redirect to students/dashboard after successful update
    redirect("/students/dashboard");
  } catch (error: any) {
    console.error("Profile update failed:", error);
    const cookiesStore = await cookies();
    let errorMessage = "An unexpected error occurred during profile update.";

    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }

    cookiesStore.set("profileError", errorMessage, { path: "/", maxAge: 5 });
    redirect("/students/complete-profile");
  }
}
