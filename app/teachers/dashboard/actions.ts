"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createSessionClient,
  ID,
  Permission,
  Role,
  Models,
} from "@/appwrite/appwriteClient";
import auth from "@/auth";
import { Query } from "node-appwrite";
import { appwriteConfig } from "@/appwrite/config";
import { createAdminClient } from "@/appwrite/appwriteClient";

// Define expected types for clarity
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

// NEW: Define type for Assignment Question
interface AssignmentQuestion {
  type: "text" | "image";
  content: string; // Text content or fileId for image
  fileName?: string; // Original file name for image
  file?: File; // Temporary for client-side passing before upload
}

// NEW: Define type for Assignment Submission Answer
interface SubmissionAnswer {
  type: "text" | "image";
  content: string; // Text content or fileId for image answer
  fileName?: string; // Original file name for image answer
}

// NEW: Define type for Assignment Data
export interface AssignmentData {
  $id: string;
  teacherId: string;
  yearGroup: string;
  subjectName: string;
  term: string;
  subTerm: string;
  title: string;
  questions: string; // JSON string of AssignmentQuestion[]
  createdAt: string;
}

// NEW: Define type for Assignment Submission Data
export interface AssignmentSubmissionData {
  $id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string;
  grade?: number | null;
  gradedAt?: string | null;
  answers?: any[];
}

export interface SubmissionWithStudentName extends AssignmentSubmissionData {
  studentName: string;
}

// Type for lesson plan documents
export interface LessonPlanData {
  $id: string;
  fileId: string;
  fileName: string;
  teacherId: string;
  subjectName?: string;
  topic?: string;
  yearGroup?: string;
  term?: string;
  subTerm?: string;
  $createdAt: string;
}

export interface SubmissionWithStudentName {
  studentId: string;
  studentName: string;
  assignmentId: string;
  submittedAt: string;
  grade: number | null;
}

export interface AssignmentSubmissionsResult {
  assignmentTitle: string;
  term: string;
  subTerm: string;
  submissions: SubmissionWithStudentName[];
  message?: string; // optional message if no submissions
}

// Type for a submission with student info
export interface SubmissionDetail {
  $id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  title: string;
  term: string;
  subTerm: string;
  questions: any[];
  answers: any[];
  grade: number | null;
  submittedAt: string;
  gradedAt: string | null;
}

// Action to add a new book
export async function addBookAction(formData: FormData) {
  const user = await auth.getUser();

  if (!user) {
    const cookiesStore = await cookies();
    cookiesStore.set("dashboardError", "You must be logged in to add a book.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/login");
  }

  const subjectName = formData.get("subjectName") as string;
  const topic = formData.get("topic") as string;
  const yearGroup = formData.get("yearGroup") as string;
  const term = formData.get("term") as string;
  const subTerm = formData.get("subTerm") as string;
  const coverColor = formData.get("coverColor") as string;
  const pdfFile = formData.get("pdfFile") as File;

  if (
    !subjectName ||
    !topic ||
    !yearGroup ||
    !term ||
    !subTerm ||
    !coverColor ||
    !pdfFile ||
    pdfFile.size === 0
  ) {
    const cookiesStore = await cookies();
    cookiesStore.set(
      "dashboardError",
      "All fields including PDF are required.",
      { path: "/", maxAge: 5 }
    );
    redirect("/teachers/dashboard");
  }
  if (pdfFile.type !== "application/pdf") {
    const cookiesStore = await cookies();
    cookiesStore.set("dashboardError", "Only PDF files are allowed.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
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

    const { databases, storage } = await createSessionClient(sessionCookie);

    // 1. Upload PDF to Appwrite Storage Bucket
    const uploadedFile = await storage.createFile(
      appwriteConfig.booksBucketId,
      ID.unique(),
      pdfFile
    );

    // 2. Create a document in your 'books' collection
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      ID.unique(),
      {
        subjectName,
        topic,
        yearGroup,
        term,
        subTerm,
        coverColor,
        fileId: uploadedFile.$id,
        fileName: pdfFile.name,
        uploaderId: user.$id,
        createdAt: new Date().toISOString(),
      },
      [
        // Permissions: Teacher can read/write their own books
        Permission.read(Role.user(user.$id)),
        Permission.write(Role.user(user.$id)),
      ]
    );

    cookiesStore.set("dashboardSuccess", "Book added successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  } catch (error: any) {
    console.error("Failed to add book:", error);
    if (error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    const cookiesStore = await cookies();
    let errorMessage = "An unexpected error occurred while adding the book.";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }
    cookiesStore.set("dashboardError", errorMessage, { path: "/", maxAge: 5 });
    redirect("/teachers/dashboard");
  }
}

/**
 * Server Action to fetch books uploaded by the current teacher.
 * @returns {Promise<BookData[]>} Array of book data.
 */
export async function getTeacherBooksAction(): Promise<BookData[]> {
  const user = await auth.getUser();
  if (!user) {
    console.warn("Attempted to fetch teacher books without authentication.");
    return [];
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      console.error("Session cookie missing for fetching teacher books.");
      return [];
    }

    const { databases } = await createSessionClient(sessionCookie);
    const { documents } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      [
        Query.equal("uploaderId", user.$id), // Filter by current user's ID
        Query.orderDesc("createdAt"), // Order by most recent
        Query.limit(100), // Limit results (consider pagination for many books)
      ]
    );
    return documents as unknown as BookData[];
  } catch (error) {
    console.error("Error fetching teacher books:", error);
    return [];
  }
}

