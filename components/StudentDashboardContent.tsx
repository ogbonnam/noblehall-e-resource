// components/StudentDashboardContent.tsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { logoutAction } from "@/app/logout/actions";
import { useRouter } from "next/navigation";
import { appwriteConfig } from "@/appwrite/config";

// Import the new server action
import { getBookDownloadUrl } from "@/app/students/dashboard/actions";
// Import AssignmentCard
import AssignmentCard from "@/components/AssignmentCard";
// Import the centralized type definitions from the actions file
import { AssignmentData } from "@/app/students/dashboard/actions";

// Define types for data structures (matching Appwrite documents and actions)
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

interface StudentDashboardContentProps {
  initialBooks: BookItem[];
  initialAssignments: AssignmentData[];
  studentYearGroup: string;
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
const terms = ["All", "Autumn", "Spring", "Summer"];
const subTermsOptions: { [key: string]: string[] } = {
  All: ["All"],
  Autumn: ["All", "Autumn Mid Term", "Autumn Full Term"],
  Spring: ["All", "Spring Mid Term", "Spring Full Term"],
  Summer: ["All", "Summer Mid Term", "Summer Full Term"],
};

// Use a specific name for our cache
const OFFLINE_CACHE_NAME = "appwrite-books-v1";
// Define a key for localStorage
const OFFLINE_BOOKS_STORAGE_KEY = "offlineAvailableBookIds";

export default function StudentDashboardContent({
  initialBooks,
  initialAssignments,
  studentYearGroup,
  dashboardError,
  dashboardSuccess,
}: StudentDashboardContentProps) {
  const [books, setBooks] = useState<BookItem[]>(initialBooks);
  const [assignments, setAssignments] =
    useState<AssignmentData[]>(initialAssignments);
  const [activeTab, setActiveTab] = useState<"books" | "assignments">("books");

  // Common filter states for both books and assignments
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [filterTerm, setFilterTerm] = useState<string>("All");
  const [filterSubTerm, setFilterSubTerm] = useState<string>("All");

  // States for PDF viewing (books)
  const [offlineMarkedBookIds, setOfflineMarkedBookIds] = useState<Set<string>>(
    new Set()
  );
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Router for navigation
  const router = useRouter();

  // Initialize offlineMarkedBookIds from localStorage on mount
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem(OFFLINE_BOOKS_STORAGE_KEY);
      if (storedIds) {
        setOfflineMarkedBookIds(new Set(JSON.parse(storedIds)));
      }
    } catch (e) {
      console.error("Failed to read offline book IDs from localStorage", e);
    }
  }, []);

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

  // Update books/assignments state if initial props change
  useEffect(() => {
    setBooks(initialBooks);
  }, [initialBooks]);

  useEffect(() => {
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  // Filtered books based on search and filters
  const filteredBooks = useMemo(() => {
    let filtered = books;
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (book) =>
          book.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterSubject !== "All") {
      filtered = filtered.filter((book) => book.subjectName === filterSubject);
    }
    if (filterTerm !== "All") {
      filtered = filtered.filter((book) => book.term === filterTerm);
    }
    if (filterSubTerm !== "All") {
      filtered = filtered.filter((book) => book.subTerm === filterSubTerm);
    }
    return filtered;
  }, [books, searchTerm, filterSubject, filterTerm, filterSubTerm]);

  // Filtered assignments based on search and filters
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.subjectName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }
    if (filterSubject !== "All") {
      filtered = filtered.filter(
        (assignment) => assignment.subjectName === filterSubject
      );
    }
    if (filterTerm !== "All") {
      filtered = filtered.filter(
        (assignment) => assignment.term === filterTerm
      );
    }
    if (filterSubTerm !== "All") {
      filtered = filtered.filter(
        (assignment) => assignment.subTerm === filterSubTerm
      );
    }
    return filtered;
  }, [assignments, searchTerm, filterSubject, filterTerm, filterSubTerm]);

  // Secure function to get the online book URL and open it
  const handleBookClick = async (fileId: string) => {
    toast.loading("Getting book URL...", { id: "viewOnline" });
    try {
      const url = await getBookDownloadUrl(fileId);
      toast.dismiss("viewOnline");

      if (url) {
        window.open(url, "_blank");
        toast.success("Opening book in new tab!");
      } else {
        toast.error("Failed to get book URL. Please try again.");
      }
    } catch (err) {
      toast.dismiss("viewOnline");
      console.error("Error generating book URL:", err);
      toast.error("An error occurred. Please try again.");
    }
  };

  // Function to handle offline download and viewing
  const handleDownloadForOffline = async (book: BookItem) => {
    // Check if the book is already in our offline set
    if (offlineMarkedBookIds.has(book.$id)) {
      // It's already downloaded, so just view it
      handleViewOfflineBook(book);
      return;
    }

    toast.loading(`Downloading '${book.topic}' for offline viewing...`, {
      id: "downloadToast",
    });

    try {
      // Fetch the file from Appwrite
      const response = await fetch(
        `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.booksBucketId}/files/${book.fileId}/view?project=${appwriteConfig.projectId}`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      // Open the cache and store the response
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      await cache.put(
        `/offline-books/${book.fileId}`, // Use a unique path as key
        response
      );

      // Update local storage and state to reflect the download
      const newMarkedIds = new Set(offlineMarkedBookIds).add(book.$id);
      setOfflineMarkedBookIds(newMarkedIds);
      localStorage.setItem(
        OFFLINE_BOOKS_STORAGE_KEY,
        JSON.stringify(Array.from(newMarkedIds))
      );

      toast.dismiss("downloadToast");
      toast.success(`'${book.topic}' is now available offline!`, {
        duration: 3000,
      });

      // Immediately view the downloaded book
      handleViewOfflineBook(book);
    } catch (error) {
      toast.dismiss("downloadToast");
      console.error("Error downloading for offline:", error);
      toast.error("Failed to download book for offline viewing.");
    }
  };

  // Function to load from cache and view
  const handleViewOfflineBook = async (book: BookItem) => {
    toast.loading("Loading book for viewing from local cache...", {
      id: "viewToast",
    });
    try {
      // Check if we have the book in the cache
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      const cachedResponse = await cache.match(`/offline-books/${book.fileId}`);

      if (!cachedResponse) {
        toast.dismiss("viewToast");
        toast.error("Book not found in offline cache. Please re-download it.");
        return;
      }

      const blob = await cachedResponse.blob();
      const url = URL.createObjectURL(blob);
      setViewingPdfUrl(url);

      toast.dismiss("viewToast");
      toast.success("Book loaded from cache!", { duration: 1500 });
    } catch (error) {
      toast.dismiss("viewToast");
      console.error("Error loading book for offline viewing:", error);
      toast.error("Could not load book from cache. Please try again.");
    }
  };

  // Function to remove from cache and offline list
  const handleRemoveFromOffline = async (book: BookItem) => {
    toast.loading("Removing book from offline storage...", {
      id: "removeToast",
    });

    try {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      await cache.delete(`/offline-books/${book.fileId}`);

      const newMarkedIds = new Set(offlineMarkedBookIds);
      newMarkedIds.delete(book.$id);
      setOfflineMarkedBookIds(newMarkedIds);
      localStorage.setItem(
        OFFLINE_BOOKS_STORAGE_KEY,
        JSON.stringify(Array.from(newMarkedIds))
      );

      toast.dismiss("removeToast");
      toast.success("Book removed from offline storage.");
      if (viewingPdfUrl) {
        closePdfViewer();
      }
    } catch (error) {
      toast.dismiss("removeToast");
      console.error("Error removing book from offline:", error);
      toast.error("Failed to remove book from offline storage.");
    }
  };

  const closePdfViewer = () => {
    if (viewingPdfUrl) {
      URL.revokeObjectURL(viewingPdfUrl);
    }
    setViewingPdfUrl(null);
  };

  // Navigation handler for assignments - now this is just constructing the href
  const getAssignmentDetailsHref = (assignment: AssignmentData) => {
    return `/students/assignments/${assignment.$id}`;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 font-inter flex flex-col items-center py-10 px-4">
        {/* Dashboard Card Container */}
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-7xl border border-gray-200">
          <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8 leading-tight">
            Welcome, {studentYearGroup || "N/A"} Student!
          </h1>

          {/* Tabs Navigation */}
          <div className="flex justify-center border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200
                ${
                  activeTab === "books"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("books")}
            >
              Books
            </button>
            <button
              className={`relative group py-3 px-6 text-lg font-medium rounded-t-lg transition-colors duration-200
    ${
      activeTab === "assignments"
        ? "text-blue-600 border-b-2 border-blue-600"
        : "text-gray-500 hover:text-gray-700"
    }`}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments and Homeworks
              {/* Tooltip */}
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 
               hidden group-hover:block px-2 py-1 text-xs rounded-md 
               bg-gray-800 text-white whitespace-nowrap"
              >
                ALWAYS SUBMIT YOUR ASSIGNMENTS ON TIME!!!
              </span>
            </button>
          </div>

          {/* Filter and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <div>
              <label
                htmlFor="searchTerm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Topic/Title
              </label>
              <input
                type="text"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Algebra"
              />
            </div>
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
                  setFilterSubTerm("All");
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
                {subTermsOptions[filterTerm]?.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                )) || <option value="All">All</option>}
              </select>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === "books" ? (
            <>
              {/* Books Grid */}
              {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.$id}
                      className="bg-gray-50 rounded-xl shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out border border-gray-200"
                    >
                      <div
                        className="h-32 flex items-center justify-center p-4"
                        style={{ backgroundColor: book.coverColor }}
                      >
                        <p className="text-white text-lg font-bold text-center break-words px-2">
                          {book.topic}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-gray-800 text-md font-semibold">
                          {book.subjectName}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          Year {book.yearGroup} | {book.term} ({book.subTerm})
                        </p>
                        <p className="text-gray-500 text-xs mt-2 truncate">
                          {book.fileName}
                        </p>
                        <div className="mt-4 flex justify-between items-center">
                          {offlineMarkedBookIds.has(book.$id) ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewOfflineBook(book)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                title="View this book from local storage"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  ></path>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  ></path>
                                </svg>
                                View Offline
                              </button>
                              <button
                                onClick={() => handleRemoveFromOffline(book)}
                                className="inline-flex items-center px-3 py-1.5 border border-red-500 text-xs font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                title="Remove from offline storage"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDownloadForOffline(book)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              title="Download for offline viewing"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                ></path>
                              </svg>
                              Download
                            </button>
                          )}
                          {/* The "View Online" button still available for uncached items */}
                          {/* <button
                            onClick={() => handleBookClick(book.fileId)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="View this book online"
                          >
                            View Online
                          </button> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 mt-8">
                  No books found for your year group matching your criteria.
                </p>
              )}

              {/* Section for Already Downloaded Books */}
              {offlineMarkedBookIds.size > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Your Offline Books
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Books marked for offline viewing:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(offlineMarkedBookIds).map((bookId) => {
                      const book = books.find((b) => b.$id === bookId);
                      if (!book) return null;
                      return (
                        <div
                          key={book.$id}
                          className="bg-green-50 rounded-xl shadow-md p-4 flex items-center space-x-3 border border-green-200"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex-shrink-0"
                            style={{ backgroundColor: book.coverColor }}
                          ></div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {book.topic}
                            </p>
                            <p className="text-sm text-gray-600">
                              {book.fileName}
                            </p>
                          </div>
                          <button
                            onClick={() => handleViewOfflineBook(book)}
                            className="ml-auto px-3 py-1 bg-green-200 text-green-800 rounded-md text-sm hover:bg-green-300 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Assignments Tab Content */
            <>
              {filteredAssignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.$id}
                      assignment={assignment}
                      existingSubmission={assignment.submission}
                      href={getAssignmentDetailsHref(assignment)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 mt-8">
                  No assignments found for your year group matching your
                  criteria.
                </p>
              )}
            </>
          )}

          {/* PDF Viewer Modal */}
          {viewingPdfUrl && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="relative bg-white rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-[90vh] overflow-hidden">
                <button
                  onClick={closePdfViewer}
                  className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-3xl font-bold z-10"
                  aria-label="Close PDF Viewer"
                >
                  &times;
                </button>
                <iframe
                  src={viewingPdfUrl}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                >
                  This browser does not support PDFs. Please download the PDF to
                  view it.
                  <a
                    href={viewingPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </iframe>
              </div>
            </div>
          )}

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
      </div>
      <Toaster />

      {/* Floating Help Button */}
      <button
        onClick={() => setIsHelpOpen(true)}
        className="fixed top-5 left-5 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition"
      >
        How to Use
      </button>

      {/* Help Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          isHelpOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-bold text-gray-800">How to Use</h2>
          <button
            onClick={() => setIsHelpOpen(false)}
            className="text-gray-600 hover:text-gray-900 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4 text-gray-700 text-sm overflow-y-auto h-full">
          <p>
            📚 <b>Books:</b> Use the <i>search box</i> or filters (subject,
            term, sub-term) to find books quickly. Electronic files are entered
            by topics for instance the scheme of work for year 7 might have
            chemical reactions as a topic. You may likely see this book by
            searching for chemical reactions or simply by searching for all
            topics under the term e.g Autum, Mid term. Your scheme of work will
            also be placed here. Always visit this learning platform to get all
            your resources in one place.
          </p>
          <p>
            ⬇️ <b>Download for Offline:</b> Click <i>Download</i> to save a book
            and read it offline. This is not a true offline copy but as long as
            you are connected to the internet you may not need to pull the books
            from the server everytime once it has been downloaded. The books can
            be read from cache. If you are having issues with space on your
            device please contact your school ICT Infrastructure Manager for
            guidance and advice
          </p>
          <p>
            📝 <b>Assignments:</b> Click <i>Assignments and Homeworks</i> tab to
            view your assignments.
          </p>
          <p>
            ⏰ <b>Submission Deadlines:</b> Always submit assignments before the
            due date shown.
          </p>

          <p>
            🚪 <b>Logout:</b> Use the logout button at the bottom of the page
            when done.
          </p>
          <p>
            For any technical related issues, please contact your schools ICT
            support.
          </p>
        </div>
      </div>
    </>
  );
}
