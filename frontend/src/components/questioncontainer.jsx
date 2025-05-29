import { useState } from "react";
import "./questioncontainer.css";

function QuestionContainer({ category, color, questions }) {
  const [expanded, setExpanded] = useState(false);

  // Safely sort questions by their leading number
  const sortedQuestions = Array.isArray(questions)
  ? [...questions]
      .map(item => (typeof item === 'string' ? item : item[0])) // ensure we work with strings
      .sort((a, b) => {
        const numA = parseInt(a.split(".")[0]);
        const numB = parseInt(b.split(".")[0]);
        return numA - numB;
      })
  : [];


  return (
    <div
      className={`flex flex-col max-w-[90%] p-4 mt-2 mb-3 rounded-lg border cursor-pointer transition-all duration-100 ease-out overflow-hidden
        ${expanded ? "h-auto justify-start" : "h-[3.5rem] justify-center"} animate__animated animate__fadeIn`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg height="100" width="20" xmlns="http://www.w3.org/2000/svg">
            <circle r="4" cx="5" cy="50" fill={color} />
          </svg>
          <p className="font-poppins font-semibold">{category}</p>
        </div>

        {/* Toggle Icon */}
        <svg
          onClick={() => setExpanded(!expanded)}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          className="cursor-pointer"
        >
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z" />
          <path d="M12 12.586 8.707 9.293l-1.414 1.414L12 15.414l4.707-4.707-1.414-1.414L12 12.586z" />
        </svg>
      </div>

      {/* Expandable Section */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          expanded ? "opacity-100 mt-4" : "opacity-0 h-0"
        }`}
      >
        {sortedQuestions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sortedQuestions.map((q, index) => (
              <p key={index} className="text-sm font-poppins font-medium text-gray-800">
                {q}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No questions available.</p>
        )}
      </div>
    </div>
  );
}

export default QuestionContainer;