/**
 * Server Action to delete a book and its associated PDF file.
 * @param {string} bookDocId - The Appwrite document ID of the book.
 * @param {string} fileId - The Appwrite Storage file ID of the associated PDF.
 */
export async function deleteBookAction(bookDocId: string, fileId: string) {
  const user = await auth.getUser();
  if (!user) {
    const cookiesStore = await cookies();
    cookiesStore.set("dashboardError", "Not authorized to delete book.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/login");
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      cookiesStore.set("dashboardError", "Session missing for deletion.", {
        path: "/",
        maxAge: 5,
      });
      redirect("/login");
    }

    const { databases, storage } = await createSessionClient(sessionCookie);

    // Optional: Verify the user is the actual uploader of the book
    const bookDocument = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      bookDocId
    );

    if (bookDocument.uploaderId !== user.$id) {
      throw new Error("You are not authorized to delete this book.");
    }

    // 1. Delete the file from Appwrite Storage
    await storage.deleteFile(appwriteConfig.booksBucketId, fileId);

    // 2. Delete the document from the 'books' collection
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      bookDocId
    );

    cookiesStore.set("dashboardSuccess", "Book deleted successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard"); // Redirect to refresh the list
  } catch (error: any) {
    console.error("Failed to delete book:", error);
    if (error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    const cookiesStore = await cookies();
    let errorMessage = "An error occurred while deleting the book.";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }
    cookiesStore.set("dashboardError", errorMessage, { path: "/", maxAge: 5 });
    redirect("/teachers/dashboard");
  }
}

/**
 * Server Action to update an existing book's details.
 * @param {FormData} formData - Form data containing bookDocId and updated fields.
 */
