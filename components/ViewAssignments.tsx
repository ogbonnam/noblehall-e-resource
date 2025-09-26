"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getAssignmentsForTeacherAction,
  AssignmentData,
  SubmissionWithStudentName,
  AssignmentSubmissionData,
  getSubmissionsByTitleTerm,
} from "@/app/teachers/dashboard/actions";

interface AssignmentWithSubmissions extends AssignmentData {
  submissions: SubmissionWithStudentName[];
}

export default function ViewAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithSubmissions[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const [selectedAssignment, setSelectedAssignment] = useState<{
    title: string;
    term: string;
    subTerm: string;
    submissions: SubmissionWithStudentName[];
    message?: string;
  } | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAssignmentsForTeacherAction();
        setAssignments(
          data.map((assignment) => ({
            ...assignment,
            submissions: assignment.submissions.map((sub) => ({
              ...sub,
              studentName: sub.studentName ?? "",
              grade: sub.grade !== undefined ? sub.grade : null,
            })),
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch assignments");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const openAssignmentModal = async (
    title: string,
    term: string,
    subTerm: string
  ) => {
    try {
      const result = await getSubmissionsByTitleTerm(title, term, subTerm);
      setSelectedAssignment(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assignment submissions");
    }
  };

  const closeModal = () => setSelectedAssignment(null);

  const handleGradeChange = (index: number, points: number) => {
    if (!selectedAssignment) return;
    const newSubmissions = [...selectedAssignment.submissions];
    newSubmissions[index].grade = points;
    setSelectedAssignment({
      ...selectedAssignment,
      submissions: newSubmissions,
    });
  };

  const saveGrades = async () => {
    if (!selectedAssignment) return;
    try {
      for (const sub of selectedAssignment.submissions) {
        await fetch(`/api/save-grade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: sub.$id, grade: sub.grade }),
        });
      }
      toast.success("Grades saved successfully");
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save grades");
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (assignments.length === 0)
    return <p className="text-center text-gray-500">No assignments found</p>;

  return (
    <div className="p-4">
      <table className="min-w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">#</th>
            <th className="px-4 py-2 border">Title</th>
            <th className="px-4 py-2 border">Term</th>
            <th className="px-4 py-2 border">SubTerm</th>
            <th className="px-4 py-2 border">Submissions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, i) => (
            <tr key={a.$id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border text-center">{i + 1}</td>
              <td
                className="px-4 py-2 border text-blue-600 cursor-pointer hover:underline"
                onClick={() => openAssignmentModal(a.title, a.term, a.subTerm)}
              >
                {a.title}
              </td>
              <td className="px-4 py-2 border">{a.term}</td>
              <td className="px-4 py-2 border">{a.subTerm}</td>
              <td className="px-4 py-2 border text-center">
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm">
                  {a.submissions.length}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 md:w-2/3 max-h-[80vh] overflow-y-auto rounded-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              {selectedAssignment.title}
            </h2>
            {selectedAssignment.message && (
              <p className="mb-4">{selectedAssignment.message}</p>
            )}

            {selectedAssignment.submissions.length > 0 && (
              <>
                <table className="min-w-full border border-gray-200 rounded-lg mb-4">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Student Name</th>
                      <th className="px-4 py-2 border">Submitted At</th>
                      <th className="px-4 py-2 border">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAssignment.submissions.map((s, idx) => (
                      <tr key={s.$id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border text-center">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 border">
                          <a href={`/teachers/dashboard/submission/${s.$id}`}>
                            {s.studentName}
                          </a>
                        </td>
                        <td className="px-4 py-2 border">
                          {new Date(s.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          <input
                            type="number"
                            className="w-16 border rounded px-1"
                            value={s.grade ?? 0}
                            onChange={(e) =>
                              handleGradeChange(idx, Number(e.target.value))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={saveGrades}
                >
                  Save Grades
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
