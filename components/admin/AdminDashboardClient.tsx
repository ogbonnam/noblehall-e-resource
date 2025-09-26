"use client";

import React, { useState } from "react";
import BookList from "./BookList";
import AddBookForm from "./AddBookForm";
import ManageUsers from "./ManageUsers";
import DownloadBooks from "./DownloadBooks";
import Modal from "./Modal"; // Import the Modal component

interface AdminDashboardClientProps {
  initialStats: {
    totalBooks: number;
    totalStudents: number;
    totalTeachers: number;
  };
}

export default function AdminDashboardClient({
  initialStats,
}: AdminDashboardClientProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-gray-700">
                Total Books
              </h3>
              <p className="text-5xl font-bold text-indigo-600 mt-2">
                {initialStats.totalBooks}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-gray-700">
                Total Students
              </h3>
              <p className="text-5xl font-bold text-green-600 mt-2">
                {initialStats.totalStudents}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-gray-700">
                Total Teachers
              </h3>
              <p className="text-5xl font-bold text-purple-600 mt-2">
                {initialStats.totalTeachers}
              </p>
            </div>
            {/* Add more dashboard stats here */}
          </div>
        );
      case "view-books":
        return <BookList showModal={showModal} />;
      case "add-book":
        return <AddBookForm showModal={showModal} />;
      case "manage-users":
        return <ManageUsers showModal={showModal} />;
      case "download-books":
        return <DownloadBooks showModal={showModal} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col shadow-lg">
        <h2 className="text-3xl font-bold mb-8 text-center text-indigo-300">
          Admin Panel
        </h2>
        <nav className="flex-1">
          <ul>
            <li className="mb-4">
              <button
                onClick={() => setActiveSection("dashboard")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === "dashboard"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                Dashboard Overview
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveSection("view-books")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === "view-books"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                View All Books
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveSection("add-book")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === "add-book"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                Add New Book
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveSection("manage-users")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === "manage-users"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                Manage Users
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => setActiveSection("download-books")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === "download-books"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                Download All Books
              </button>
            </li>
          </ul>
        </nav>
        <div className="mt-auto text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Admin Panel
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-gray-100 overflow-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-4 border-b-4 border-indigo-500">
          {activeSection === "dashboard" && "Admin Dashboard Overview"}
          {activeSection === "view-books" && "View All Books"}
          {activeSection === "add-book" && "Add New Book"}
          {activeSection === "manage-users" && "Manage User Accounts"}
          {activeSection === "download-books" && "Download All Books"}
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-xl min-h-[70vh]">
          {renderSection()}
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalContent.title}
      >
        <p className="text-gray-700">{modalContent.message}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
