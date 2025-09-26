"use client";

import React from "react";
// Using a standard font stack to avoid issues with 'next/font/google'
// A custom font stack can be added here if needed.

// --- START OF FILE: components/Navbar.tsx ---
// This component renders the navigation bar.
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md rounded-b-xl">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <a href="/">
            <div className="flex items-center space-x-2">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.419 9.22 4.755 7.5 5.25A2.75 2.75 0 005 7.75c0 2.25 2 4.25 4 4.25s4-2 4-4.25a2.75 2.75 0 00-2.5-2.5zM12 6.253c1.168-.834 2.78-1.5 4.5-.5a2.75 2.75 0 012.5 2.5c0 2.25-2 4.25-4 4.25s-4-2-4-4.25a2.75 2.75 0 012.5-2.5z"
                />
              </svg>
              <span className="text-xl md:text-2xl font-extrabold text-gray-800">
                Noble Hall
              </span>
            </div>
          </a>
        </div>
        {/* Login Button */}
        <a href="/login">
          <button className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Login
          </button>
        </a>
      </div>
    </nav>
  );
}

// --- START OF FILE: components/Footer.tsx ---
// This component renders the footer.
function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-12">
      <div className="container mx-auto text-center">
        <p className="text-sm md:text-base">
          Copyright &copy; Martins Ogbonna 2025 All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

