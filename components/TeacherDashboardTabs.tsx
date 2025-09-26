"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

import AddBookForm from "@/components/AddBookForm";
import AddAssignmentForm from "@/components/AddAssignmentForm"; // Using the new AddAssignmentForm
import AddHomeworkTabContent from "@/components/AddHomeworkTabContent";
import ManageBooksTabContent from "@/components/ManageBooksTabContent";

import {
  addBookAction,
  deleteBookAction,
  updateBookAction,
  createAssignmentAction,
} from "@/app/teachers/dashboard/actions"; // Import all relevant server actions
import { logoutAction } from "@/app/logout/actions";
import LessonPlanTabContent from "./LessonPlanTabContent";
import ViewAssignments from "./ViewAssignments";

// Define the type for a book item, matching the server action's BookData
interface BookItem {
  $id: string;
  fileId: string;
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

interface TeacherDashboardTabsProps {
  dashboardError?: string;
  dashboardSuccess?: string;
  initialBooks: BookItem[]; // Prop for initial books data
}

export default function TeacherDashboardTabs({
  dashboardError,
  dashboardSuccess,
  initialBooks,
}: TeacherDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("add-book");

  // Handle toast messages passed from the server component
  useEffect(() => {
    if (dashboardError) {
      toast.error(dashboardError);
      document.cookie = `dashboardError=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    if (dashboardSuccess) {
      toast.success(dashboardSuccess);
      document.cookie = `dashboardSuccess=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }, [dashboardError, dashboardSuccess]);

  const renderContent = () => {
    switch (activeTab) {
      case "add-book":
        return (
          <AddBookForm
            addBookAction={addBookAction}
            dashboardError={dashboardError}
            dashboardSuccess={dashboardSuccess}
          />
        );
      case "manage-books":
        return (
          <ManageBooksTabContent
            initialBooks={initialBooks}
            deleteBookAction={deleteBookAction}
            updateBookAction={updateBookAction}
            dashboardError={dashboardError}
            dashboardSuccess={dashboardSuccess}
          />
        );
      case "add-assignment": // Use the new AddAssignmentForm
        return (
          <AddAssignmentForm
            createAssignmentAction={createAssignmentAction} // Pass the new server action
            dashboardError={dashboardError}
            dashboardSuccess={dashboardSuccess}
          />
        );
      case "view-assignments":
        return (
          // <LessonPlanTabContent
          //   dashboardError={dashboardError}
          //   dashboardSuccess={dashboardSuccess}
          // />
          <ViewAssignments />
        );
      case "add-lesson-plan":
        return (
          <LessonPlanTabContent
            dashboardError={dashboardError}
            dashboardSuccess={dashboardSuccess}
          />
        );
      default:
        return (
          <AddBookForm
            addBookAction={addBookAction}
            dashboardError={dashboardError}
            dashboardSuccess={dashboardSuccess}
          />
        );
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-6xl border border-gray-200">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8 leading-tight">
        Teacher Dashboard
      </h1>

      {/* Tabs Navigation */}
      <div className="flex justify-center border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200
            ${
              activeTab === "add-book"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("add-book")}
        >
          Add Book
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200
            ${
              activeTab === "manage-books"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("manage-books")}
        >
          Manage Books
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200
            ${
              activeTab === "add-assignment"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("add-assignment")}
        >
          Add Assignment
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200
            ${
              activeTab === "view-assignments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("view-assignments")}
        >
          View Assignments
        </button>
        <button
          className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200
            ${
              activeTab === "add-lesson-plan"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("add-lesson-plan")}
        >
          Add Lesson Plan
        </button>
      </div>

      {/* Tab Content */}
      {renderContent()}

      {/* Logout Button */}
      <div className="mt-10 text-center">
        <form action={logoutAction}>
          <button
            type="submit"
            className="px-6 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
