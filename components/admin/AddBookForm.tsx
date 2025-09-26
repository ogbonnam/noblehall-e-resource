"use client";

import React, { useState, useRef } from "react";
import { addBookAction } from "@/app/admin/actions";

interface AddBookFormProps {
  showModal: (title: string, message: string) => void;
}

export default function AddBookForm({ showModal }: AddBookFormProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      // You might need to dynamically get the admin's userId or have a default 'admin' user ID
      // For simplicity, let's assume a placeholder or you can add an input for it.
      // In a real app, the server action would likely infer the current admin's ID.
      formData.append("uploadedByUserId", "admin_user_id_placeholder"); // IMPORTANT: Replace with actual admin user ID or infer on server

      await addBookAction(formData);
      showModal("Success", "Book added successfully!");
      formRef.current?.reset(); // Clear the form
    } catch (error: any) {
      showModal("Error", error.message || "Failed to add book.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-6 max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md"
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Book Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="author"
          className="block text-sm font-medium text-gray-700"
        >
          Author
        </label>
        <input
          type="text"
          id="author"
          name="author"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="bookFile"
          className="block text-sm font-medium text-gray-700"
        >
          Book File (PDF, EPUB, etc.)
        </label>
        <input
          type="file"
          id="bookFile"
          name="bookFile"
          accept=".pdf,.epub,.doc,.docx" // Specify accepted file types
          required
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
      </div>
      {/*
        Optional: If you want to specify which teacher uploaded it,
        you'd need a dropdown here populated with teacher IDs/names.
        For now, we're using a placeholder in the action.
      */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          loading
            ? "bg-indigo-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        } transition-colors duration-200`}
      >
        {loading ? "Adding Book..." : "Add Book"}
      </button>
    </form>
  );
}
