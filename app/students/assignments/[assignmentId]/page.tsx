// import { notFound, redirect } from "next/navigation";
// import auth from "@/auth";
// import {
//   getAssignmentsForStudentAction,
//   AssignmentData,
// } from "@/app/students/dashboard/actions"; // Import the action
// import AssignmentDetailsForm from "@/components/AssignmentDetailsForm"; // Import the new client component
// import { createSessionClient } from "@/appwrite/appwriteClient"; // Import necessary Appwrite client setup
// import { Query } from "node-appwrite"; // Import Query for database queries
// import { appwriteConfig } from "@/appwrite/config";
// import { cookies } from "next/headers";

// interface AssignmentPageProps {
//   params: {
//     assignmentId: string; // The assignment ID from the URL
//   };
// }

// export default async function AssignmentPage({ params }: AssignmentPageProps) {
//   const { assignmentId } = params;
//   const user = await auth.getUser();

//   if (!user) {
//     // If not logged in, redirect to login page
//     redirect("/login");
//   }

//   let assignment: AssignmentData | null = null;
//   let studentYearGroup: string | undefined;

//   try {
//     const cookiesStore = await cookies();
//     const sessionCookie = cookiesStore.get("session")?.value;

//     if (!sessionCookie) {
//       console.error(
//         "Session cookie not found when trying to fetch user profile in AssignmentPage."
//       );
//       redirect("/login"); // If session cookie is missing here, user is truly not authenticated
//       return null;
//     }

//     const { databases } = await createSessionClient(sessionCookie);

//     // Fetch the user's profile to get their yearGroup
//     const { documents: userProfiles } = await databases.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.usersCollectionId,
//       [Query.equal("userId", user.$id)]
//     );

//     if (userProfiles.length > 0) {
//       studentYearGroup = userProfiles[0].yearGroup;
//     }

//     if (!studentYearGroup) {
//       console.warn(
//         `User ${user.$id} does not have a year group defined in their profile.`
//       );
//       // Redirect to complete profile if year group is missing for a student
//       redirect(
//         "/complete-profile?profileError=Please complete your profile to view assignments."
//       );
//     }

//     // Fetch all assignments for the student's year group, and each returned assignment object includes its submission status.
//     // We then filter this list to find the specific assignment by ID.
//     const allStudentAssignments = await getAssignmentsForStudentAction(
//       studentYearGroup,
//       user.$id
//     );

//     assignment =
//       allStudentAssignments.find((a) => a.$id === assignmentId) || null;

//     if (!assignment) {
//       notFound(); // Show a 404 page if the assignment isn't found for this student
//     }
//   } catch (error) {
//     console.error("Error fetching assignment details for page:", error);
//     // Optionally redirect to a generic error page or dashboard with an error message
//     redirect(
//       "/students/dashboard?dashboardError=Failed to load assignment details."
//     );
//   }

//   if (!assignment) {
//     // This should ideally be caught by notFound() above, but as a safeguard
//     notFound();
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 font-inter flex flex-col items-center py-10 px-4">
//       <AssignmentDetailsForm
//         assignment={assignment}
//         existingSubmission={assignment.submission} // Pass the already fetched submission
//       />
//     </div>
//   );
// }

// app/students/assignments/[assignmentId]/page.tsx
import { notFound, redirect } from "next/navigation";
import auth from "@/auth";
import {
  getAssignmentsForStudentAction,
  AssignmentData,
} from "@/app/students/dashboard/actions";
import AssignmentDetailsForm from "@/components/AssignmentDetailsForm";
import { createSessionClient } from "@/appwrite/appwriteClient";
import { Query } from "node-appwrite";
import { appwriteConfig } from "@/appwrite/config";
import { cookies } from "next/headers";

export default async function AssignmentPage(props: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await props.params;

  const user = await auth.getUser();
  if (!user) {
    redirect("/login");
  }

  let assignment: AssignmentData | null = null;
  let studentYearGroup: string | undefined;

  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    if (!sessionCookie) {
      redirect("/login");
      return null;
    }

    const { databases } = await createSessionClient(sessionCookie);

    const { documents: userProfiles } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("userId", user.$id)]
    );

    if (userProfiles.length > 0) {
      studentYearGroup = userProfiles[0].yearGroup;
    }

    if (!studentYearGroup) {
      redirect(
        "/complete-profile?profileError=Please complete your profile to view assignments."
      );
    }

    const allStudentAssignments = await getAssignmentsForStudentAction(
      studentYearGroup!,
      user.$id
    );

    assignment =
      allStudentAssignments.find((a) => a.$id === assignmentId) || null;

    if (!assignment) {
      notFound();
    }
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    redirect(
      "/students/dashboard?dashboardError=Failed to load assignment details."
    );
  }

  if (!assignment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 font-inter flex flex-col items-center py-10 px-4">
      <AssignmentDetailsForm
        assignment={assignment}
        existingSubmission={assignment.submission}
      />
    </div>
  );
}

