"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { appwriteConfig } from "@/appwrite/config";

// Define the type for a book item, matching the server action's BookData
interface BookItem {
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

interface ManageBooksTabContentProps {
  initialBooks: BookItem[];
  deleteBookAction: (bookDocId: string, fileId: string) => Promise<void>;
  updateBookAction: (formData: FormData) => Promise<void>; // Prop for update action
  dashboardError?: string;
  dashboardSuccess?: string;
}

const subjectsList = [
  "All",
  "Chemistry",
  "Physics",
  "Mathematics",
  "English",
  "Geography",
  "Economics",
  "Arts",
  "Civic Education",
  "Biology",
];
const yearGroups = [
  "All",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
];
const terms = ["All", "Autumn", "Spring", "Summer"];
const subTermsOptions: { [key: string]: string[] } = {
  All: ["All"],
  Autumn: ["All", "Autumn Mid Term", "Autumn Full Term"],
  Spring: ["All", "Spring Mid Term", "Spring Full Term"],
  Summer: ["All", "Summer Mid Term", "Summer Full Term"],
};

export default function ManageBooksTabContent({
  initialBooks,
  deleteBookAction,
  updateBookAction, // Destructure update action
  dashboardError,
  dashboardSuccess,
}: ManageBooksTabContentProps) {
  const [books, setBooks] = useState<BookItem[]>(initialBooks);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [filterYearGroup, setFilterYearGroup] = useState<string>("All");
  const [filterTerm, setFilterTerm] = useState<string>("All");
  const [filterSubTerm, setFilterSubTerm] = useState<string>("All");

  // State for edit modal/form
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Update books state if initialBooks prop changes (e.g., after a server action redirect)
  useEffect(() => {
    setBooks(initialBooks);
  }, [initialBooks]);

  // Handle toast messages from server actions
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

  // Filtered books based on search and filters
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Filter by topic search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (book) =>
          book.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (filterSubject !== "All") {
      filtered = filtered.filter((book) => book.subjectName === filterSubject);
    }

    // Filter by year group
    if (filterYearGroup !== "All") {
      filtered = filtered.filter((book) => book.yearGroup === filterYearGroup);
    }

    // Filter by term
    if (filterTerm !== "All") {
      filtered = filtered.filter((book) => book.term === filterTerm);
    }

    // Filter by sub-term
    if (filterSubTerm !== "All") {
      filtered = filtered.filter((book) => book.subTerm === filterSubTerm);
    }

    return filtered;
  }, [
    books,
    searchTerm,
    filterSubject,
    filterYearGroup,
    filterTerm,
    filterSubTerm,
  ]);

  const handleDelete = async (bookId: string, fileId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this book? This action cannot be undone."
      )
    ) {
      try {
        await deleteBookAction(bookId, fileId);
        // The page will redirect/refresh due to the server action, re-fetching books,
        // so no need to update client state here manually for deletion.
      } catch (error) {
        console.error("Client-side delete error:", error);
        // Error toast will be handled by the page's cookies and useEffect
      }
    }
  };

  const handleEditClick = (book: BookItem) => {
    setEditingBook(book);
    setIsEditModalOpen(true);
  };

  const handleUpdateBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission for the modal form
    if (!editingBook) return;

    const formData = new FormData(e.currentTarget);
    formData.append("bookDocId", editingBook.$id); // Pass the document ID

    try {
      await updateBookAction(formData);
      setIsEditModalOpen(false); // Close modal on success
      setEditingBook(null);
      // The page will redirect/refresh due to the server action, re-fetching books,
      // so no need to update client state here manually for update.
    } catch (error) {
      console.error("Client-side update error:", error);
      // Error toast will be handled by the page's cookies and useEffect
    }
  };

  const getFileDownloadUrl = (fileId: string) => {
    return `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-inner mt-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Manage My Books
      </h3>

      {/* Search and Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Search by Topic/Filename */}
        <div>
          <label
            htmlFor="searchTerm"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search Topic/Filename
          </label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Photosynthesis"
          />
        </div>

        {/* Filter by Subject */}
        <div>
          <label
            htmlFor="filterSubject"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Subject
          </label>
          <select
            id="filterSubject"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {subjectsList.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Year Group */}
        <div>
          <label
            htmlFor="filterYearGroup"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Year Group
          </label>
          <select
            id="filterYearGroup"
            value={filterYearGroup}
            onChange={(e) => setFilterYearGroup(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {yearGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Term */}
        <div>
          <label
            htmlFor="filterTerm"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Term
          </label>
          <select
            id="filterTerm"
            value={filterTerm}
            onChange={(e) => {
              setFilterTerm(e.target.value);
              setFilterSubTerm("All"); // Reset sub-term when term changes
            }}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Sub-Term */}
        <div>
          <label
            htmlFor="filterSubTerm"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sub-Term
          </label>
          <select
            id="filterSubTerm"
            value={filterSubTerm}
            onChange={(e) => setFilterSubTerm(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {subTermsOptions[filterTerm]?.map(
              (
                st // Dynamically show sub-terms based on selected term
              ) => (
                <option key={st} value={st}>
                  {st}
                </option>
              )
            ) || <option value="All">All</option>}
          </select>
        </div>
      </div>

      {/* Books Table */}
      {filteredBooks.length > 0 ? (
        <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cover
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Topic
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Subject
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Year Group
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Term
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Sub-Term
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  File
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <tr key={book.$id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: book.coverColor }}
                    ></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {book.topic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {book.subjectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {book.yearGroup}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {book.term}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {book.subTerm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                    <a
                      href={getFileDownloadUrl(book.fileId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {book.fileName}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(book)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors duration-150"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(book.$id, book.fileId)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-150"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 mt-8">
          No books found matching your criteria.
        </p>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingBook && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Book: {editingBook.topic}
            </h3>
            <form onSubmit={handleUpdateBook} className="space-y-4">
              <input type="hidden" name="bookDocId" value={editingBook.$id} />{" "}
              {/* Hidden field for ID */}
              {/* Subject Name */}
              <div>
                <label
                  htmlFor="editSubjectName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject Name
                </label>
                <select
                  id="editSubjectName"
                  name="subjectName"
                  defaultValue={editingBook.subjectName}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {subjectsList.slice(1).map(
                    (
                      subject // Exclude "All" from edit options
                    ) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    )
                  )}
                </select>
              </div>
              {/* Topic */}
              <div>
                <label
                  htmlFor="editTopic"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Topic
                </label>
                <input
                  type="text"
                  id="editTopic"
                  name="topic"
                  defaultValue={editingBook.topic}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Year Group */}
              <div>
                <label
                  htmlFor="editYearGroup"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Year Group
                </label>
                <select
                  id="editYearGroup"
                  name="yearGroup"
                  defaultValue={editingBook.yearGroup}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearGroups.slice(1).map(
                    (
                      group // Exclude "All"
                    ) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    )
                  )}
                </select>
              </div>
              {/* Term */}
              <div>
                <label
                  htmlFor="editTerm"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Term
                </label>
                <select
                  id="editTerm"
                  name="term"
                  defaultValue={editingBook.term}
                  required
                  onChange={(e) => {
                    const newTerm = e.target.value;
                    setEditingBook((prev) =>
                      prev
                        ? {
                            ...prev,
                            term: newTerm,
                            subTerm: subTermsOptions[newTerm]?.[1] || "All",
                          }
                        : null
                    );
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {terms.slice(1).map(
                    (
                      t // Exclude "All"
                    ) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>
              {/* Sub-Term */}
              <div>
                <label
                  htmlFor="editSubTerm"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sub-Term
                </label>
                <select
                  id="editSubTerm"
                  name="subTerm"
                  value={editingBook.subTerm} // Use value to control, will be updated by term change if needed
                  required
                  onChange={(e) =>
                    setEditingBook((prev) =>
                      prev ? { ...prev, subTerm: e.target.value } : null
                    )
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {subTermsOptions[editingBook.term]?.slice(1).map(
                    (
                      st // Dynamically show sub-terms
                    ) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    )
                  ) || <option value="">Select Sub-Term</option>}
                </select>
              </div>
              {/* Cover Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book Cover Color
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <input
                    type="color"
                    name="coverColor"
                    defaultValue={editingBook.coverColor}
                    className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer"
                    onChange={(e) =>
                      setEditingBook((prev) =>
                        prev ? { ...prev, coverColor: e.target.value } : null
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