export async function updateBookAction(formData: FormData) {
  const user = await auth.getUser();
  if (!user) {
    const cookiesStore = await cookies();
    cookiesStore.set("dashboardError", "Not authorized to edit book.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/login");
  }

  const bookDocId = formData.get("bookDocId") as string;
  const updatedData: Partial<
    Omit<BookData, "$id" | "fileId" | "fileName" | "uploaderId" | "createdAt">
  > = {};

  const subjectName = formData.get("subjectName") as string;
  const topic = formData.get("topic") as string;
  const yearGroup = formData.get("yearGroup") as string;
  const term = formData.get("term") as string;
  const subTerm = formData.get("subTerm") as string;
  const coverColor = formData.get("coverColor") as string;

  if (subjectName) updatedData.subjectName = subjectName;
  if (topic) updatedData.topic = topic;
  if (yearGroup) updatedData.yearGroup = yearGroup;
  if (term) updatedData.term = term;
  if (subTerm) updatedData.subTerm = subTerm;
  if (coverColor) updatedData.coverColor = coverColor;

  if (!bookDocId || Object.keys(updatedData).length === 0) {
    const cookiesStore = await cookies();
    cookiesStore.set("dashboardError", "Invalid data for book update.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  }

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      cookiesStore.set("dashboardError", "Session missing for update.", {
        path: "/",
        maxAge: 5,
      });
      redirect("/login");
    }

    const { databases } = await createSessionClient(sessionCookie);

    // Optional: Verify user is uploader
    const bookDocument = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      bookDocId
    );
    if (bookDocument.uploaderId !== user.$id) {
      throw new Error("You are not authorized to edit this book.");
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.booksCollectionId,
      bookDocId,
      updatedData
    );

    cookiesStore.set("dashboardSuccess", "Book updated successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  } catch (error: any) {
    console.error("Failed to update book:", error);
    if (error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    const cookiesStore = await cookies();
    let errorMessage = "An error occurred while updating the book.";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }
    cookiesStore.set("dashboardError", errorMessage, { path: "/", maxAge: 5 });
    redirect("/teachers/dashboard");
  }
}

/**
 * Server Action to create a new assignment.
 * It handles text questions and uploading image questions to Appwrite Storage.
 * @param {FormData} formData - Form data from AddAssignmentForm.
 */
export async function createAssignmentAction(formData: FormData) {
  const user = await auth.getUser();

  if (!user) {
    const cookiesStore = await cookies();
    cookiesStore.set(
      "dashboardError",
      "You must be logged in to create an assignment.",
      { path: "/", maxAge: 5 }
    );
    redirect("/login");
  }

  const subjectName = formData.get("subjectName") as string;
  const yearGroup = formData.get("yearGroup") as string;
  const term = formData.get("term") as string;
  const subTerm = formData.get("subTerm") as string;
  const title = formData.get("title") as string;

  // Extract dynamic questions from FormData
  const questions: AssignmentQuestion[] = [];
  let questionIndex = 0;
  while (formData.has(`questionType-${questionIndex}`)) {
    const type = formData.get(`questionType-${questionIndex}`) as
      | "text"
      | "image";
    if (type === "text") {
      const content = formData.get(`questionText-${questionIndex}`) as string;
      if (content.trim() !== "") {
        questions.push({ type: "text", content });
      }
    } else if (type === "image") {
      const imageFile = formData.get(`questionImage-${questionIndex}`) as File;
      if (imageFile && imageFile.size > 0) {
        questions.push({
          type: "image",
          content: imageFile.name,
          fileName: imageFile.name,
          file: imageFile as any,
        }); // Temporarily store file obj
      }
    }
    questionIndex++;
  }

  // Basic validation
  if (
    !subjectName ||
    !yearGroup ||
    !term ||
    !subTerm ||
    !title ||
    questions.length === 0
  ) {
    const cookiesStore = await cookies();
    cookiesStore.set(
      "dashboardError",
      "Assignment requires title, target audience, and at least one question.",
      { path: "/", maxAge: 5 }
    );
    redirect("/teachers/dashboard");
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

    const { databases, storage } = await createSessionClient(sessionCookie);

    // Process image uploads first
    const processedQuestions: Omit<AssignmentQuestion, "file">[] = []; // Remove 'file' property after processing
    for (const q of questions) {
      if (q.type === "image" && q.file) {
        const uploadedFile = await storage.createFile(
          appwriteConfig.booksBucketId, // Your new bucket ID
          ID.unique(),
          q.file as File // Cast back to File type for Appwrite SDK
        );
        processedQuestions.push({
          type: "image",
          content: uploadedFile.$id, // Store file ID in content
          fileName: q.fileName,
        });
      } else {
        // For text questions or image questions without a file (shouldn't happen with current UI validation)
        // Ensure 'file' property is not part of the object stored in DB
        const { file, ...rest } = q;
        processedQuestions.push(rest);
      }
    }

    // FIX: Stringify each question object before sending to Appwrite
    const questionsForAppwrite = processedQuestions.map((q) =>
      JSON.stringify(q)
    );

    // Create document in your 'assignments' collection
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.assignmentsCollectionId,
      ID.unique(),
      {
        teacherId: user.$id,
        yearGroup,
        subjectName,
        term,
        subTerm,
        title,
        questions: questionsForAppwrite, // Pass the array of JSON strings
        createdAt: new Date().toISOString(),
      },
      [
        // Permissions: Teacher can read/write their own assignments, all users can read
        Permission.read(Role.users()), // Students need to read assignments
        Permission.write(Role.user(user.$id)),
      ]
    );

    cookiesStore.set("dashboardSuccess", "Assignment created successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  } catch (error: any) {
    console.error("Failed to create assignment:", error);
    if (error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    const cookiesStore = await cookies();
    let errorMessage =
      "An unexpected error occurred while creating the assignment.";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }
    cookiesStore.set("dashboardError", errorMessage, { path: "/", maxAge: 5 });
    redirect("/teachers/dashboard");
  }
}

