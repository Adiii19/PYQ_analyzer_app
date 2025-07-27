// Summary.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Summary({ summary, isLoading }) {
  // Aligns with the width of the QuestionContainer components.
  // Removed 'mx-auto' to ensure left-alignment with the containers above.
  const containerClasses = "max-w-[90%] w-full mt-8 mb-12";

  if (isLoading) {
    return (
      <div className={`${containerClasses} p-6 border border-gray-200 rounded-xl shadow-lg bg-gray-50`}>
        <div className="flex items-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <h2 className="text-2xl font-bold text-gray-700">Generating Summary...</h2>
        </div>
        <p className="text-gray-500">Please wait while the AI analyzes the document.</p>
      </div>
    );
  }

  if (!summary) {
    return null; // Don't render anything if there's no summary
  }

  return (
    <div className={`${containerClasses} p-6 border border-gray-200 rounded-xl shadow-lg bg-white relative overflow-hidden`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-100 rounded-full opacity-50"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-red-100 rounded-full opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-4 border-b border-gray-200 pb-3">
          <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <h2 className="text-2xl font-bold text-gray-800">Analysis Summary</h2>
        </div>
        {/* Replaced 'prose' with a custom class for better styling control */}
        <div className="summary-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default Summary;
