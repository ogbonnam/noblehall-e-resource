"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { appwriteConfig } from "@/appwrite/config";

import {
  AssignmentQuestion,
  AssignmentData,
  AssignmentSubmissionData as SubmissionData,
  submitAssignmentAction,
} from "@/app/students/dashboard/actions";

interface StudentAnswer {
  questionIndex: number;
  type: "text" | "image";
  content: string;
  fileName?: string;
  file?: File | null;
  previewUrl?: string | null;
}

interface AssignmentDetailsFormProps {
  assignment: AssignmentData;
  existingSubmission: SubmissionData | null;
}

export default function AssignmentDetailsForm({
  assignment,
  existingSubmission,
}: AssignmentDetailsFormProps) {
  const router = useRouter();
  const { pending } = useFormStatus();

  const [assignmentQuestions, setAssignmentQuestions] = useState<
    AssignmentQuestion[]
  >([]);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [isGraded, setIsGraded] = useState<boolean>(false);

  const createdBlobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let finalParsedQuestions: AssignmentQuestion[] = [];

    function parseQuestions(rawQuestions: any): AssignmentQuestion[] {
      try {
        if (Array.isArray(rawQuestions)) {
          return (rawQuestions as any[]).map((qItem, idx) => {
            if (typeof qItem === "string") {
              const trimmed = qItem.trim();
              if (trimmed === "") {
                return { type: "text", content: "" } as AssignmentQuestion;
              }
              try {
                return JSON.parse(trimmed) as AssignmentQuestion;
              } catch {
                return { type: "text", content: trimmed } as AssignmentQuestion;
              }
            } else if (typeof qItem === "object" && qItem !== null) {
              if ("type" in qItem && "content" in qItem) {
                return qItem as AssignmentQuestion;
              }
              return {
                type: "text",
                content: JSON.stringify(qItem),
              } as AssignmentQuestion;
            } else {
              return {
                type: "text",
                content: String(qItem),
              } as AssignmentQuestion;
            }
          });
        } else if (typeof rawQuestions === "string") {
          const trimmed = rawQuestions.trim();
          if (trimmed === "") return [];
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parseQuestions(parsed);
            if (
              typeof parsed === "object" &&
              parsed !== null &&
              "type" in parsed &&
              "content" in parsed
            ) {
              return [parsed as AssignmentQuestion];
            }
          } catch (e) {
            return [{ type: "text", content: trimmed } as AssignmentQuestion];
          }
        } else if (typeof rawQuestions === "object" && rawQuestions !== null) {
          if ("type" in rawQuestions && "content" in rawQuestions) {
            return [rawQuestions as AssignmentQuestion];
          }
        }
      } catch (e) {
        console.error("parseQuestions error:", e);
      }
      return [];
    }

    try {
      finalParsedQuestions = parseQuestions((assignment as any).questions);
    } catch (e) {
      finalParsedQuestions = [];
      toast.error(
        "Error loading assignment questions. Please check data format."
      );
    }

    setAssignmentQuestions(finalParsedQuestions);

    // Robustly parse existingSubmission.answers into StudentAnswer[]
    const parseExistingAnswers = (
      raw: any,
      questionsCount: number
    ): StudentAnswer[] => {
      let parsedExistingAnswers: any[] = [];

      try {
        if (Array.isArray(raw)) {
          parsedExistingAnswers = raw
            .map((item) => {
              if (typeof item === "string") {
                try {
                  return JSON.parse(item);
                } catch {
                  return null;
                }
              }
              return item;
            })
            .filter(Boolean);
        } else if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsedExistingAnswers = parsed;
            } else if (typeof parsed === "object" && parsed !== null) {
              parsedExistingAnswers = [parsed];
            }
          } catch {
            const parts = raw.split(/},\s*(?=\{)/);
            parsedExistingAnswers = parts
              .map((p) => {
                try {
                  return JSON.parse(p);
                } catch {
                  return null;
                }
              })
              .filter(Boolean);
          }
        } else if (typeof raw === "object" && raw !== null) {
          parsedExistingAnswers = Array.isArray(raw) ? raw : [raw];
        } else {
          parsedExistingAnswers = [];
        }
      } catch (e) {
        console.error("parseExistingAnswers error:", e);
        parsedExistingAnswers = [];
      }

      const normalized: StudentAnswer[] = [];
      for (let i = 0; i < questionsCount; i++) {
        const foundByIndex = parsedExistingAnswers.find(
          (a: any) => a?.questionIndex === i
        );
        const fallbackByPos = parsedExistingAnswers[i];
        const found = foundByIndex ?? fallbackByPos ?? null;

        if (found) {
          const type = found.type === "image" ? "image" : "text";
          const content =
            typeof found.content === "string"
              ? found.content
              : found.content
              ? String(found.content)
              : "";
          const fileName =
            typeof found.fileName === "string"
              ? found.fileName
              : found.fileName ?? "";
          normalized.push({
            questionIndex: i,
            type,
            content,
            fileName,
            previewUrl:
              type === "image" && content ? getAnswerImageUrl(content) : null,
            file: null,
          });
        } else {
          normalized.push({
            questionIndex: i,
            type: finalParsedQuestions[i]?.type ?? "text",
            content: "",
            fileName: "",
            previewUrl: null,
            file: null,
          });
        }
      }

      return normalized;
    };

    if (existingSubmission) {
      try {
        const parsed = parseExistingAnswers(
          (existingSubmission as any).answers,
          finalParsedQuestions.length
        );
        setStudentAnswers(parsed);
        setIsGraded(existingSubmission.grade !== null);
      } catch (e) {
        setStudentAnswers(
          finalParsedQuestions.map((q, index) => ({
            questionIndex: index,
            type: q.type,
            content: "",
            fileName: "",
            file: null,
            previewUrl: null,
          }))
        );
        setIsGraded(false);
        toast.error("Error loading existing answers due to data format.");
      }
    } else {
      setStudentAnswers(
        finalParsedQuestions.map((q, index) => ({
          questionIndex: index,
          type: q.type,
          content: "",
          fileName: "",
          file: null,
          previewUrl: null,
        }))
      );
      setIsGraded(false);
    }

    return () => {
      const urls = createdBlobUrlsRef.current || [];
      urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {}
      });
      createdBlobUrlsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (ans.previewUrl && ans.previewUrl.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(ans.previewUrl);
            } catch {}
            createdBlobUrlsRef.current = createdBlobUrlsRef.current.filter(
              (u) => u !== ans.previewUrl
            );
          }

          const newPreview = file ? URL.createObjectURL(file) : null;
          if (newPreview) createdBlobUrlsRef.current.push(newPreview);

          return {
            ...ans,
            file: file,
            content: file ? file.name : "",
            fileName: file ? file.name : "",
            previewUrl: newPreview,
          };
        }
        return ans;
      })
    );
  };

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isGraded) {
      toast.error(
        "This assignment has already been graded and cannot be re-submitted."
      );
      return;
    }

    const formData = new FormData(event.currentTarget);

    formData.append("assignmentId", assignment.$id);
    formData.append("yearGroup", assignment.yearGroup);
    formData.append("subjectName", assignment.subjectName);

    studentAnswers.forEach((ans, index) => {
      formData.append(`answerType-${index}`, ans.type);
      if (ans.type === "text") {
        formData.append(`answerText-${index}`, ans.content);
      } else if (ans.type === "image" && ans.file) {
        formData.append(`answerImage-${index}`, ans.file);
      } else if (ans.type === "image" && ans.content) {
        formData.append(`answerText-${index}`, ans.content);
        formData.append(`answerFileName-${index}`, ans.fileName || "");
      }
    });

    toast.loading("Submitting assignment...");
    await submitAssignmentAction(formData);
  };

  const getQuestionImageUrl = (fileId: string) => {
    return `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  };

  const getAnswerImageUrl = (fileId: string) => {
    return `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-6xl border border-gray-200">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8 leading-tight">
        {assignment.title}
      </h1>
      <p className="text-md text-gray-600 text-center mb-6">
        {assignment.subjectName} | Year {assignment.yearGroup} |{" "}
        {assignment.term} ({assignment.subTerm})
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
      {existingSubmission && existingSubmission.grade === null && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
          <p className="text-lg font-bold text-yellow-700">
            Status: Submitted, Awaiting Grade
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Submitted on:{" "}
            {new Date(existingSubmission.submittedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmitForm} className="space-y-8">
        {assignmentQuestions.length > 0 ? (
          assignmentQuestions.map((q, index) => {
            const currentAnswer = studentAnswers.find(
              (ans) => ans.questionIndex === index
            );
            return (
              <div
                key={index}
                className="border p-6 rounded-lg bg-gray-50 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Question {index + 1}:
                </h3>
                {q.type === "text" ? (
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {q.content}
                  </p>
                ) : (
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2 font-medium">
                      Image Question:
                    </p>
                    {q.content && (
                      <img
                        src={getQuestionImageUrl(q.content)}
                        alt={`Question ${index + 1}`}
                        className="max-h-80 w-auto rounded-lg shadow-md mb-3 mx-auto"
                      />
                    )}
                    <p className="text-sm text-gray-500 italic">
                      Original file: {q.fileName}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <label
                    htmlFor={`answer-${index}`}
                    className="block text-md font-medium text-gray-700 mb-2"
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
                      rows={6}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="Type your answer here..."
                      required={!isGraded}
                      disabled={isGraded}
                    />
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
                        className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={isGraded}
                      />
                      {currentAnswer?.previewUrl && (
                        <img
                          src={currentAnswer.previewUrl}
                          alt="Your Answer Preview"
                          className="mt-4 max-h-64 w-auto rounded-md shadow-md mx-auto"
                        />
                      )}
                      {!currentAnswer?.previewUrl &&
                        currentAnswer?.type === "image" &&
                        currentAnswer?.content &&
                        !currentAnswer.file && (
                          <img
                            src={getAnswerImageUrl(currentAnswer.content)}
                            alt="Existing Answer"
                            className="mt-4 max-h-64 w-auto rounded-md shadow-md mx-auto"
                          />
                        )}
                      {currentAnswer?.fileName && (
                        <p className="text-sm text-gray-500 italic mt-2">
                          Existing Answer File: {currentAnswer.fileName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-600 text-lg">
            No questions found for this assignment.
          </p>
        )}

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Back to Dashboard
          </button>
          <button
            type="submit"
            disabled={pending || isGraded}
            className={`px-8 py-3 rounded-lg text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-md ${
              pending || isGraded
                ? "opacity-70 cursor-not-allowed"
                : "transform hover:-translate-y-0.5 hover:shadow-lg"
            }`}
          >
            {pending
              ? "Submitting..."
              : isGraded
              ? "Graded"
              : existingSubmission
              ? "Update Submission"
              : "Submit Assignment"}
          </button>
        </div>
      </form>
      <Toaster />
    </div>
  );
}
