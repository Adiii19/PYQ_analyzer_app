import { useState, useRef } from "react";
import axios from 'axios';
import "./App.css";
import QuestionContainer from "./components/questioncontainer";
import 'animate.css';
import Summary from './components/Summary'; // 1. Import the new component

function App() {
  const [filename, setfilename] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [groupedQuestions, setGroupedQuestions] = useState({}); // Use state for questions
  const [questionCount, setQuestionCount] = useState(0); // Use state for count
  const [showResults, setShowResults] = useState(false);

  // 2. Add new state variables for the summary
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setfilename(file.name);
      setUploadStatus('Uploading...'); // Give user feedback
      setShowResults(false); // Reset results on new upload
      setSummary(''); // Reset summary on new upload

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await axios.post('http://127.0.0.1:5001/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadData = res.data;
        setUploadStatus(res.status);
        setGroupedQuestions(uploadData.questions);
        setQuestionCount(uploadData.length);
        setShowResults(true);

        // --- 3. START: NEW LOGIC FOR SUMMARY ---
        if (uploadData.all_questions && uploadData.all_questions.length > 0) {
          setIsLoadingSummary(true);
          setSummary('');

          try {
            const summaryResponse = await axios.post('http://localhost:5001/get-summary', {
              questions: uploadData.all_questions
            });

            if (summaryResponse.status !== 200) {
              throw new Error('Failed to fetch summary');
            }

            setSummary(summaryResponse.data.summary);

          } catch (error) {
            console.error("Summary fetch error:", error);
            setSummary("Could not generate a summary for this document.");
          } finally {
            setIsLoadingSummary(false);
          }
        }
        // --- END: NEW LOGIC FOR SUMMARY ---

      } catch (err) {
        console.error(err);
        setUploadStatus('Upload failed');
        setShowResults(false);
      }
    }
  };

  return (
    <div className="bg-red-400 top-0 left-0 w-full h-full-z-10">
      <div className="absolute top-20 left-20">
        <p className="text-3xl font-poppins font-bold">
          Question Paper Analyzer
        </p>
        <p className="pt-3 font-poppins font-semibold">
          Upload one or more PDFs of question papers to identify frequently
          asked questions based on semantic similarity and frequency
        </p>
        <p className="pt-4 font-poppins font-semibold">Upload PDFs here:</p>
        <div className="place-items-center flex row mt-5 rounded-lg box-border max-w-9/10 h-[4rem] border-1 p-4 bg-white-200 justify-between">
          <div className="flex">
            <div className="pt-2 pr-1">
              <svg className="cloud-logo" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
                <path fill="black" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
            </div>
            <div className="flex-column">
              <p className="font-poppins font-semibold">
                Drag and drop files here
              </p>
              <p className="text-xs pl- pt-1 font-poppins font-normal text-gray-600">
                Limit 200 MB per file
              </p>
            </div>
          </div>
          <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button type="button" onClick={handleButtonClick} className="middle none center rounded-lg bg-blue-700 py-2 px-6 font-sans text-xs font-bold uppercase text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none h-8" data-ripple-light="true">
            Browse Files
          </button>
        </div>
        <div className="place-items-center flex row mt-2 rounded-lg box-border max-w-9/10 h-[4rem] p-4 bg-white-200 justify-between">
          <div className="flex">
            <div className="pt-2 pr-1">
              <svg className="w-6 h-6 text-black-800 dark:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z" />
              </svg>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="font-poppins font-semibold">{filename}</p>
            </div>
          </div>
          <button className="middle none center py- px-3 font-sans text-xs font-bold uppercase text-black transition-all focus:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none h-8" data-ripple-light="true">
            X
          </button>
        </div>

        {uploadStatus === 200 && showResults && (
          <>
            <div className="place-items-center flex row rounded-lg box-border max-w-9/10 h-[3rem] border-1 p-4 bg-white-200 justify-items-start animate__animated animate__fadeIn">
              <svg className="w-6 h-6 text-green-300 dark:text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5" />
              </svg>
              <div className="font-poppins font-semibold">
                Extracted {questionCount} questions from uploaded pdfs
              </div>
            </div>

            <QuestionContainer category="🔴 Frequently Asked" color="red" questions={groupedQuestions["🔴 Frequently Asked"]} />
            <QuestionContainer category="🟠 Occasionally Asked" color="orange" questions={groupedQuestions["🟠 Occasionally Asked"]} />
            <QuestionContainer category="🟢 Rarely Asked" color="green" questions={groupedQuestions["🟢 Rarely Asked"]} />
            
            {/* 4. Render the Summary component */}
            <Summary summary={summary} isLoading={isLoadingSummary} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
