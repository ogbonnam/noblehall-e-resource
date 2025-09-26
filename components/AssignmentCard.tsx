"use client";

import React from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import Link from "next/link"; // Import Link for navigation
// Removed appwriteConfig import as getQuestionImageUrl is no longer used here
import {
  AssignmentData,
  AssignmentSubmissionData,
} from "@/app/students/dashboard/actions";

interface AssignmentCardProps {
  assignment: AssignmentData; // Using the imported AssignmentData
  existingSubmission: AssignmentSubmissionData | null; // Student's existing submission for this assignment
  href: string; // NEW: The URL to navigate to when the card is clicked
}

export default function AssignmentCard({
  assignment,
  existingSubmission,
  href,
}: AssignmentCardProps) {
  const getTimeAgo = (isoString: string) => {
    if (!isoString) return "N/A";
    try {
      return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    // Wrap the entire card in a Link component for navigability
    <Link
      href={href}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 flex flex-col justify-between
                 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 ease-in-out"
    >
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {assignment.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold">{assignment.subjectName}</span> | Year{" "}
          {assignment.yearGroup} | {assignment.term} ({assignment.subTerm})
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Assigned {getTimeAgo(assignment.createdAt)}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
        {existingSubmission ? (
          <div className="flex flex-col items-start">
            <span
              className={`text-sm font-semibold ${
                existingSubmission.grade !== null
                  ? "text-green-600"
                  : "text-orange-500"
              }`}
            >
              Status:{" "}
              {existingSubmission.grade !== null
                ? `Graded (${existingSubmission.grade}/10)`
                : "Submitted"}
            </span>
            {/* <span className="text-xs text-gray-500 mt-1">
              {existingSubmission.grade !== null
                ? `Graded ${getTimeAgo(existingSubmission.gradedAt || "")}`
                : `Submitted ${getTimeAgo(existingSubmission.submittedAt)}`}
            </span> */}
          </div>
        ) : (
          <span className="text-sm font-semibold text-red-500">
            Status: Not Submitted
          </span>
        )}

        {/* This button will now also trigger navigation by being inside the Link */}
        <button
          type="button" // Important: set type to button to prevent form submission if Link wraps a form
          className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors
            ${
              existingSubmission?.grade !== null
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                : existingSubmission
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {existingSubmission?.grade !== null
            ? ""
            : existingSubmission
            ? "View/Re-submit"
            : "Start Assignment"}
        </button>
      </div>
    </Link>
  );
}