/**
 * NEW: Server Action to get all assignments created by the current teacher,
 * along with their submissions.
 * @returns {Promise<Array<AssignmentData & { submissions: AssignmentSubmissionData[] }>>}
 */
// export async function getAssignmentsForTeacherAction(): Promise<
//   Array<AssignmentData & { submissions: AssignmentSubmissionData[] }>
// > {
//   const user = await auth.getUser();
//   if (!user) {
//     console.warn(
//       "Attempted to fetch teacher's assignments without authentication."
//     );
//     return [];
//   }

//   try {
//     const cookiesStore = await cookies();
//     const sessionCookie = cookiesStore.get("session")?.value;

//     if (!sessionCookie) {
//       console.error("Session cookie missing for fetching teacher assignments.");
//       return [];
//     }

//     const { databases } = await createSessionClient(sessionCookie);

//     // Fetch assignments created by this teacher
//     const { documents: assignmentsDocs } = await databases.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.assignmentsCollectionId,
//       [
//         Query.equal("teacherId", user.$id),
//         Query.orderDesc("createdAt"),
//         Query.limit(100),
//       ]
//     );

//     const assignments = assignmentsDocs as unknown as AssignmentData[];

//     // For each assignment, fetch its submissions
//     const assignmentsWithSubmissions = await Promise.all(
//       assignments.map(async (assignment) => {
//         const { documents: submissionsDocs } = await databases.listDocuments(
//           appwriteConfig.databaseId,
//           appwriteConfig.submissionsCollectionId,
//           [
//             Query.equal("assignmentId", assignment.$id),
//             Query.orderDesc("submittedAt"),
//             Query.limit(100), // Limit submissions per assignment
//           ]
//         );
//         const submissions =
//           submissionsDocs as unknown as AssignmentSubmissionData[];
//         return { ...assignment, submissions };
//       })
//     );

//     return assignmentsWithSubmissions;
//   } catch (error) {
//     console.error("Error fetching assignments for teacher:", error);
//     return [];
//   }
// }

/**
 * NEW: Server Action to get all assignments created by the current teacher,
 * along with their submissions (including student name).
 * @returns {Promise<Array<AssignmentData & { submissions: AssignmentSubmissionData[] }>>}
 */

export async function getAssignmentsForTeacherAction(): Promise<
  Array<AssignmentData & { submissions: AssignmentSubmissionData[] }>
