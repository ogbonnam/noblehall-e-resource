"use client";

import React, { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import toast from "react-hot-toast";
import { appwriteConfig } from "@/appwrite/config";

// Define interfaces for question types
interface QuestionText {
  type: "text";
  content: string;
}

interface QuestionImage {
  type: "image";
  file: File | null; // For client-side state
  previewUrl: string | null; // For image preview
}

type Question = QuestionText | QuestionImage;

interface AddAssignmentFormProps {
  createAssignmentAction: (formData: FormData) => Promise<void>;
  dashboardError?: string;
  dashboardSuccess?: string;
}

const subjectsList = [
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
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
];
const terms = ["Autumn", "Spring", "Summer"];
const subTerms: { [key: string]: string[] } = {
  Autumn: ["Autumn Mid Term", "Autumn Full Term"],
  Spring: ["Spring Mid Term", "Spring Full Term"],
  Summer: ["Summer Mid Term", "Summer Full Term"],
};

export default function AddAssignmentForm({
  createAssignmentAction,
  dashboardError,
  dashboardSuccess,
}: AddAssignmentFormProps) {
  const { pending } = useFormStatus();

  // Form states
  const [subjectName, setSubjectName] = useState<string>(subjectsList[0]);
  const [yearGroup, setYearGroup] = useState<string>(yearGroups[0]);
  const [term, setTerm] = useState<string>(terms[0]);
  const [subTerm, setSubTerm] = useState<string>(subTerms[terms[0]][0]);
  const [title, setTitle] = useState<string>("");
  // State to manage dynamic questions
  const [questions, setQuestions] = useState<Question[]>([
    { type: "text", content: "" },
  ]);

  // Handle toast messages from server action
  useEffect(() => {
    if (dashboardError) {
      toast.error(dashboardError);
      document.cookie = `dashboardError=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    if (dashboardSuccess) {
      toast.success(dashboardSuccess);
      document.cookie = `dashboardSuccess=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // Reset form fields on success
      setSubjectName(subjectsList[0]);
      setYearGroup(yearGroups[0]);
      setTerm(terms[0]);
      setSubTerm(subTerms[terms[0]][0]);
      setTitle("");
      setQuestions([{ type: "text", content: "" }]); // Reset to one empty text question
    }
  }, [dashboardError, dashboardSuccess]);

  // Update subTerms when term changes
  useEffect(() => {
    if (terms.includes(term) && subTerms[term]?.length > 0) {
      setSubTerm(subTerms[term][0]);
    }
  }, [term]);

  const addQuestionField = (type: "text" | "image") => {
    if (type === "text") {
      setQuestions((prev) => [...prev, { type: "text", content: "" }]);
    } else {
      setQuestions((prev) => [
        ...prev,
        { type: "image", file: null, previewUrl: null },
      ]);
    }
  };

  const removeQuestionField = (index: number) => {
    setQuestions((prev) => {
      const newQuestions = prev.filter((_, i) => i !== index);
      // Clean up object URL if it was an image
      if (prev[index].type === "image" && prev[index].previewUrl) {
        URL.revokeObjectURL(prev[index].previewUrl as string);
      }
      return newQuestions;
    });
  };

  const handleTextQuestionChange = (index: number, content: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index && q.type === "text" ? { ...q, content } : q
      )
    );
  };

  const handleImageQuestionChange = (index: number, file: File | null) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === index && q.type === "image") {
          if (q.previewUrl) {
            URL.revokeObjectURL(q.previewUrl); // Clean up previous preview URL
          }
          return {
            ...q,
            file: file,
            previewUrl: file ? URL.createObjectURL(file) : null,
          };
        }
        return q;
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(event.currentTarget); // Get form data
    formData.set("subjectName", subjectName);
    formData.set("yearGroup", yearGroup);
    formData.set("term", term);
    formData.set("subTerm", subTerm);
    formData.set("title", title);

    // Append dynamic questions to FormData
    questions.forEach((q, index) => {
      formData.append(`questionType-${index}`, q.type);
      if (q.type === "text") {
        formData.append(`questionText-${index}`, q.content);
      } else if (q.type === "image" && q.file) {
        formData.append(`questionImage-${index}`, q.file);
      }
    });

    // Call the server action
    await createAssignmentAction(formData);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-inner mt-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Create New Assignment
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Assignment Details */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assignment Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Chapter 5 Review, Photosynthesis Homework"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="subjectName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject Name
            </label>
            <select
              id="subjectName"
              name="subjectName"
              required
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
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
              htmlFor="yearGroup"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Year Group
            </label>
            <select
              id="yearGroup"
              name="yearGroup"
              required
              value={yearGroup}
              onChange={(e) => setYearGroup(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {yearGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="term"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Term
            </label>
            <select
              id="term"
              name="term"
              required
              value={term}
              onChange={(e) => setTerm(e.target.value)}
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
              htmlFor="subTerm"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sub-Term
            </label>
            <select
              id="subTerm"
              name="subTerm"
              required
              value={subTerm}
              onChange={(e) => setSubTerm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {subTerms[term]?.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Question Fields */}
        <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
          <h4 className="text-lg font-semibold text-gray-800 flex justify-between items-center">
            Assignment Questions
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => addQuestionField("text")}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                title="Add Text Question"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => addQuestionField("image")}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                title="Add Image Question"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L20 18m-4-4l-4.586-4.586a2 2 0 00-2.828 0L4 16m-4 4h16.01C20.2 20 21 19.29 21 18.5V5.49L12 3H4a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
              </button>
            </div>
          </h4>

          {questions.map((q, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md bg-white shadow-sm"
            >
              <input
                type="hidden"
                name={`questionType-${index}`}
                value={q.type}
              />
              {q.type === "text" ? (
                <div className="flex-grow">
                  <label
                    htmlFor={`questionText-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Text Question {index + 1}
                  </label>
                  <textarea
                    id={`questionText-${index}`}
                    name={`questionText-${index}`}
                    value={q.content}
                    onChange={(e) =>
                      handleTextQuestionChange(index, e.target.value)
                    }
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter question text here..."
                    required
                  ></textarea>
                </div>
              ) : (
                <div className="flex-grow">
                  <label
                    htmlFor={`questionImage-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Image Question {index + 1}
                  </label>
                  <input
                    type="file"
                    id={`questionImage-${index}`}
                    name={`questionImage-${index}`}
                    accept="application/pdf"
                    onChange={(e) =>
                      handleImageQuestionChange(
                        index,
                        e.target.files ? e.target.files[0] : null
                      )
                    }
                    className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50
                               file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                               file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required={!q.previewUrl} // Required if no image is currently selected
                  />
                  {q.previewUrl && (
                    <img
                      src={q.previewUrl}
                      alt="Question Preview"
                      className="mt-2 max-h-32 w-auto rounded-md shadow-md"
                    />
                  )}
                </div>
              )}
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestionField(index)}
                  className="p-1 text-red-500 hover:text-red-700 self-center"
                  title="Remove Question"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={pending}
          className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm
                     text-base font-semibold text-white bg-blue-600 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition duration-150 ease-in-out transform hover:scale-105
                     ${pending ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {pending ? "Creating Assignment..." : "Create Assignment"}
        </button>
      </form>
    </div>
  );
}
