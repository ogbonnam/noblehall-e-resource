"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addLessonPlanAction,
  getTeacherLessonPlansAction,
  deleteLessonPlanAction,
} from "@/app/teachers/dashboard/actions";
import { createSessionClient } from "@/appwrite/appwriteClient";
import { appwriteConfig } from "@/appwrite/config";

function getFileUrl(fileId: string) {
  const { endpointUrl, projectId, booksBucketId } = appwriteConfig;

  // This is the public preview/download URL format Appwrite exposes
  return `${endpointUrl}/storage/buckets/${booksBucketId}/files/${fileId}/view?project=${projectId}`;
}

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

interface LessonPlanTabContentProps {
  dashboardError?: string;
  dashboardSuccess?: string;
}

export default function AddLessonPlanTabContent({
  dashboardError,
  dashboardSuccess,
}: LessonPlanTabContentProps) {
  const [lessonPlans, setLessonPlans] = useState<LessonPlanData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch teacher's lesson plans
  useEffect(() => {
    async function fetchPlans() {
      const plans = await getTeacherLessonPlansAction();

      // For each plan, resolve its file URL
      const plansWithUrls = await Promise.all(
        plans.map(async (plan) => ({
          ...plan,
          fileUrl: await getFileUrl(plan.fileId),
        }))
      );

      setLessonPlans(plansWithUrls);
      setLoading(false);
    }
    fetchPlans();
  }, []);

  async function handleDelete(docId: string, fileId: string) {
    if (!confirm("Are you sure you want to delete this lesson plan?")) return;
    await deleteLessonPlanAction(docId, fileId);
    setLessonPlans((prev) => prev.filter((plan) => plan.$id !== docId));
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Upload New Lesson Plan</h2>
        <form action={addLessonPlanAction} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Lesson Plan (PDF)
            </label>
            <input
              type="file"
              name="lessonPlan"
              accept="application/pdf"
              required
              className="block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              name="subjectName"
              placeholder="e.g. Mathematics"
              className="block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Year Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Group
            </label>
            <select
              name="yearGroup"
              className="block w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select Year Group</option>
              <option value="Year 7">Year 7</option>
              <option value="Year 8">Year 8</option>
              <option value="Year 9">Year 9</option>
              <option value="Year 10">Year 10</option>
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              name="term"
              className="block w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select Term</option>
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>

          {/* Sub-term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub-term (Optional)
            </label>
            <input
              type="text"
              name="subTerm"
              placeholder="e.g. Week 1, Week 2..."
              className="block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <SubmitButton />
        </form>
      </div>

      {/* Lesson Plans List */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Your Lesson Plans</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : lessonPlans.length === 0 ? (
          <p className="text-gray-500">No lesson plans uploaded yet.</p>
        ) : (
          <ul className="divide-y">
            {lessonPlans.map((plan) => {
              return (
                <li
                  key={plan.$id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-2"
                >
                  <div>
                    <a
                      href={getFileUrl(plan.fileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {plan.fileName}
                    </a>
                    <div className="text-sm text-gray-500">
                      {plan.subjectName && <span>{plan.subjectName} • </span>}
                      {plan.topic && <span>{plan.topic} • </span>}
                      {plan.yearGroup && <span>{plan.yearGroup} • </span>}
                      {plan.term && <span>{plan.term}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan.$id, plan.fileId)}
                    className="text-red-600 hover:underline text-sm mt-2 sm:mt-0"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
    >
      {pending ? "Uploading..." : "Upload Lesson Plan"}
    </button>
  );
}