// --- START OF FILE: app/page.tsx ---
// This is the main landing page content.
function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-blue-500 to-purple-600 py-20 md:py-32 rounded-b-3xl shadow-xl mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
            Digital Learning, Right at Your Fingertips.
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Access a vast library of electronic resources designed to empower
            students of Noble Hall.
          </p>
          <a
            href="#subjects"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:bg-gray-200 transition duration-300 transform hover:scale-105"
          >
            View Our Subjects
          </a>
        </div>
      </header>

      {/* Electronic Resources Subjects Section */}
      <section
        id="subjects"
        className="py-16 md:py-24 bg-white rounded-xl shadow-lg mx-4 md:mx-auto container"
      >
        <div className="px-4 text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Electronic Resource Books & Subjects
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Explore a comprehensive collection of e-books and study materials
            categorized by subject.
          </p>
        </div>
        <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Subject Card 1: Mathematics */}
          <div className="bg-gray-50 rounded-xl shadow-inner p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
            <img
              src="https://placehold.co/100x100/A3E635/ffffff?text=Math"
              alt="Mathematics Icon"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Mathematics
            </h3>
            <p className="text-gray-600">
              Algebra, Calculus, and Statistics made easy with clear, digital
              guides.
            </p>
          </div>
          {/* Subject Card 2: Physics */}
          <div className="bg-gray-50 rounded-xl shadow-inner p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
            <img
              src="https://placehold.co/100x100/F43F5E/ffffff?text=Physics"
              alt="Physics Icon"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Physics</h3>
            <p className="text-gray-600">
              Dynamic resources covering Mechanics, Electromagnetism, and more.
            </p>
          </div>
          {/* Subject Card 3: Biology */}
          <div className="bg-gray-50 rounded-xl shadow-inner p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
            <img
              src="https://placehold.co/100x100/60A5FA/ffffff?text=Biology"
              alt="Biology Icon"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Biology</h3>
            <p className="text-gray-600">
              Interactive diagrams and detailed notes on Cell Structure and
              Genetics.
            </p>
          </div>
          {/* Subject Card 4: Chemistry */}
          <div className="bg-gray-50 rounded-xl shadow-inner p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
            <img
              src="https://placehold.co/100x100/8B5CF6/ffffff?text=Chem"
              alt="Chemistry Icon"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Chemistry</h3>
            <p className="text-gray-600">
              Comprehensive guides to organic, inorganic, and physical
              chemistry.
            </p>
          </div>
          {/* Subject Card 5: Computer Science */}
          <div className="bg-gray-50 rounded-xl shadow-inner p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
            <img
              src="https://placehold.co/100x100/34D399/ffffff?text=CS"
              alt="Computer Science Icon"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Computer Science
            </h3>
            <p className="text-gray-600">
              Foundational concepts in algorithms, data structures, and web
              development.
            </p>
          </div>
          {/* Subject Card 6: English Language */}
          <div className="bg-gray-50 rounded-xl shadow-inner p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
            <img
              src="https://placehold.co/100x100/EAB308/ffffff?text=Eng"
              alt="English Icon"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              English Language
            </h3>
            <p className="text-gray-600">
              Improve your writing and comprehension with literary analysis and
              grammar guides.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits & Features Section */}
      <section id="benefits" className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Benefits & Key Features
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover why the Noble Hall E-Resources Portal is your best study
            partner.
          </p>
        </div>
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {/* Benefit 1 */}
          <div className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-16 h-16 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.419 9.22 4.755 7.5 5.25A2.75 2.75 0 005 7.75c0 2.25 2 4.25 4 4.25s4-2 4-4.25a2.75 2.75 0 00-2.5-2.5zM12 6.253c1.168-.834 2.78-1.5 4.5-.5a2.75 2.75 0 012.5 2.5c0 2.25-2 4.25-4 4.25s-4-2-4-4.25a2.75 2.75 0 012.5-2.5z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Always Available
            </h3>
            <p className="text-gray-600">
              Access your study materials 24/7 from any device with an internet
              connection.
            </p>
          </div>
          {/* Benefit 2 */}
          <div className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-16 h-16 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h5.25v-5.25m4.5-4.5h3.75a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H18.75m-9 9l-5.75-5.75m0 0a2.25 2.25 0 113.182 3.182L10.5 13.5l-5.75 5.75m0 0a2.25 2.25 0 113.182-3.182L13.5 10.5l-5.75-5.75"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Curated Content
            </h3>
            <p className="text-gray-600">
              Our resources are carefully selected to align with the school
              curriculum.
            </p>
          </div>
          {/* Benefit 3 */}
          <div className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-16 h-16 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Eco-Friendly
            </h3>
            <p className="text-gray-600">
              Reduce paper waste and contribute to a more sustainable learning
              environment.
            </p>
          </div>
        </div>
      </section>

      {/* Why Use This Site Section */}
      <section className="bg-gray-50 py-16 md:py-24 rounded-3xl mx-4 md:mx-auto container">
        <div className="container mx-auto px-4 flex flex-col-reverse md:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Use the Noble Hall E-Resources Portal?
            </h2>
            <ul className="space-y-4 text-lg text-gray-600">
              <li className="flex items-start md:items-center">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <p>
                  <strong>Seamless Access:</strong> Find what you need quickly
                  with our intuitive, user-friendly interface.
                </p>
              </li>
              <li className="flex items-start md:items-center">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <p>
                  <strong>Mobile-Friendly:</strong> Study on the go with a site
                  that works flawlessly on your phone or tablet.
                </p>
              </li>
              <li className="flex items-start md:items-center">
                <svg
                  className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <p>
                  <strong>Always Up-to-Date:</strong> Our library is
                  continuously updated with the latest educational materials.
                </p>
              </li>
            </ul>
          </div>
          {/* Image */}
          <div className="md:w-1/2">
            <img
              src="https://placehold.co/600x400/fff/2D3748?text=Noble+Hall+E-Resources"
              alt="Students studying with electronic devices"
              className="w-full h-auto rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>
    </>
  );
}

// --- START OF FILE: app/login/page.tsx ---
// This is the placeholder login page.
function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Login</h1>
        <p className="text-gray-600">
          This is the placeholder for your login form.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
// This component simulates the Next.js App Router for this environment.
export default function App() {
  const [currentPath, setCurrentPath] = React.useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  React.useEffect(() => {
    // We add a listener to handle client-side navigation within the mock router
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  let pageContent;
  switch (currentPath) {
    case "/login":
      pageContent = <LoginPage />;
      break;
    case "/":
    default:
      pageContent = <LandingPage />;
      break;
  }

  return (
    <div className="font-sans bg-gray-100 text-gray-800">
      <Navbar />
      <main className="min-h-screen">{pageContent}</main>
      <Footer />
    </div>
  );
}
