// AnswerModal.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'katex/dist/katex.min.css'; // Styles for math rendering

function AnswerModal({ answer, onClose, isLoading }) {
  if (!answer && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <h3 className="text-xl font-semibold text-gray-800">Generated Answer</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Apply the new CSS class here for better readability */}
        <div className="markdown-answer-content">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {answer}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnswerModal;
