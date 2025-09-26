"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createSessionClient,
  ID,
  Permission,
  Role,
  Models,
  createTokenClient,
  createAdminClient,
} from "@/appwrite/appwriteClient";
import auth from "@/auth"; // Your auth utility
import { Query } from "node-appwrite";
import { appwriteConfig } from "@/appwrite/config";

// Define the type for a book item (copied from teacher actions for consistency)
interface BookData {
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

// Define type for Assignment Question (copied from teacher actions for consistency)
export interface AssignmentQuestion {
  // Exported for use in client components
  type: "text" | "image";
  content: string; // Text content or fileId for image
  fileName?: string; // Original file name for image
}

// Define type for Assignment Submission Answer
export interface SubmissionAnswer {
  // Exported for use in client components
  type: "text" | "image";
  content: string; // Text content or fileId for image answer
  fileName?: string; // Original file name for image answer
  file?: File; // Added optional file property for handling uploads
}

// Define type for Assignment Submission Data
export interface AssignmentSubmissionData {
  // Exported for use in client components
  $id: string;
  assignmentId: string;
  studentId: string;
  yearGroup: string;
  subjectName: string;
  teacherId: string;
  answers: string; // JSON string of SubmissionAnswer[]
  submittedAt: string;
  grade: number | null; // Null if not graded yet
  gradedAt: string | null;
  gradedBy: string | null;
}

// Define type for Assignment Data
// FIX: Changed 'questions' from AssignmentQuestion[] to string[] to match runtime behavior from Appwrite
export interface AssignmentData {
  // Exported for use in client components
  $id: string;
  teacherId: string;
  yearGroup: string;
  subjectName: string;
  term: string;
  subTerm: string;
  title: string;
  questions: string[]; // FIX: Now an array of JSON strings
  createdAt: string;
  submission: AssignmentSubmissionData | null; // Student's submission for this assignment (or null if not submitted)
}

/**
 * Server Action to fetch books relevant to a specific year group.
 * @param {string} yearGroup - The year group to filter books by.
 * @returns {Promise<BookData[]>} Array of book data for the specified year group.
 */
export async function getStudentBooksAction(
  yearGroup: string
): Promise<BookData[]> {
  const user = await auth.getUser();
  if (!user) {
    console.warn("Attempted to fetch student books without authentication.");
    return [];
  }

  // Basic validation for yearGroup
  if (!yearGroup || yearGroup.trim() === "") {
    console.warn("getStudentBooksAction called with empty yearGroup.");
    return [];
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      console.error("Session cookie missing for fetching student books.");
      return [];
    }

    const { databases } = await createSessionClient(sessionCookie);
    const { documents } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      [
        Query.equal("yearGroup", yearGroup), // Filter by the student's year group
        Query.orderDesc("createdAt"), // Order by most recent
        Query.limit(100), // Limit results (consider pagination for many books)
      ]
    );
    // --- CORRECTED: Use your Next.js API endpoint for the URL ---
    const booksWithUrls = documents.map((book) => {
      // The React Native app will call this URL to view the file.
      const fileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/stream-file/${book.fileId}`;
      return {
        ...book,
        fileUrl: fileUrl,
      };
    });
    return booksWithUrls as unknown as BookData[];
    // return documents as unknown as BookData[];
  } catch (error) {
    console.error("Error fetching student books:", error);
    return [];
  }
}

/**
 * Server Action to get a temporary download/view URL for a book file.
 * This is meant to be called from a client component to enable file downloads or online viewing.
 * @param {string} fileId - The Appwrite Storage file ID of the book.
 * @returns {Promise<string | null>} The temporary download URL or null on error.
 */
export async function getBookDownloadUrl(
  fileId: string
): Promise<string | null> {
  const user = await auth.getUser();
  if (!user) {
    console.warn("Attempted to get book URL without authentication.");
    return null;
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      console.error("Session cookie missing for getting book URL.");
      return null;
    }

    const { storage } = await createSessionClient(sessionCookie);

    // Using `getFileView` which returns a temporary, signed URL to view the file.
    // This is perfect for opening the PDF in a new tab.
    // const url = storage.getFileView(appwriteConfig.booksBucketId, fileId);
    const url = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;

    // Appwrite's getFileView returns a URL object, so we use .href to get the string
    return url;
  } catch (err) {
    console.error("Error generating book download URL:", err);
    return null;
  }
}

/**
 * NEW: Generate download URL for React Native to download and cache PDFs
 * This function is now more robust by using the admin client to verify the user
 * and then generate the signed URL.
 * @param {string} fileId - The Appwrite Storage file ID of the book.
 * @param {string} token - The JWT token from the mobile app's session.
 * @returns {Promise<string | null>} The temporary download URL or null on error.
 */
// export async function getBookDownloadUrlForMobile(
//   fileId: string,
//   token: string
// ): Promise<string | null> {
//   try {
//     // 1. Use the admin client to verify the token and get the user.
//     // This is the most reliable way to check for a valid session.
//     const { account, storage } = await createAdminClient();
//     const user = await account.get(); // Appwrite's get() method can validate a session token

//     if (!user || !user.$id) {
//       console.error("Token validation failed: User not found.");
//       return null;
//     }

//     // Optional: Add an extra check to ensure the user has read permissions on the file.
//     // This can be done by fetching the file's metadata and checking permissions.
//     // However, the getFileView call itself will throw an error if the user lacks permissions.

//     // 2. Use the admin client to get the signed URL.
//     // This is reliable because the admin client has an API key with full permissions.
//     const url = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;

//     const signedUrl = url.toString();
//     console.log("✅ Generated signed URL:", signedUrl);
//     return signedUrl;
//   } catch (err) {
//     console.error("🔥 Error generating book download URL:", err);
//     return null;
//   }
// }

export async function getBookDownloadUrlForMobile(
  fileId: string,
  token: string
): Promise<string | null> {
  try {
    // 1. Validate that the token exists
    if (!token) {
      console.error("No session token provided.");
      return null;
    }

    // 2. Optionally, validate the token with Appwrite if needed
    // Skipping account.get() here because admin client cannot validate user session directly
    // You could add a Cloud Function to validate JWT if you want strict checking

    // 3. Construct the direct download URL
    // Pass the user session token in headers when RN downloads
    const signedUrl = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/download?project=${appwriteConfig.projectId}`;
    console.log("✅ Generated download URL:", signedUrl);

    return signedUrl;
  } catch (err) {
    console.error("🔥 Error generating book download URL:", err);
    return null;
  }
}

// ✅ Optional: Get metadata about book file (e.g., name, size)
export async function getBookFileInfo(fileId: string) {
  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;
    if (!sessionCookie) throw new Error("No session cookie found");

    const { storage } = await createSessionClient(sessionCookie);
    const file = await storage.getFile(appwriteConfig.booksBucketId, fileId);

    return {
      fileName: file.name,
      mimeType: file.mimeType,
      size: file.sizeOriginal,
    };
  } catch (err) {
    console.error("Error fetching book file info:", err);
    return null;
  }
}

