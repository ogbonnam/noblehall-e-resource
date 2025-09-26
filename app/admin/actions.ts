// src/app/admin/dashboard/actions.ts
"use server";

import {
  createAdminClient,
  createSessionClient,
} from "@/appwrite/appwriteClient";
import { appwriteConfig } from "@/appwrite/config";
import { ID, Query, Models } from "node-appwrite"; // Import Models
import fs from "fs/promises";
import path from "path";

// Define the Book interface for consistency
interface Book {
  $id: string;
  title: string;
  author: string;
  fileName: string;
  fileId: string;
  uploadedBy: string; // This is the userId of the uploader
  uploadedByUserName?: string; // Added to store the resolved user name
  uploadDate: string;
  // Add any other properties your book documents might have
}

// Define the User interface for consistency
interface User {
  $id: string;
  userId: string; // Appwrite User ID (from Appwrite Auth)
  accountType: "student" | "teacher" | "admin";
  isDisabled: boolean;
  email: string; // Assuming email is part of your user profile document
  name?: string; // Assuming name is part of your user profile document
  // Add any other properties your user profile documents might have
}

// Define a specific interface for the book file details returned for download
interface BookFileDownloadDetail {
  fileId: string;
  fileName: string;
}

// Helper to handle Appwrite errors
const handleAppwriteError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  throw new Error(
    `Failed to ${message.toLowerCase()}: ${error.message || error}`
  );
};

/**
 * Fetches dashboard statistics (total books, students, teachers).
 * @returns {Promise<{totalBooks: number, totalBooks: number, totalTeachers: number}>}
 */
export async function getDashboardStats() {
  try {
    const { databases } = await createAdminClient(); // Await createAdminClient
    // Get total books
    const booksResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      [Query.limit(1)] // Just need total count, not all documents
    );
    const totalBooks = booksResponse.total;

    // Get total students and teachers
    // To get accurate counts for students/teachers, we might need to query again
    // or fetch all and filter if the total number of users is small.
    // For simplicity, let's fetch counts for each type.
    const studentsResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountType", "student"), Query.limit(1)]
    );
    const totalStudents = studentsResponse.total;

    const teachersResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountType", "teacher"), Query.limit(1)]
    );
    const totalTeachers = teachersResponse.total;

    return { totalBooks, totalStudents, totalTeachers };
  } catch (error) {
    handleAppwriteError(error, "fetch dashboard statistics");
    return { totalBooks: 0, totalStudents: 0, totalTeachers: 0 }; // Fallback
  }
}

/**
 * Fetches all books from the database and resolves uploader names.
 * @returns {Promise<Book[]>} A list of book documents, typed as Book[].
 */
export async function getBooksAction(): Promise<Book[]> {
  try {
    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      [Query.limit(100)] // Adjust limit as needed, consider pagination for many books
    );

    const books = response.documents;
    // Filter out any invalid or empty uploadedBy values before creating unique IDs
    const validUploaderIds = Array.from(
      new Set(
        books
          .map((book) => book.uploadedBy)
          .filter((id) => typeof id === "string" && id.trim() !== "") // Ensure it's a non-empty string
      )
    );

    let usersMap: Map<string, string> = new Map();
    if (validUploaderIds.length > 0) {
      // Only query if there are valid IDs
      // Fetch user details for all unique uploader IDs
      // Note: Appwrite's listDocuments can take an array for `Query.equal`
      // but if the array is too large, it might hit URL length limits.
      // For very large numbers of users, consider batching queries or a different approach.
      const usersResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [
          Query.or(validUploaderIds.map((id) => Query.equal("userId", id))),
          Query.limit(100),
        ]
      );

      usersResponse.documents.forEach((userDoc: any) => {
        usersMap.set(
          userDoc.userId,
          userDoc.name || userDoc.email || userDoc.userId
        );
      });
    }

    // Explicitly map the generic Models.Document to your Book interface
    return books.map((doc) => ({
      $id: doc.$id,
      title: doc.title as string,
      author: doc.author as string,
      fileName: doc.fileName as string,
      fileId: doc.fileId as string,
      uploadedBy: doc.uploadedBy as string,
      uploadedByUserName: usersMap.get(doc.uploadedBy) || "Unknown User", // Resolve name
      uploadDate: doc.uploadDate as string,
      // Ensure all properties of Book are cast/assigned here
    })) as Book[];
  } catch (error) {
    handleAppwriteError(error, "fetch books");
    return []; // Return empty array on error
  }
}

