"use client";

import React, { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import toast from "react-hot-toast";

interface AddBookFormProps {
  addBookAction: (formData: FormData) => Promise<void>;
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
const defaultColors = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#9C52FF",
  "#FF8C42",
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#9C52FF",
  "#FF8C42",
];

export default function AddBookForm({
  addBookAction,
  dashboardError,
  dashboardSuccess,
}: AddBookFormProps) {
  const { pending } = useFormStatus();

  // Form states
  const [subjectName, setSubjectName] = useState<string>(subjectsList[0]);
  const [topic, setTopic] = useState<string>("");
  const [yearGroup, setYearGroup] = useState<string>(yearGroups[0]);
  const [term, setTerm] = useState<string>(terms[0]);
  const [subTerm, setSubTerm] = useState<string>(subTerms[terms[0]][0]);
  const [coverColor, setCoverColor] = useState<string>(defaultColors[0]);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null); // State to hold the actual file object

  // Handle toast messages from server action
  useEffect(() => {
    if (dashboardError) {
      toast.error(dashboardError);
      document.cookie = `dashboardError=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    if (dashboardSuccess) {
      toast.success(dashboardSuccess);
      document.cookie = `dashboardSuccess=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // Optionally reset form fields on success
      setSubjectName(subjectsList[0]);
      setTopic("");
      setYearGroup(yearGroups[0]);
      setTerm(terms[0]);
      setSubTerm(subTerms[terms[0]][0]);
      setCoverColor(defaultColors[0]);
      setPdfFileName("");
      setPdfFile(null);
    }
  }, [dashboardError, dashboardSuccess]);

  // Update subTerms when term changes
  useEffect(() => {
    if (terms.includes(term) && subTerms[term]?.length > 0) {
      setSubTerm(subTerms[term][0]);
    }
  }, [term]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setPdfFileName(file.name);
      setPdfFile(file);
    } else {
      setPdfFileName("");
      setPdfFile(null);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-inner mt-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Book</h3>

      <form action={addBookAction} className="space-y-6">
        {/* Subject Name */}
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

        {/* Topic */}
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Topic
          </label>
          <input
            type="text"
            id="topic"
            name="topic"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Photosynthesis, Quadratic Equations"
          />
        </div>

        {/* Year Group */}
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

        {/* Term */}
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

        {/* Sub-Term */}
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

        {/* Book Cover Solid Color Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Book Cover Color
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {defaultColors.map((color, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                  coverColor === color ? "border-blue-500" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCoverColor(color)}
                title={color}
              ></div>
            ))}
            <input type="hidden" name="coverColor" value={coverColor} />
          </div>
        </div>

        {/* PDF Selector */}
        <div>
          <label
            htmlFor="pdfFile"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Attach PDF (Max 10MB)
          </label>
          <input
            type="file"
            id="pdfFile"
            name="pdfFile"
            accept=".pdf"
            required={!pdfFile} // Required if no file is currently selected
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50
                       focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                       file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {pdfFileName && (
            <p className="mt-2 text-sm text-gray-500">
              Selected file: {pdfFileName}
            </p>
          )}
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
          {pending ? "Adding Book..." : "Add Book"}
        </button>
      </form>

      {/* Preview Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Book Preview
        </h3>
        <div className="flex items-center space-x-4">
          <div
            className="w-24 h-32 rounded-lg shadow-md flex items-center justify-center text-white text-xs font-bold p-2 text-center break-words"
            style={{ backgroundColor: coverColor }}
          >
            {topic || "Book Topic"}
          </div>
          <div>
            <p className="text-gray-700 text-lg font-medium">
              {subjectName || "Subject"}
            </p>
            <p className="text-gray-600 text-base">
              {yearGroup || "Year Group"}
            </p>
            <p className="text-gray-600 text-sm">
              {term || "Term"} ({subTerm || "Sub-Term"})
            </p>
            {pdfFileName && (
              <p className="text-gray-500 text-xs mt-1">PDF: {pdfFileName}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