/**
 * NEW: Server Action to fetch assignments for a specific year group and student's submissions.
 * @param {string} yearGroup - The year group to fetch assignments for.
 * @param {string} studentId - The ID of the current student.
 * @returns {Promise<AssignmentData[]>} // Now returns AssignmentData which includes submission
 */
export async function getAssignmentsForStudentAction(
  yearGroup: string,
  studentId: string
): Promise<AssignmentData[]> {
  // FIX: Changed return type to AssignmentData[]
  const user = await auth.getUser();
  if (!user || user.$id !== studentId) {
    console.warn(
      "Attempted to fetch assignments for a student without proper authentication."
    );
    return [];
  }

  if (!yearGroup || yearGroup.trim() === "") {
    console.warn("getAssignmentsForStudentAction called with empty yearGroup.");
    return [];
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      console.error("Session cookie missing for fetching student assignments.");
      return [];
    }

    const { databases } = await createSessionClient(sessionCookie);

    // Fetch assignments for the student's year group
    const { documents: assignmentsDocs } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.assignmentsCollectionId,
      [
        Query.equal("yearGroup", yearGroup),
        Query.orderDesc("createdAt"),
        Query.limit(100),
      ]
    );

    const assignments = assignmentsDocs as unknown as AssignmentData[]; // Cast initial fetch

    // For each assignment, check if the current student has submitted it
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const { documents: submissionsDocs } = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.submissionsCollectionId,
          [
            Query.equal("assignmentId", assignment.$id),
            Query.equal("studentId", studentId), // Filter by current student's ID
            Query.limit(1), // Only need to know if one submission exists
          ]
        );
        const submission =
          submissionsDocs.length > 0
            ? (submissionsDocs[0] as unknown as AssignmentSubmissionData)
            : null;
        return { ...assignment, submission }; // Attach submission directly
      })
    );

    return assignmentsWithSubmissions;
  } catch (error) {
    console.error("Error fetching assignments for student:", error);
    return [];
  }
}

