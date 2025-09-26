// src/components/admin/BookList.tsx
"use client";

import React, { useEffect, useState } from "react";
import { getBooksAction } from "@/app/admin/actions"; // Corrected import path
import { appwriteConfig } from "@/appwrite/config";
import { Client, Storage } from "appwrite"; // Corrected to client-side SDK

interface Book {
  $id: string;
  title: string;
  author: string;
  fileName: string;
  fileId: string;
  uploadedBy: string;
  uploadedByUserName?: string; // Added to display the resolved user name
  uploadDate: string;
}

interface BookListProps {
  showModal: (title: string, message: string) => void;
}

export default function BookList({ showModal }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize client-side Appwrite Storage
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);
  const storage = new Storage(client);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const fetchedBooks = await getBooksAction();
        setBooks(fetchedBooks || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch books.");
        showModal("Error", err.message || "Failed to fetch books.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [showModal]);

  const getBookPreviewUrl = (fileId: string): string => {
    return storage.getFilePreview(appwriteConfig.booksBucketId, fileId);
  };

  const handleDownload = (fileId: string, fileName: string) => {
    try {
      const downloadUrl = storage.getFileDownload(
        appwriteConfig.booksBucketId,
        fileId
      );
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName); // Suggests the filename for download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showModal("Download Started", `Downloading "${fileName}"...`);
    } catch (err: any) {
      showModal(
        "Download Error",
        `Failed to download "${fileName}": ${err.message}`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading books...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  if (books.length === 0) {
    return <div className="text-gray-600 text-center p-4">No books found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Title
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Author
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              File Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Uploaded By (Teacher)
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Upload Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {books.map((book) => (
            <tr key={book.$id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {book.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {book.author}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {book.fileName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {book.uploadedByUserName} {/* Display the resolved user name */}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {new Date(book.uploadDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleDownload(book.fileId, book.fileName)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors duration-200"
                >
                  Download
                </button>
                {/* Add more actions like 'Delete Book' here */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
