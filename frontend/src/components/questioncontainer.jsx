// questioncontainer.jsx

import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnswerModal from './AnswerModal';
import ChoiceModal from './ui/ChoiceModal';
import "./questioncontainer.css";

function QuestionContainer({ category, color, questions = [] }) {
  const [expanded, setExpanded] = useState(false);
  
  // State for the answer modal
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  // State for the choice modal
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);

  const handleQuestionClick = (questionText) => {
    setActiveQuestion(questionText);
    setIsChoiceModalOpen(true);
  };

  const handleGetSolution = async () => {
    setIsChoiceModalOpen(false);
    if (!activeQuestion) return;

    setIsAnswerModalOpen(true);
    setIsLoadingAnswer(true);
    setAnswer('');

    try {
      const response = await fetch('http://localhost:5001/get-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: activeQuestion }),
      });
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error("Failed to fetch answer:", error);
      setAnswer("Sorry, I couldn't get an answer for that question.");
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleGetVideo = async () => {
    setIsChoiceModalOpen(false);
    if (!activeQuestion) return;

    try {
      const response = await fetch('http://localhost:5001/get-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: activeQuestion }),
      });
      
      // --- THIS IS THE FIX ---
      // Check if the server responded with an error status (like 500)
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      // --- END OF FIX ---

      const data = await response.json();
      if (data.videoUrl) {
        window.open(data.videoUrl, '_blank');
      } else {
        alert("Sorry, couldn't find a video for that topic.");
      }
    } catch (error) {
      console.error("Failed to fetch video link:", error);
      alert("An error occurred while searching for a video. Please ensure the backend server is running correctly.");
    }
    setActiveQuestion(null);
  };

  const closeAnswerModal = () => {
    setIsAnswerModalOpen(false);
    setActiveQuestion(null);
  };

  const closeChoiceModal = () => {
    setIsChoiceModalOpen(false);
    setActiveQuestion(null);
  };

  return (
    <>
      <div
        className={`flex flex-col max-w-[90%] p-4 mt-2 mb-3 rounded-lg border transition-all duration-100 ease-out overflow-hidden
          ${expanded ? "h-auto justify-start" : "h-[3.5rem] justify-center"} animate__animated animate__fadeIn`}
      >
        {/* --- THIS IS THE CORRECTED HEADER SECTION --- */}
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center space-x-2">
            <svg height="100" width="20" xmlns="http://www.w3.org/2000/svg">
              <circle r="4" cx="5" cy="50" fill={color} />
            </svg>
            <p className="font-poppins font-semibold">{category}</p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z" />
            <path d="M12 12.586 8.707 9.293l-1.414 1.414L12 15.414l4.707-4.707-1.414-1.414L12 12.586z" />
          </svg>
        </div>
        {/* --- END OF CORRECTION --- */}

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expanded ? "opacity-100 mt-4" : "opacity-0 h-0"}`}>
          {questions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {questions.map((q, index) => (
                <div key={index} className="flex items-start justify-between">
                  <div 
                    className="markdown-content text-sm font-poppins font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                    onClick={() => handleQuestionClick(q[0])}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{q[0]}</ReactMarkdown>
                  </div>
                  <p className="font-normal whitespace-nowrap pt-1 pl-4">{"(Asked " + q[1] + " times)"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No questions available.</p>
          )}
        </div>
      </div>

      {isChoiceModalOpen && (
        <ChoiceModal
          onSolution={handleGetSolution}
          onVideo={handleGetVideo}
          onClose={closeChoiceModal}
        />
      )}

      {isAnswerModalOpen && (
        <AnswerModal
          answer={answer}
          onClose={closeAnswerModal}
          isLoading={isLoadingAnswer}
        />
      )}
    </>
  );
}

export default QuestionContainer;