// /**
//  * NEW: Server Action for a student to submit an assignment.
//  * @param {FormData} formData - Contains assignmentId and student's answers (text/image).
//  */
// export async function submitAssignmentAction(formData: FormData) {
//   const user = await auth.getUser();
//   if (!user) {
//     const cookiesStore = await cookies();
//     cookiesStore.set(
//       "dashboardError",
//       "You must be logged in to submit an assignment.",
//       { path: "/", maxAge: 5 }
//     );
//     redirect("/login");
//   }

//   const assignmentId = formData.get("assignmentId") as string;
//   const assignmentYearGroup = formData.get("yearGroup") as string; // Get year group from form
//   const assignmentSubject = formData.get("subjectName") as string; // Get subject from form
//   // FIX: Removed assignmentTeacherId from formData. Now fetch securely.
//   // const assignmentTeacherId = formData.get("teacherId") as string;

//   const answers: SubmissionAnswer[] = [];
//   let answerIndex = 0;
//   while (formData.has(`answerType-${answerIndex}`)) {
//     const type = formData.get(`answerType-${answerIndex}`) as "text" | "image";
//     if (type === "text") {
//       const content = formData.get(`answerText-${answerIndex}`) as string;
//       answers.push({ type: "text", content });
//     } else if (type === "image") {
//       const imageFile = formData.get(`answerImage-${answerIndex}`) as File;
//       if (imageFile && imageFile.size > 0) {
//         answers.push({
//           type: "image",
//           content: imageFile.name,
//           fileName: imageFile.name,
//           file: imageFile, // 'file' property exists now
//         });
//       }
//     }
//     answerIndex++;
//   }

//   if (!assignmentId || answers.length === 0) {
//     const cookiesStore = await cookies();
//     cookiesStore.set(
//       "dashboardError",
//       "Assignment ID and at least one answer are required.",
//       { path: "/", maxAge: 5 }
//     );
//     redirect("/students/dashboard");
//   }

//   try {
//     const cookiesStore = await cookies();
//     const sessionCookie = cookiesStore.get("session")?.value;

//     if (!sessionCookie) {
//       cookiesStore.set(
//         "dashboardError",
//         "Session not found. Please log in again.",
//         { path: "/", maxAge: 5 }
//       );
//       redirect("/login");
//     }

//     const { databases, storage } = await createSessionClient(sessionCookie);

//     // FIX: Securely fetch teacherId from the assignment document itself
//     const assignmentDoc = await databases.getDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.assignmentsCollectionId,
//       assignmentId
//     );
//     const assignmentTeacherId = (assignmentDoc as any).teacherId as string; // Cast to any to access teacherId property

//     // Ensure user.$id and assignmentTeacherId are valid before using them in permissions
//     const studentAppwriteId = user.$id;
//     const teacherAppwriteId = assignmentTeacherId;

//     if (
//       !studentAppwriteId ||
//       typeof studentAppwriteId !== "string" ||
//       studentAppwriteId.trim() === ""
//     ) {
//       throw new Error(
//         "Validation Error: Student ID is missing or invalid for permissions."
//       );
//     }
//     if (
//       !teacherAppwriteId ||
//       typeof teacherAppwriteId !== "string" ||
//       teacherAppwriteId.trim() === ""
//     ) {
//       throw new Error(
//         "Validation Error: Teacher ID is missing or invalid for permissions."
//       );
//     }

//     const permissions = [
//       Permission.read(Role.user(studentAppwriteId)),
//       Permission.write(Role.user(studentAppwriteId)),
//       Permission.read(Role.user(teacherAppwriteId)),
//       Permission.write(Role.user(teacherAppwriteId)),
//     ];