> {
  const user = await auth.getUser();
  if (!user) return [];

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;
    if (!sessionCookie) return [];

    const { databases } = await createSessionClient(sessionCookie);

    // Fetch all assignments created by this teacher
    const { documents: assignmentsDocs } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.assignmentsCollectionId,
      [
        Query.equal("teacherId", user.$id),
        Query.orderDesc("createdAt"),
        Query.limit(100),
      ]
    );

    const assignments = assignmentsDocs as unknown as AssignmentData[];

    // Fetch submissions for each assignment
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const { documents: submissionsDocs } = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.submissionsCollectionId,
          [Query.equal("assignmentId", assignment.$id), Query.limit(100)]
        );

        const submissions =
          submissionsDocs as unknown as AssignmentSubmissionData[];

        return {
          ...assignment,
          submissions,
        };
      })
    );

    return assignmentsWithSubmissions;
  } catch (error) {
    console.error("Error fetching assignments for teacher:", error);
    return [];
  }
}

export async function getSubmissionsByTitleTerm(
  title: string,
  term: string,
  subTerm: string
): Promise<{
  title: string;
  term: string;
  subTerm: string;
  submissions: SubmissionWithStudentName[];
  message?: string;
}> {
  const user = await auth.getUser();
  if (!user)
    return {
      title,
      term,
      subTerm,
      submissions: [],
      message: "Not authenticated",
    };

  const cookiesStore = await cookies();
  const sessionCookie = cookiesStore.get("session")?.value;
  if (!sessionCookie)
    return { title, term, subTerm, submissions: [], message: "No session" };

  const { databases } = await createSessionClient(sessionCookie);

  // Fetch all students
  const { documents: usersDocs } = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.limit(1000)]
  );
  const studentMap: Record<string, string> = {};
  usersDocs.forEach(
    (u: any) => (studentMap[u.userId] = u.fullName || u.userId)
  );
  console.log("Students:", studentMap);

  // Fetch assignments matching title, term, subTerm
  const { documents: assignmentsDocs } = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.assignmentsCollectionId,
    [
      Query.equal("teacherId", user.$id),
      Query.equal("title", title),
      Query.equal("term", term),
      Query.equal("subTerm", subTerm),
    ]
  );

  if (assignmentsDocs.length === 0) {
    return {
      title,
      term,
      subTerm,
      submissions: [],
      message: "No students have submitted this assignment",
    };
  }

  // Collect all submissions from matching assignments
  let submissions: SubmissionWithStudentName[] = [];
  for (const assignment of assignmentsDocs as unknown as AssignmentData[]) {
    const { documents: submissionsDocs } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.submissionsCollectionId,
      [Query.equal("assignmentId", assignment.$id)]
    );

    submissions.push(
      ...(submissionsDocs as any[]).map((doc) => ({
        $id: doc.$id,
        assignmentId: doc.assignmentId,
        studentId: doc.studentId,
        studentName: "", // placeholder
        submittedAt: doc.submittedAt,
        grade: doc.grade ?? null,
        gradedAt: doc.gradedAt ?? null,
        answers: doc.answers ?? [],
      }))
    );
  }

  // Map student IDs to names
  submissions = submissions.map((s) => ({
    ...s,
    studentName: studentMap[s.studentId] || s.studentId,
  }));

  console.log(
    "Submissions with student names:",
    submissions.map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
    }))
  );

  return {
    title,
    term,
    subTerm,
    submissions,
    message:
      submissions.length === 0 ? "No students have submitted yet" : undefined,
  };
}

export async function getSubmissionById(
  submissionId: string
): Promise<SubmissionDetail | null> {
  const user = await auth.getUser();
  if (!user) return null;

  const cookiesStore = await cookies();
  const sessionCookie = cookiesStore.get("session")?.value;
  if (!sessionCookie) return null;

  const { databases } = await createSessionClient(sessionCookie);

  try {
    // Fetch the submission using listDocuments + filter
    const { documents: submissions } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.submissionsCollectionId,
      [Query.equal("$id", submissionId), Query.limit(1)]
    );

    if (submissions.length === 0) return null;
    const submission = submissions[0];

    // Fetch the corresponding assignment using listDocuments + filter
    const { documents: assignments } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.assignmentsCollectionId,
      [Query.equal("$id", submission.assignmentId), Query.limit(1)]
    );

    if (assignments.length === 0) return null;
    const assignment = assignments[0];

    // Fetch all students to map studentId → fullName
    const { documents: usersDocs } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.limit(1000)]
    );
    const studentMap: Record<string, string> = {};
    usersDocs.forEach((u: any) => {
      studentMap[u.userId] = u.fullName || u.userId;
    });

    return {
      $id: submission.$id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      studentName: studentMap[submission.studentId] || submission.studentId,
      title: assignment.title,
      term: assignment.term,
      subTerm: assignment.subTerm,
      questions: assignment.questions ?? [],
      answers: submission.answers ?? [],
      grade: submission.grade ?? null,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt ?? null,
    };
  } catch (err) {
    console.error("Failed to fetch submission:", err);
    return null;
  }
}