/**
 * Adds a new book to the database and uploads its file to storage.
 * @param {FormData} formData - The form data containing book details and the file.
 * @returns {Promise<Object>} The created book document.
 */
export async function addBookAction(formData: FormData) {
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const file = formData.get("bookFile") as File;
  const uploadedByUserId = formData.get("uploadedByUserId") as string; // Assuming admin provides this or it's inferred

  if (!title || !author || !file || !uploadedByUserId) {
    throw new Error("Missing required book details or file.");
  }

  try {
    const { databases, storage } = await createAdminClient(); // Await createAdminClient

    // 1. Upload file to Appwrite Storage
    const uploadedFile = await storage.createFile(
      appwriteConfig.booksBucketId,
      ID.unique(),
      file
    );

    // 2. Create document in Appwrite Database
    const newBook = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      ID.unique(),
      {
        title,
        author,
        fileId: uploadedFile.$id,
        fileName: file.name,
        uploadedBy: uploadedByUserId, // Associate with a user, e.g., the teacher who uploaded it
        // Add other fields as necessary, e.g., 'description', 'uploadDate'
        uploadDate: new Date().toISOString(),
      }
    );
    return newBook;
  } catch (error) {
    handleAppwriteError(error, "add book");
  }
}

/**
 * Fetches all users (students and teachers) from the database.
 * @returns {Promise<User[]>} A list of user documents, typed as User[].
 */
export async function getUsersAction(): Promise<User[]> {
  try {
    const { databases } = await createAdminClient();
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [
        Query.or([
          Query.equal("accountType", "student"),
          Query.equal("accountType", "teacher"),
        ]),
        Query.limit(100), // Adjust limit, consider pagination
      ]
    );
    // Explicitly map the generic Models.Document to your User interface
    return response.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId as string,
      accountType: doc.accountType as "student" | "teacher" | "admin",
      isDisabled: doc.isDisabled as boolean,
      email: doc.email as string,
      name: doc.name as string | undefined, // name might be optional
      // Ensure all properties of User are cast/assigned here
    })) as User[];
  } catch (error) {
    handleAppwriteError(error, "fetch users");
    return []; // Return empty array on error
  }
}

/**
 * Updates the disabled status of a user account.
 * @param {string} userId - The Appwrite document ID of the user profile.
 * @param {boolean} isDisabled - The new disabled status.
 * @returns {Promise<Object>} The updated user document.
 */
export async function updateUserStatusAction(
  userId: string,
  isDisabled: boolean
) {
  try {
    const { databases } = await createAdminClient(); // Await createAdminClient
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userId, // Use the document ID of the user profile
      { isDisabled }
    );
    return updatedUser;
  } catch (error) {
    handleAppwriteError(error, "update user status");
  }
}

/**
 * Fetches all book files from Appwrite Storage and provides their fileId and fileName.
 * The client will then generate the download URL using the client-side SDK.
 * @returns {Promise<BookFileDownloadDetail[]>} An array of book file details.
 */
export async function getAllBookFilesAction(): Promise<
  BookFileDownloadDetail[]
> {
  try {
    const { databases } = await createAdminClient(); // Await createAdminClient

    // 1. Get all book metadata from the database to get file IDs
    const books = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      [Query.limit(100)] // Adjust limit, consider pagination for many books
    );

    const fileDetails: BookFileDownloadDetail[] = books.documents.map(
      (book: any) => {
        // Cast book to any for safety here, then map to strict type
        return {
          fileId: book.fileId as string,
          fileName: book.fileName as string,
        };
      }
    );

    return fileDetails;
  } catch (error) {
    handleAppwriteError(error, "get all book files for download");
    return [];
  }
}
