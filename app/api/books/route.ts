// src/app/api/books/route.ts
import { NextResponse } from "next/server";
// Removed import for getStudentBooksAction as its logic is now absorbed here
import {
  createSessionClient,
  createAdminClient,
} from "@/appwrite/appwriteClient"; // Import createAdminClient for Storage
import { Query, Storage, Models } from "node-appwrite"; // Import Storage and Models from node-appwrite
import { appwriteConfig } from "@/appwrite/config";

// Define the Book interface for consistency with HomeScreen.tsx
interface Book {
  $id: string;
  fileId: string;
  title: string;
  topic: string;
  subjectName: string;
  yearGroup: string;
  term: string;
  subTerm: string;
  coverColor: string;
  fileName: string;
  uploaderId: string;
  uploadedByUserName?: string; // Will be resolved here
  createdAt: string;
  fileUrl: string; // Will be generated here
}

// Define the BookData interface from your admin-dashboard-actions.ts for internal use
// This interface is no longer strictly needed here as we're directly fetching and transforming
// but kept for reference if needed elsewhere.
interface BookDataFromAppwrite {
  $id: string; // Appwrite document ID
  fileId: string; // Appwrite Storage file ID
  subjectName: string;
  topic: string;
  yearGroup: string;
  term: string;
  subTerm: string;
  coverColor: string;
  fileName: string;
  uploaderId: string;
  createdAt: string;
}