export async function saveGradeAction(submissionId: string, grade: number) {
  const cookiesStore = await cookies();
  const sessionCookie = cookiesStore.get("session")?.value;
  if (!sessionCookie) throw new Error("No session");

  const { databases } = await createSessionClient(sessionCookie);

  // Find the submission via listDocuments
  const { documents: submissions } = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.submissionsCollectionId,
    [Query.equal("$id", submissionId), Query.limit(1)]
  );

  if (submissions.length === 0) throw new Error("Submission not found");

  const submission = submissions[0];

  // Update grade
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.submissionsCollectionId,
    submission.$id,
    { grade, gradedAt: new Date().toISOString() }
  );
}

/**
 * ➕ Add a new lesson plan
 */
export async function addLessonPlanAction(formData: FormData) {
  const user = await auth.getUser();
  if (!user) {
    const store = await cookies();
    store.set("dashboardError", "You must be logged in to add a lesson plan.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/login");
  }

  const pdfFile = formData.get("lessonPlan") as File;
  if (!pdfFile || pdfFile.size === 0) {
    const store = await cookies();
    store.set("dashboardError", "PDF file is required.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  }
  if (pdfFile.type !== "application/pdf") {
    const store = await cookies();
    store.set("dashboardError", "Only PDF files are allowed.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  }

  try {
    const store = await cookies();
    const sessionCookie = store.get("session")?.value;
    if (!sessionCookie) redirect("/login");

    const { databases, storage } = await createSessionClient(sessionCookie);

    // Upload file
    const uploadedFile = await storage.createFile(
      appwriteConfig.booksBucketId, // make sure this is the correct bucket
      ID.unique(),
      pdfFile,
      [
        Permission.read(Role.user(user.$id)), // only teacher can read
        Permission.update(Role.user(user.$id)), // teacher can update
        Permission.delete(Role.user(user.$id)), // teacher can delete
      ]
    );

    // Extract fields from formData
    const subjectName = formData.get("subjectName") as string;
    const yearGroup = formData.get("yearGroup") as string;
    const term = formData.get("term") as string;
    const subTerm = formData.get("subTerm") as string;

    // Create DB document (NO createdAt, Appwrite adds $createdAt automatically)
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.lessonplanCollectionId,
      ID.unique(),
      {
        fileId: uploadedFile.$id,
        fileName: uploadedFile.name,
        teacherId: user.$id,
        subjectName,

        yearGroup,
        term,
        subTerm,
      },
      [
        Permission.read(Role.user(user.$id)), // teacher-only read
        Permission.update(Role.user(user.$id)), // teacher-only update
        Permission.delete(Role.user(user.$id)), // teacher-only delete
      ]
    );

    store.set("dashboardSuccess", "Lesson plan added successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  } catch (error: any) {
    console.error("addLessonPlanAction error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;

    const store = await cookies();
    store.set("dashboardError", "Failed to add lesson plan.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  }
}

/**
 * 📑 List lesson plans uploaded by current teacher
 */
export async function getTeacherLessonPlansAction(): Promise<LessonPlanData[]> {
  const user = await auth.getUser();
  if (!user) return [];

  try {
    const store = await cookies();
    const sessionCookie = store.get("session")?.value;
    if (!sessionCookie) return [];

    const { databases } = await createSessionClient(sessionCookie);
    const { documents } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.lessonplanCollectionId,
      [
        Query.equal("teacherId", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]
    );

    return documents as unknown as LessonPlanData[];
  } catch (error) {
    console.error("getTeacherLessonPlansAction error:", error);
    return [];
  }
}

/**
 * ✏️ Update lesson plan metadata (not the file itself)
 */
export async function updateLessonPlanAction(
  planDocId: string,
  updates: Partial<LessonPlanData>
) {
  const user = await auth.getUser();
  if (!user) redirect("/login");

  try {
    const store = await cookies();
    const sessionCookie = store.get("session")?.value;
    if (!sessionCookie) redirect("/login");

    const { databases } = await createSessionClient(sessionCookie);

    // Ensure teacher owns this plan
    const existing = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.lessonplanCollectionId,
      planDocId
    );
    if (existing.teacherId !== user.$id) {
      throw new Error("You are not authorized to update this lesson plan.");
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.lessonplanCollectionId,
      planDocId,
      updates
    );

    store.set("dashboardSuccess", "Lesson plan updated successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  } catch (error: any) {
    console.error("updateLessonPlanAction error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;

    const store = await cookies();
    store.set("dashboardError", "Failed to update lesson plan.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  }
}

/**
 * ❌ Delete lesson plan and its file
 */
export async function deleteLessonPlanAction(
  planDocId: string,
  fileId: string
) {
  const user = await auth.getUser();
  if (!user) redirect("/login");

  try {
    const store = await cookies();
    const sessionCookie = store.get("session")?.value;
    if (!sessionCookie) redirect("/login");

    const { databases, storage } = await createSessionClient(sessionCookie);

    // Verify ownership
    const planDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.lessonplanCollectionId,
      planDocId
    );
    if (planDoc.teacherId !== user.$id) {
      throw new Error("You are not authorized to delete this lesson plan.");
    }

    await storage.deleteFile(appwriteConfig.booksBucketId, fileId);
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.lessonplanCollectionId,
      planDocId
    );

    store.set("dashboardSuccess", "Lesson plan deleted successfully!", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  } catch (error: any) {
    console.error("deleteLessonPlanAction error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;

    const store = await cookies();
    store.set("dashboardError", "Failed to delete lesson plan.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/teachers/dashboard");
  }
}

// 1️⃣ Add Lesson Plan (Head of Faculty)
export async function addFacultyLessonPlanAction(formData: FormData) {
  const { databases, storage } = await createAdminClient();

  // Upload file
  const file = formData.get("lessonPlan") as File;
  if (!file) throw new Error("No file uploaded");

  const uploaded = await storage.createFile(
    appwriteConfig.booksBucketId,
    ID.unique(),
    file
  );

  // Save metadata in database
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.lessonplanCollectionId,
    ID.unique(),
    {
      fileId: uploaded.$id,
      fileName: file.name,
      uploaderRole: "faculty", // distinguish who uploaded
      subjectName: formData.get("subjectName") as string,
      topic: formData.get("topic") as string,
      yearGroup: formData.get("yearGroup") as string,
      term: formData.get("term") as string,
      subTerm: formData.get("subTerm") as string,
    },
    [
      Permission.read(Role.any()), // HoF lesson plans visible to all
      Permission.write(Role.team("faculty")), // HoF can edit/delete
    ]
  );

  // revalidatePath("/head-faculty/dashboard");
}

// 2️⃣ List All Lesson Plans (Head of Faculty sees **all**)
export async function getAllLessonPlansAction() {
  const { databases } = await createAdminClient();

  const docs = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.lessonplanCollectionId
  );

  return docs.documents;
}

// 3️⃣ Delete a Lesson Plan
export async function deleteFacultyLessonPlanAction(
  docId: string,
  fileId: string
) {
  const { databases, storage } = await createAdminClient();

  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.lessonplanCollectionId,
    docId
  );

  await storage.deleteFile(appwriteConfig.booksBucketId, fileId);

  // revalidatePath("/head-faculty/dashboard");
}
