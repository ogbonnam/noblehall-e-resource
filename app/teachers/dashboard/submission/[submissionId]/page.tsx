// app/teachers/dashboard/submission/[submissionId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { getSubmissionById } from "@/app/teachers/dashboard/actions";
import { saveGradeAction } from "@/app/teachers/dashboard/actions";

interface QuestionAnswer {
  content: string;
}

interface SubmissionDetail {
  $id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  title: string;
  term: string;
  subTerm: string;
  questions: QuestionAnswer[];
  answers: QuestionAnswer[];
  grade?: number | null;
}

export default function SubmissionPage() {
  const params = useParams();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<number>(0);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const submissionId = Array.isArray(params.submissionId)
          ? params.submissionId[0]
          : params.submissionId;

        if (!submissionId) {
          toast.error("Invalid submission ID");
          return;
        }

        const data = (await getSubmissionById(
          submissionId
        )) as SubmissionDetail;
        setSubmission(data);
        setGrade(data.grade ?? 0);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load submission");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [params.submissionId]);

  const handleSaveGrade = async () => {
    if (!submission) return;

    try {
      await saveGradeAction(submission.$id, grade);
      toast.success("Grade saved successfully");
      setSubmission({ ...submission, grade });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save grade");
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!submission)
    return <p className="text-center text-gray-500">Submission not found</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{submission.title}</h1>
      <p className="mb-4 text-gray-600">
        Term: {submission.term} | SubTerm: {submission.subTerm}
      </p>
      <p className="mb-4 text-gray-600">Student: {submission.studentName}</p>

      <table className="min-w-full border border-gray-200 rounded-lg mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">#</th>
            <th className="px-4 py-2 border">Question</th>
            <th className="px-4 py-2 border">Answer</th>
          </tr>
        </thead>
        <tbody>
          {submission.questions.map((q, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-2 border text-center">{idx + 1}</td>
              <td className="px-4 py-2 border">{q.content}</td>
              <td className="px-4 py-2 border">
                {submission.answers[idx]?.content || "No answer"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="grade" className="font-medium">
          Grade:
        </label>
        <input
          id="grade"
          type="number"
          className="w-20 border rounded px-2 py-1"
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
        />
        <button
          onClick={handleSaveGrade}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save Grade
        </button>
      </div>
    </div>
  );
}