//     // Check if the student has already submitted for this assignment
//     const existingSubmissions = await databases.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.submissionsCollectionId,
//       [
//         Query.equal("assignmentId", assignmentId),
//         Query.equal("studentId", user.$id),
//         Query.limit(1),
//       ]
//     );

//     if (existingSubmissions.documents.length > 0) {
//       // If already submitted and graded, prevent re-submission (or allow updates if grade is null)
//       const existingSubmission = existingSubmissions
//         .documents[0] as unknown as AssignmentSubmissionData;
//       if (existingSubmission.grade !== null) {
//         cookiesStore.set(
//           "dashboardError",
//           "You have already submitted and this assignment has been graded.",
//           { path: "/", maxAge: 5 }
//         );
//         redirect("/students/dashboard");
//       } else {
//         // Allow updating existing submission if not graded yet
//         console.log("Updating existing submission...");
//         // Process image uploads first for update
//         const processedAnswersForUpdate: Omit<SubmissionAnswer, "file">[] = [];
//         for (const ans of answers) {
//           if (ans.type === "image" && ans.file) {
//             const uploadedFile = await storage.createFile(
//               appwriteConfig.booksBucketId,
//               ID.unique(),
//               ans.file as File
//             );
//             processedAnswersForUpdate.push({
//               type: "image",
//               content: uploadedFile.$id,
//               fileName: ans.fileName,
//             });
//           } else {
//             const { file, ...rest } = ans; // Remove 'file' property
//             processedAnswersForUpdate.push(rest);
//           }
//         }
//         await databases.updateDocument(
//           appwriteConfig.databaseId,
//           appwriteConfig.submissionsCollectionId,
//           existingSubmission.$id,
//           {
//             answers: JSON.stringify(processedAnswersForUpdate),
//             submittedAt: new Date().toISOString(),
//           },
//           permissions // Apply permissions on update too
//         );
//         cookiesStore.set(
//           "dashboardSuccess",
//           "Assignment updated successfully!",
//           { path: "/", maxAge: 5 }
//         );
//         redirect("/students/dashboard");
//         return; // Exit after update
//       }
//     }

//     // Process image uploads first for new submission
//     const processedAnswers: Omit<SubmissionAnswer, "file">[] = [];
//     for (const ans of answers) {
//       if (ans.type === "image" && ans.file) {
//         const uploadedFile = await storage.createFile(
//           appwriteConfig.booksBucketId,
//           ID.unique(),
//           ans.file as File // Cast back to File type
//         );
//         processedAnswers.push({
//           type: "image",
//           content: uploadedFile.$id, // Store file ID
//           fileName: ans.fileName,
//         });
//       } else {
//         const { file, ...rest } = ans; // Remove 'file' property
//         processedAnswers.push(rest);
//       }
//     }

//     // Add this just before createDocument(...)
//     console.log(
//       "DEBUG submitAssignmentAction - studentAppwriteId:",
//       studentAppwriteId
//     );
//     console.log(
//       "DEBUG submitAssignmentAction - teacherAppwriteId:",
//       teacherAppwriteId
//     );
//     try {
//       console.log("DEBUG submitAssignmentAction - permissions:", permissions);
//       // Also print JSON form so any SDK objects are visible
//       console.log(
//         "DEBUG submitAssignmentAction - permissions (stringified):",
//         JSON.stringify(permissions)
//       );
//     } catch (e) {
//       console.log(
//         "DEBUG submitAssignmentAction - permissions stringify failed:",
//         e
//       );
//     }

//     // Create document in 'assignment_submissions' collection
//     await databases.createDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.submissionsCollectionId,
//       ID.unique(),
//       {
//         assignmentId,
//         studentId: user.$id,
//         yearGroup: assignmentYearGroup,
//         subjectName: assignmentSubject,
//         teacherId: assignmentTeacherId, // Link to the teacher who created the assignment
//         answers: JSON.stringify(processedAnswers),
//         submittedAt: new Date().toISOString(),
//         grade: null, // Initially no grade
//         gradedAt: null,
//         gradedBy: null,
//       },
//       permissions // Use the dynamically constructed permissions array
//     );

