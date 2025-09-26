"use client";

import React, { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
// FIX: Import the centralized type definitions from the actions file
import {
  AssignmentQuestion,
  AssignmentData,
  AssignmentSubmissionData as SubmissionData,
} from "@/app/students/dashboard/actions";
import { appwriteConfig } from "@/appwrite/config";

// FIX: Removed duplicate local definitions of AssignmentQuestion, AssignmentData, and SubmissionData
// They are now imported from '@/app/students/dashboard/actions'

interface StudentAnswer {
  questionIndex: number;
  type: "text" | "image";
  content: string; // Text answer or fileId for image answer
  fileName?: string; // Original file name for image answer
  file?: File | null; // FIX: Added null to allow assigning null to 'file'
  previewUrl?: string | null; // FIX: Added null to allow assigning null to 'previewUrl'
}

interface AssignmentSubmissionModalProps {
  // FIX: Use the imported AssignmentData type
  assignment: AssignmentData;
  // FIX: Use the imported SubmissionData type (aliased from AssignmentSubmissionData)
  existingSubmission: SubmissionData | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export default function AssignmentSubmissionModal({
  assignment,
  existingSubmission,
  onClose,
  onSubmit,
}: AssignmentSubmissionModalProps) {
  const { pending } = useFormStatus(); // Tracks form submission status

  // FIX: Use the imported AssignmentQuestion type
  const [assignmentQuestions, setAssignmentQuestions] = useState<
    AssignmentQuestion[]
  >([]);
  // State to hold student's answers for the questions
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);

  useEffect(() => {
    // --- runtime type guards -------------------------------------------------
    function isAssignmentQuestionArray(
      value: any
    ): value is AssignmentQuestion[] {
      if (!Array.isArray(value)) return false;
      return value.every(
        (item) =>
          item != null &&
          (item.type === "text" || item.type === "image") &&
          typeof item.content === "string"
      );
    }

    function isStudentAnswerArray(value: any): value is StudentAnswer[] {
      if (!Array.isArray(value)) return false;
      return value.every((item) => {
        return (
          item != null &&
          typeof item.questionIndex === "number" &&
          (item.type === "text" || item.type === "image") &&
          typeof item.content === "string"
        );
      });
    }
    // ------------------------------------------------------------------------

    try {
      // parse assignment.questions safely (string or array)
      let parsedQuestions: AssignmentQuestion[] = [];

      if (typeof assignment.questions === "string") {
        const maybe = JSON.parse(assignment.questions);
        if (isAssignmentQuestionArray(maybe)) {
          parsedQuestions = maybe;
        } else {
          console.warn(
            "assignment.questions JSON did not match AssignmentQuestion[]",
            maybe
          );
          parsedQuestions = [];
        }
      } else if (isAssignmentQuestionArray(assignment.questions)) {
        parsedQuestions = assignment.questions;
      } else {
        console.warn(
          "assignment.questions is not a string or AssignmentQuestion[]",
          assignment.questions
        );
        parsedQuestions = [];
      }

      setAssignmentQuestions(parsedQuestions);

      // parse existingSubmission.answers safely (string or array)
      if (existingSubmission && existingSubmission.answers) {
        let parsedAnswers: StudentAnswer[] = [];

        if (typeof existingSubmission.answers === "string") {
          const maybe = JSON.parse(existingSubmission.answers);
          if (isStudentAnswerArray(maybe)) {
            parsedAnswers = maybe;
          } else {
            console.warn(
              "existingSubmission.answers JSON did not match StudentAnswer[]",
              maybe
            );
            parsedAnswers = [];
          }
        } else if (isStudentAnswerArray(existingSubmission.answers)) {
          parsedAnswers = existingSubmission.answers;
        } else {
          console.warn(
            "existingSubmission.answers is not a string or StudentAnswer[]",
            existingSubmission.answers
          );
          parsedAnswers = [];
        }

        setStudentAnswers(
          parsedAnswers.map((ans) => ({
            ...ans,
            // we assume server-stored images are referenced by fileId in `content`
            file: null,
            previewUrl:
              ans.type === "image" && ans.content
                ? getAnswerImageUrl(ans.content)
                : null,
          }))
        );
      } else {
        // Initialize empty answers for new submission
        setStudentAnswers(
          parsedQuestions.map((q, index) => ({
            questionIndex: index,
            type: q.type,
            content: "",
            fileName: "",
            file: null,
            previewUrl: null,
          }))
        );
      }
    } catch (e) {
      console.error(
        "Failed to parse assignment questions or existing answers:",
        e
      );
      setAssignmentQuestions([]);
      setStudentAnswers([]);
    }

    // Cleanup object URLs when modal closes
    // NOTE: using `studentAnswers` inside this cleanup captures the current array value at effect setup time.
    // If you create object URLs elsewhere during component lifetime, prefer tracking them in a ref (Set<string>) and revoking from that ref here.
    return () => {
      studentAnswers.forEach((ans) => {
        if (ans.type === "image" && ans.previewUrl) {
          try {
            URL.revokeObjectURL(ans.previewUrl);
          } catch (err) {
            /* ignore */
          }
        }
      });
    };
  }, [assignment, existingSubmission]);

  const handleTextAnswerChange = (index: number, text: string) => {
    setStudentAnswers((prev) =>
      prev.map((ans, i) =>
        i === index && ans.type === "text" ? { ...ans, content: text } : ans
      )
    );
  };

  const handleImageAnswerChange = (index: number, file: File | null) => {
    setStudentAnswers((prev) =>
      prev.map((ans, i) => {
        if (i === index && ans.type === "image") {
          // Revoke old URL if exists
          if (ans.previewUrl) URL.revokeObjectURL(ans.previewUrl);
          return {
            ...ans,
            file: file,
            content: file ? file.name : "", // Store filename temporarily if needed, actual fileId will be on server
            fileName: file ? file.name : "",
            previewUrl: file ? URL.createObjectURL(file) : null,
          };
        }
        return ans;
      })
    );
  };

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(event.currentTarget);

    // Append dynamic answers to FormData
    studentAnswers.forEach((ans, index) => {
      formData.append(`answerType-${index}`, ans.type);
      if (ans.type === "text") {
        formData.append(`answerText-${index}`, ans.content);
      } else if (ans.type === "image" && ans.file) {
        formData.append(`answerImage-${index}`, ans.file);
      }
      // Note: We don't need to append questionIndex to formData directly
      // as server action uses index from iteration.
    });

    await onSubmit(formData); // Call the onSubmit prop (which is a server action)
  };

  const getQuestionImageUrl = (fileId: string) => {
    return `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  };

  const getAnswerImageUrl = (fileId: string) => {
    return `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {assignment.title}
        </h2>
        <p className="text-md text-gray-600 mb-4">
          {assignment.subjectName} | Year {assignment.yearGroup}
        </p>

        {existingSubmission && existingSubmission.grade !== null && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-center">
            <p className="text-lg font-bold text-green-700">
              Your Grade: {existingSubmission.grade}/10
            </p>
            {existingSubmission.gradedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Graded on:{" "}
                {new Date(existingSubmission.gradedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-6">
          {assignmentQuestions.map((q, index) => {
            // FIX: Ensure isGraded is always a boolean
            const isGraded = Boolean(
              existingSubmission && existingSubmission.grade !== null
            );
            const currentAnswer = studentAnswers.find(
              (ans) => ans.questionIndex === index
            );

            return (
              <div
                key={index}
                className="border p-4 rounded-lg bg-gray-50 shadow-sm"
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Question {index + 1}:
                </h4>
                {q.type === "text" ? (
                  <p className="text-gray-700 mb-3">{q.content}</p>
                ) : (
                  <div className="mb-3">
                    <p className="text-gray-700 mb-2">Image Question:</p>
                    {q.content && (
                      <img
                        src={getQuestionImageUrl(q.content)}
                        alt={`Question ${index + 1}`}
                        className="max-h-64 w-auto rounded-md shadow-md mb-3"
                      />
                    )}
                  </div>
                )}

                {/* Student Answer Input */}
                <div className="mt-4">
                  <label
                    htmlFor={`answer-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Answer:
                  </label>
                  {q.type === "text" ? (
                    <textarea
                      id={`answer-${index}`}
                      name={`answerText-${index}`}
                      value={currentAnswer?.content || ""}
                      onChange={(e) =>
                        handleTextAnswerChange(index, e.target.value)
                      }
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your answer here..."
                      required
                      disabled={isGraded} // Disable if graded
                    ></textarea>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id={`answer-${index}`}
                        name={`answerImage-${index}`}
                        accept="image/*"
                        onChange={(e) =>
                          handleImageAnswerChange(
                            index,
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50
                                   file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                                   file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={isGraded} // Disable if graded
                      />
                      {currentAnswer?.previewUrl && (
                        <img
                          src={currentAnswer.previewUrl}
                          alt="Your Answer Preview"
                          className="mt-2 max-h-48 w-auto rounded-md shadow-md"
                        />
                      )}
                      {currentAnswer?.content &&
                        !currentAnswer.previewUrl && ( // Display existing image from DB if no new preview
                          <img
                            src={getAnswerImageUrl(currentAnswer.content)}
                            alt="Existing Answer"
                            className="mt-2 max-h-48 w-auto rounded-md shadow-md"
                          />
                        )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                pending ||
                (existingSubmission ? existingSubmission.grade !== null : false)
              } // Disable if pending or already graded
              className={`px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors
                ${
                  pending ||
                  (existingSubmission && existingSubmission.grade !== null)
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
            >
              {pending
                ? "Submitting..."
                : existingSubmission?.grade !== null
                ? "Graded"
                : existingSubmission
                ? "Re-submit"
                : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
