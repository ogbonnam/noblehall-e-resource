"use client";

import React, { useState, useEffect } from "react"; // Added useEffect
import { getAllBookFilesAction } from "@/app/admin/actions"; // Corrected import path
import { Client, Storage } from "appwrite"; // Corrected to client-side SDK
import { appwriteConfig } from "@/appwrite/config"; // Import config

// Define a specific interface for the book file details returned for download
interface BookFileDownloadDetail {
  fileId: string;
  fileName: string;
}

interface DownloadBooksProps {
  showModal: (title: string, message: string) => void;
}

export default function DownloadBooks({ showModal }: DownloadBooksProps) {
  const [loading, setLoading] = useState(false);
  const [bookFilesData, setBookFilesData] = useState<BookFileDownloadDetail[]>(
    []
  ); // Use the explicit type

  // Initialize client-side Appwrite Storage using the @appwrite/appwrite SDK
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);
  const storage = new Storage(client);

  useEffect(() => {
    const fetchBookFiles = async () => {
      try {
        setLoading(true);
        const fetchedFiles: BookFileDownloadDetail[] =
          await getAllBookFilesAction(); // Explicitly type the result
        setBookFilesData(fetchedFiles || []);
      } catch (error: any) {
        showModal("Error", error.message || "Failed to fetch book files.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookFiles();
  }, [showModal]);

  const handleDownloadAll = async () => {
    setLoading(true);
    try {
      if (!bookFilesData || bookFilesData.length === 0) {
        showModal("No Books", "No books found to download.");
        return;
      }

      showModal(
        "Downloading...",
        `Initiating download for ${bookFilesData.length} books. This may take a moment.`
      );

      // Trigger individual downloads for each file on the client-side
      bookFilesData.forEach((file: BookFileDownloadDetail, index) => {
        // Explicitly type 'file' in forEach
        setTimeout(() => {
          const link = document.createElement("a");
          // Generate the download URL using the client-side storage instance
          link.href = storage.getFileDownload(
            appwriteConfig.booksBucketId,
            file.fileId
          );
          link.setAttribute("download", file.fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 500); // Add a small delay between downloads to avoid browser blocking
      });

      // You might want a final success message after all downloads are initiated
      // Note: Browser security might prevent multiple automatic downloads without user interaction.
      // Users might need to confirm each download depending on browser settings.
      // A better approach for many files is to generate a ZIP on the server and offer that.
    } catch (error: any) {
      showModal("Error", error.message || "Failed to initiate book downloads.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-center">
      <p className="text-lg text-gray-700 mb-6">
        Click the button below to download all books that have been uploaded by
        teachers. Each book will be downloaded individually.
      </p>
      <button
        onClick={handleDownloadAll}
        disabled={loading}
        className={`px-8 py-4 text-lg font-semibold rounded-full shadow-lg transition-all duration-300 transform ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:scale-105"
        } focus:outline-none focus:ring-4 focus:ring-indigo-300`}
      >
        {loading ? "Preparing Downloads..." : "Download All Books"}
      </button>
      {loading && (
        <p className="mt-4 text-sm text-gray-500">
          (Your browser may prompt you for each download)
        </p>
      )}
    </div>
  );
}