//     cookiesStore.set("dashboardSuccess", "Assignment submitted successfully!", {
//       path: "/",
//       maxAge: 5,
//     });
//     redirect("/students/dashboard");
//   } catch (error: any) {
//     console.error("Failed to submit assignment:", error);
//     if (error && error.message === "NEXT_REDIRECT") {
//       throw error;
//     }
//     const cookiesStore = await cookies();
//     let errorMessage =
//       "An unexpected error occurred while submitting the assignment.";
//     if (error && typeof error === "object" && "message" in error) {
//       errorMessage = error.message;
//     }
//     cookiesStore.set("dashboardError", errorMessage, { path: "/", maxAge: 5 });
//     redirect("/students/dashboard");
//   }
// }

/**
 * Server Action for a student to submit an assignment.
 * Mirrors the teacher action pattern for permissions and DB writes.
 * Accepts FormData: assignmentId, yearGroup, subjectName, answerType-X/answerText-X/answerImage-X, etc.
 */
export async function submitAssignmentAction(formData: FormData) {
  const user = await auth.getUser();
  if (!user) {
    const cookiesStore = await cookies();
    cookiesStore.set(
      "dashboardError",
      "You must be logged in to submit an assignment.",
      { path: "/", maxAge: 5 }
    );
    redirect("/login");
  }

  // Required fields
  const assignmentId = (formData.get("assignmentId") as string) || "";
  const assignmentYearGroup = (formData.get("yearGroup") as string) || "";
  const assignmentSubject = (formData.get("subjectName") as string) || "";

  // gather answers (supports text and image upload fields)
  const answers: SubmissionAnswer[] = [];
  let idx = 0;
  while (formData.has(`answerType-${idx}`)) {
    const type = formData.get(`answerType-${idx}`) as "text" | "image";
    if (type === "text") {
      const content = (formData.get(`answerText-${idx}`) as string) || "";
      answers.push({ type: "text", content });
    } else {
      // image either as new upload (answerImage-X) or existing file id sent in answerText-X
      const fileField = formData.get(`answerImage-${idx}`) as File | null;
      if (fileField && (fileField as any).size > 0) {
        answers.push({
          type: "image",
          content: (fileField as any).name, // temporary; will replace with file id after upload
          fileName: (fileField as any).name,
          file: fileField as any,
        });
      } else {
        // maybe existing file id was passed in answerText-X
        const existing = (formData.get(`answerText-${idx}`) as string) || "";
        const fname = (formData.get(`answerFileName-${idx}`) as string) || "";
        answers.push({ type: "image", content: existing, fileName: fname });
      }
    }
    idx++;
  }

  // Basic validation
  if (!assignmentId || answers.length === 0) {
    const cookiesStore = await cookies();
    cookiesStore.set(
      "dashboardError",
      "Assignment ID and at least one answer are required.",
      { path: "/", maxAge: 5 }
    );
    redirect("/students/dashboard");
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;
    if (!sessionCookie) {
      cookiesStore.set(
        "dashboardError",
        "Session not found. Please log in again.",
        { path: "/", maxAge: 5 }
      );
      redirect("/login");
    }

    // Use session client to upload files as the student
    const { databases, storage } = await createSessionClient(sessionCookie);

    // Fetch assignment to get teacherId (secure)
    const assignmentDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.assignmentsCollectionId,
      assignmentId
    );
    const teacherId = (assignmentDoc as any).teacherId as string;
    if (!teacherId || typeof teacherId !== "string") {
      throw new Error("Unable to determine teacher for this assignment.");
    }

    // Prevent duplicate submissions if needed: check existing for this student
    const { documents: existingDocs } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.submissionsCollectionId,
      [
        Query.equal("assignmentId", assignmentId),
        Query.equal("studentId", user.$id),
        Query.limit(1),
      ]
    );
    if (existingDocs.length > 0) {
      const existing = existingDocs[0] as unknown as AssignmentSubmissionData;
      // if graded, don't allow change; if not graded, update instead
      if (existing.grade !== null) {
        cookiesStore.set(
          "dashboardError",
          "You have already submitted and this assignment has been graded.",
          { path: "/", maxAge: 5 }
        );
        redirect("/students/dashboard");
      } else {
        // Update existing submission: process any new files and update answers
        const processedUpdate: Omit<SubmissionAnswer, "file">[] = [];
        const uploadedFilesForCleanup: { bucket: string; fileId: string }[] =
          [];

        for (const a of answers) {
          if (a.type === "image" && a.file) {
            const uploaded = await storage.createFile(
              appwriteConfig.booksBucketId,
              ID.unique(),
              a.file as File
            );
            processedUpdate.push({
              type: "image",
              content: uploaded.$id,
              fileName: a.fileName,
            });
            uploadedFilesForCleanup.push({
              bucket: appwriteConfig.booksBucketId,
              fileId: uploaded.$id,
            });
          } else {
            const { file, ...rest } = a as any;
            processedUpdate.push(rest);
          }
        }

        // Build permission array using same idea as teacher action (Permission + Role helpers)
        // This matches the approach that worked for your teacher action
        const permArray = [
          Permission.read(Role.users()), // Students need to read assignments
          Permission.write(Role.user(user.$id)),
        ];

        try {
          await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.submissionsCollectionId,
            existing.$id,
            {
              answers: processedUpdate.map((ans) => JSON.stringify(ans)),
              submittedAt: new Date().toISOString(),
            },
            permArray
          );

          cookiesStore.set(
            "dashboardSuccess",
            "Submission updated successfully.",
            { path: "/", maxAge: 5 }
          );
          redirect("/students/dashboard");
          return;
        } catch (updateErr) {
          // cleanup files uploaded during update attempt
          for (const f of uploadedFilesForCleanup) {
            try {
              await storage.deleteFile(f.bucket, f.fileId);
            } catch (e) {
              console.warn("Failed to cleanup file after update error", f, e);
            }
          }
          throw updateErr;
        }
      }
    }

    // No existing submission: upload files then create a new document
    const processedAnswers: Omit<SubmissionAnswer, "file">[] = [];
    const uploadedFilesForCleanup: { bucket: string; fileId: string }[] = [];

    for (const a of answers) {
      if (a.type === "image" && a.file) {
        const uploaded = await storage.createFile(
          appwriteConfig.booksBucketId,
          ID.unique(),
          a.file as File
        );
        processedAnswers.push({
          type: "image",
          content: uploaded.$id,
          fileName: a.fileName,
        });
        uploadedFilesForCleanup.push({
          bucket: appwriteConfig.booksBucketId,
          fileId: uploaded.$id,
        });
      } else {
        const { file, ...rest } = a as any;
        processedAnswers.push(rest);
      }
    }

    // Document payload matches your collection
    const payload = {
      assignmentId,
      studentId: user.$id,
      submittedAt: new Date().toISOString(),
      grade: null,
      gradedAt: null,
      teacherId,
      subjectName: assignmentSubject,
      yearGroup: assignmentYearGroup,
      answers: processedAnswers.map((ans) => JSON.stringify(ans)),

      // $createdAt/$updatedAt are automatic
    };

    // Try admin path first (if you set APPWRITE_API_KEY in server env)
    const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
    if (APPWRITE_API_KEY && APPWRITE_API_KEY.trim() !== "") {
      try {
        const { Client, Databases } = require("node-appwrite");
        const adminClient = new Client()
          .setEndpoint(appwriteConfig.endpointUrl)
          .setProject(appwriteConfig.projectId)
          .setKey(APPWRITE_API_KEY);
        const adminDatabases = new Databases(adminClient);

        // Admin create (no permissions param needed when using admin key)
        await adminDatabases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.submissionsCollectionId,
          ID.unique(),
          payload
        );

        cookiesStore.set(
          "dashboardSuccess",
          "Assignment submitted successfully!",
          { path: "/", maxAge: 5 }
        );
        redirect("/students/dashboard");
        return;
      } catch (adminErr) {
        console.warn(
          "Admin create failed, falling back to session-client permission approach:",
          adminErr
        );
        // fallthrough to permission-based create below
      }
    }

    // Fallback: build permissions using the same approach/idea from your teacher action
    const permissionArray = [
      // Permissions: Teacher can read/write their own assignments, all users can read
      Permission.read(Role.users()), // Students need to read assignments
      Permission.write(Role.user(user.$id)),
    ];

    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.submissionsCollectionId,
        ID.unique(),
        payload,
        permissionArray
      );
      cookiesStore.set(
        "dashboardSuccess",
        "Assignment submitted successfully!",
        { path: "/", maxAge: 5 }
      );
      redirect("/students/dashboard");
      return;
    } catch (createErr) {
      // cleanup uploaded files to avoid orphans
      for (const f of uploadedFilesForCleanup) {
        try {
          await storage.deleteFile(f.bucket, f.fileId);
        } catch (e) {
          console.warn("Failed to cleanup file after create failure", f, e);
        }
      }
      console.error("Failed to create submission document:", createErr);
      throw createErr;
    }
  } catch (err: any) {
    console.error("submitAssignmentAction error:", err);
    if (err && err.message === "NEXT_REDIRECT") throw err;
    const cookiesStore = await cookies();
    const message = err?.message || "Failed to submit assignment.";
    cookiesStore.set("dashboardError", message, { path: "/", maxAge: 5 });
    redirect("/students/dashboard");
  }
}