/**
 * Handles GET requests to /api/books to fetch filtered books for a student.
 * @param {Request} request - The incoming Next.js Request object.
 * @returns {NextResponse} A JSON response containing the filtered books and total count.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters from the URL
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const termFilter = searchParams.get("term") || undefined;
    const subTermFilter = searchParams.get("subTerm") || undefined;
    const searchFilter = searchParams.get("title") || undefined; // Use 'title' for combined search (title/topic)

    // Extract the session token from the Authorization header
    const authorizationHeader = request.headers.get("Authorization");
    const sessionToken = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.substring(7)
      : undefined;

    if (!sessionToken) {
      console.error(
        "API /api/books: No session token found in Authorization header."
      );
      return NextResponse.json(
        { error: "Authentication required to fetch books." },
        { status: 401 }
      );
    }
    console.log(
      `API /api/books: Session token received (first 10 chars): ${sessionToken.substring(
        0,
        10
      )}...`
    );

    let currentUserId: string | undefined;
    let studentYearGroup: string | undefined;
    let sessionDatabases; // Declare sessionDatabases here

    try {
      // Create a session client using the token from the header
      const sessionClientResult = await createSessionClient(sessionToken);
      const { account, databases } = sessionClientResult;
      sessionDatabases = databases; // Assign to the outer scope variable

      // Verify the session by getting the account details
      const appwriteAccount = await account.get();
      currentUserId = appwriteAccount.$id;
      console.log(
        `API /api/books: Appwrite account verified for user ID: ${currentUserId}`
      );

      // Fetch user profile to get yearGroup
      const { documents: userProfiles } = await sessionDatabases.listDocuments(
        // Use sessionDatabases
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("userId", currentUserId)]
      );

      if (userProfiles.length > 0 && userProfiles[0].yearGroup) {
        studentYearGroup = userProfiles[0].yearGroup as string;
        console.log(
          `API /api/books: User profile found, yearGroup: '${studentYearGroup}'`
        );
      } else {
        console.warn(
          `API /api/books: User profile found but yearGroup is missing for user ${currentUserId}.`
        );
      }
    } catch (sessionError: any) {
      console.error(
        "API /api/books: Session validation or user profile fetch failed:",
        sessionError
      );
      return NextResponse.json(
        {
          error: `Invalid session or failed to retrieve user profile: ${
            sessionError.message || "Unknown authentication error"
          }`,
        },
        { status: 401 }
      );
    }

    if (!studentYearGroup) {
      console.warn(
        "API /api/books: Student year group could not be determined. Returning no books."
      );
      return NextResponse.json({
        books: [],
        total: 0,
        studentYearGroup: "N/A",
      });
    }

    // Directly query Appwrite for books based on the student's year group
    const bookQueries: string[] = [
      Query.equal("yearGroup", studentYearGroup),
      Query.orderDesc("createdAt"),
      Query.limit(100), // Fetch a reasonable number to allow in-memory filtering
    ];

    const booksResponse = await sessionDatabases.listDocuments(
      // Use sessionDatabases
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      bookQueries
    );
    const allBooksForYearGroup: BookDataFromAppwrite[] =
      booksResponse.documents as unknown as BookDataFromAppwrite[];

    console.log(
      `API /api/books: Directly fetched ${allBooksForYearGroup.length} books for year group '${studentYearGroup}'.`
    );
    if (allBooksForYearGroup.length > 0) {
      console.log(
        "API /api/books: First book from direct fetch:",
        JSON.stringify(allBooksForYearGroup[0], null, 2)
      );
    }

    // Initialize Appwrite Admin Client for Storage to generate file URLs and resolve uploader names
    // Note: Using Admin Client for Storage here because session client might not have permissions for file downloads
    // if bucket permissions are set to 'role:all' or specific users only.
    const { storage, databases: adminDatabases } = await createAdminClient();

    // Resolve uploader names
    const uploaderIds = Array.from(
      new Set(
        allBooksForYearGroup
          .map((book) => book.uploaderId)
          .filter((id) => id.trim() !== "")
      )
    );
    let usersMap = new Map<string, string>();
    if (uploaderIds.length > 0) {
      const userQueriesForOr = uploaderIds.map((id) =>
        Query.equal("userId", id)
      );
      let finalUserQueries: string[] = [];

      if (userQueriesForOr.length === 1) {
        finalUserQueries.push(userQueriesForOr[0]);
      } else if (userQueriesForOr.length > 1) {
        finalUserQueries.push(Query.or(userQueriesForOr));
      }

      if (finalUserQueries.length > 0) {
        // Only query if there's at least one valid query
        finalUserQueries.push(Query.limit(100)); // Add limit

        const usersResponse = await adminDatabases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          finalUserQueries
        );
        usersResponse.documents.forEach((userDoc: Models.Document) => {
          // Explicitly type userDoc
          usersMap.set(
            userDoc.userId as string,
            (userDoc.name as string) ||
              (userDoc.email as string) ||
              (userDoc.userId as string)
          );
        });
      }
    }

    // Perform in-memory filtering based on term, subTerm, and search (title/topic)
    const filteredBooks = allBooksForYearGroup
      .filter((book) => {
        let matches = true;

        // Filter by term
        if (termFilter && termFilter !== "All" && book.term !== termFilter) {
          matches = false;
        }
        // Filter by subTerm (only if term matches or is "All")
        if (
          matches &&
          subTermFilter &&
          subTermFilter !== "All" &&
          book.subTerm !== subTermFilter
        ) {
          matches = false;
        }
        // Search by title or topic
        if (matches && searchFilter) {
          const lowerCaseSearch = searchFilter.toLowerCase();
          const titleMatches = book.topic
            .toLowerCase()
            .includes(lowerCaseSearch);
          const topicMatches = book.topic
            .toLowerCase()
            .includes(lowerCaseSearch);
          if (!titleMatches && !topicMatches) {
            matches = false;
          }
        }
        return matches;
      })
      .map((book) => ({
        $id: book.$id,
        fileId: book.fileId,
        title: book.topic,
        topic: book.topic,
        subjectName: book.subjectName,
        yearGroup: book.yearGroup,
        term: book.term,
        subTerm: book.subTerm,
        coverColor: book.coverColor,
        fileName: book.fileName,
        uploaderId: book.uploaderId,
        uploadedByUserName: usersMap.get(book.uploaderId) || "Unknown User",
        createdAt: book.createdAt,
        // Generate fileUrl using the server-side Appwrite Storage client
        fileUrl: storage.getFileDownload(
          appwriteConfig.booksBucketId,
          book.fileId
        ),
      }));
    console.log(
      `API /api/books: After in-memory filtering, ${filteredBooks.length} books remain.`
    );

    // Implement pagination on the filtered results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
    const total = filteredBooks.length; // Total count after all filtering

    return NextResponse.json({
      books: paginatedBooks,
      total: total,
      studentYearGroup: studentYearGroup || "N/A", // Provide a fallback if yearGroup is not found
    });
  } catch (error: any) {
    console.error("API /api/books: Top-level error during GET request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch books" },
      { status: 500 }
    );
  }
}