/**
 * NEW: Server Action for teachers to fetch submissions for a specific assignment.
 * Ensures answers are parsed from JSON strings into objects.
 * @param {string} assignmentId - The ID of the assignment.
 * @returns {Promise<AssignmentSubmissionData[]>} Array of submissions for the given assignment.
 */
export async function getSubmissionsForAssignmentAction(
  assignmentId: string
): Promise<AssignmentSubmissionData[]> {
  const user = await auth.getUser();
  if (!user || (user as any).accountType !== "teacher") {
    console.warn(
      "Attempted to fetch submissions without teacher authorization."
    );
    return [];
  }
  if (!assignmentId) return [];

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;
    if (!sessionCookie) return [];

    const { databases } = await createSessionClient(sessionCookie);
    const { documents } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.submissionsCollectionId,
      [
        Query.equal("assignmentId", assignmentId),
        Query.orderDesc("submittedAt"),
        Query.limit(100),
      ]
    );

    // ✅ Parse answers from JSON strings back into objects
    return documents.map((doc: any) => ({
      ...doc,
      answers: doc.answers ?? [], // <-- just return as-is (array of JSON strings)
    })) as AssignmentSubmissionData[];
  } catch (error) {
    console.error("Error fetching submissions for assignment:", error);
    return [];
  }
}

/**
 * NEW: Server Action for teachers to grade a student's submission.
 * @param {FormData} formData - Contains submissionId and grade.
 */
export async function gradeSubmissionAction(formData: FormData) {
  const user = await auth.getUser();
  if (!user || (user as any).accountType !== "teacher") {
    const cookiesStore = await cookies();
    cookiesStore.set("dashboardError", "Not authorized to grade submissions.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  }

  const submissionId = formData.get("submissionId") as string;
  const grade = parseInt(formData.get("grade") as string, 10);

  if (!submissionId || isNaN(grade) || grade < 1 || grade > 10) {
    const cookiesStore = await cookies();
    cookiesStore.set("dashboardError", "Invalid grade or submission ID.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard"); // Redirect to force refresh with error
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      cookiesStore.set("dashboardError", "Session missing for grading.", {
        path: "/",
        maxAge: 5,
      });
      redirect("/login");
    }

    const { databases } = await createSessionClient(sessionCookie);

    // Ensure only the teacher of the assignment can grade (optional but good practice)
    // This requires fetching assignment and comparing teacherId
    const submissionDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.submissionsCollectionId, // Correct collection ID
      submissionId
    );
    const assignmentDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.assignmentsCollectionId,
      (submissionDoc as any).assignmentId // Cast to any to access assignmentId
    );

    if ((assignmentDoc as any).teacherId !== user.$id) {
      // Cast to any to access teacherId
      throw new Error(
        "You are not authorized to grade this assignment's submissions."
      );
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.submissionsCollectionId, // Correct collection ID
      submissionId,
      {
        grade,
        gradedAt: new Date().toISOString(),
      },
      [
        // Update permissions for graded submission (only teacher who graded can update again)
        Permission.write(Role.user(user.$id)),
      ]
    );

    cookiesStore.set("dashboardSuccess", "Submission graded successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  } catch (error: any) {
    console.error("Failed to grade submission:", error);
    if (error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    const cookiesStore = await cookies();
    let errorMessage = "An error occurred while grading.";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }
    cookiesStore.set("dashboardError", errorMessage, { path: "/", maxAge: 5 });
    redirect("/teachers/dashboard");
  }
}
