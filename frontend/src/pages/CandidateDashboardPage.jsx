import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Paperclip, X, FileText, LoaderCircle, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GeminiSidebar from '../components/GeminiSidebar';
import { useTheme } from '../contexts/ThemeContext';
// --- 1. IMPORT YOUR REAL API FUNCTIONS ---
import { startInterviewApi, sendAnswerApi, getReportApi } from '../services/interviewApi';
// TODO: You still need your resume upload function (if you use it)
// import { uploadResume } from '../services/sessionApi'; 
import ErrorMessage from '../components/ErrorMessage';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

// --- (ChatBubble component is unchanged) ---
const ChatBubble = ({ message }) => {
  const { isDark } = useTheme();
  const isBot = message.role === 'bot';
  const isFeedback = message.role === 'feedback';

  if (isFeedback) {
    return (
      <div className="my-2 flex justify-center">
        <div className={`text-xs p-2 px-3 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 flex items-center`}>
          <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} my-2`}>
      <div
        className={`p-3 rounded-2xl max-w-lg ${isBot
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
            : 'bg-blue-500 text-white rounded-br-none'
          }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

const CandidateDashboardPage = () => {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const { isDark } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // === INTERVIEW STATE ===
  const [interviewPhase, setInterviewPhase] = useState('lobby'); // 'lobby', 'chat', 'report'
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const chatContainerRef = useRef(null);

  // === LOBBY STATE ===
  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // === GENERAL STATE ===
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 2. NEW STATE FOR THE FINAL REPORT ---
  const [finalReport, setFinalReport] = useState(null);


  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // --- (Lobby helper functions are unchanged) ---
  const handleTextChange = (e) => {
    setResumeText(e.target.value);
    if (resumeFile) setResumeFile(null);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeText('');
    }
  };
  const handleFileDismiss = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- API FUNCTIONS ---

  /**
   * --- 3. UPDATED WITH REAL API CALL ---
   * Step 1 - Starts the interview
   */
  const handleStartInterview = async () => {
    setError(null);
    const hasText = resumeText.trim() !== '';
    const hasFile = resumeFile !== null;
    const hasJd = jobDescriptionText.trim() !== '';

    if ((!hasText && !hasFile) || !hasJd) {
      setError("Please provide both a resume (text or file) and a job description.");
      return;
    }

    setIsLoading(true);

    try {
      let resumeData = resumeText;
      if (hasFile) {
        // TODO: Implement your file upload logic here if needed
        // For now, we just simulate it as your BE accepts text
        console.log("Simulating file upload and text extraction...");
        // const uploadResponse = await uploadResume(resumeFile, token);
        // resumeData = uploadResponse.extracted_text;
        resumeData = `Uploaded file: ${resumeFile.name}. (This is a placeholder, actual text extraction needed if you support files)`;
      }

      // --- REAL API CALL ---
      const response = await startInterviewApi({
        resume_text: resumeData,
        job_description_text: jobDescriptionText
      }, token);
      // --- END REAL API CALL ---

      setSessionId(response.session_id);
      setChatHistory([
        { role: 'bot', content: response.first_question }
      ]);
      setInterviewPhase('chat'); // <-- This is the magic!

      setResumeText('');
      setJobDescriptionText('');
      setResumeFile(null);

    } catch (err) {
      setError(err.detail || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * --- 4. UPDATED WITH REAL API CALL ---
   * Step 2 - Handles the main chat loop
   */
  const handleSendAnswer = async () => {
    if (currentInput.trim() === '') return;

    const userAnswerText = currentInput;
    const newHistory = [...chatHistory, { role: 'user', content: userAnswerText }];

    setChatHistory(newHistory);
    setCurrentInput('');
    setIsLoading(true);
    setError(null);

    try {
      // --- REAL API CALL ---
      const response = await sendAnswerApi({
        session_id: sessionId,
        answer_text: userAnswerText
      }, token);
      // --- END REAL API CALL ---

      const newBotMessages = [];
      // 1. Add feedback, if any
      if (response.feedback && response.feedback.improvement_points) {
        const feedbackText = response.feedback.improvement_points.map(p => p.bullet).join(' ');
        newBotMessages.push({ role: 'feedback', content: feedbackText });
      }

      // 2. Add next question OR fetch the report
      if (response.is_finished) {
        newBotMessages.push({ role: 'bot', content: "That was my last question. Thank you for your time! Generating your final report..." });
        setChatHistory([...newHistory, ...newBotMessages]);

        // --- 5. FETCH THE REPORT ---
        await handleFetchReport(); // This will also set the phase to 'report'

      } else {
        if (response.next_question) {
          newBotMessages.push({ role: 'bot', content: response.next_question.conversational_text });
        } else {
          // Fallback in case is_finished is false but next_question is null
          newBotMessages.push({ role: 'bot', content: "Please wait a moment..." });
        }
        setChatHistory([...newHistory, ...newBotMessages]);
      }

    } catch (err) {
      setError(err.detail || "An unexpected error occurred. Please try again.");
      setChatHistory(chatHistory); // Revert history
      setCurrentInput(userAnswerText); // Put text back in box
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * --- 6. NEW FUNCTION TO FETCH AND DISPLAY THE REPORT ---
   */
  const handleFetchReport = async () => {
    setIsLoading(true); // Keep spinner active
    try {
      const reportData = await getReportApi(sessionId, token);
      setFinalReport(reportData.final_report); // Save the report
      setInterviewPhase('report'); // Change the UI to show the report
    } catch (err) {
      setError(err.detail || "Could not fetch your report.");
      // Even if report fails, keep the phase as 'report' to show the error
      setInterviewPhase('report');
    } finally {
      setIsLoading(false);
    }
  };


  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-slate-900">
        <LoadingSpinner text="Authenticating..." />
      </div>
    );
  }

  // Determine button state
  const canSubmitLobby = (resumeText.trim() !== '' || resumeFile !== null) && jobDescriptionText.trim() !== '' && !isLoading && !isAuthLoading;
  const canSubmitChat = currentInput.trim() !== '' && !isLoading && !isAuthLoading && interviewPhase === 'chat';

  const activeSubmitHandler = interviewPhase === 'lobby' ? handleStartInterview : handleSendAnswer;
  const canSubmit = interviewPhase === 'lobby' ? canSubmitLobby : canSubmitChat;

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'dark' : ''}`}>
      <GeminiSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex-1 flex flex-col items-center w-full px-4 pb-4 overflow-y-auto">

          {/* --- 7. UPDATED CONDITIONAL UI --- */}

          {/* --- LOBBY UI --- */}
          {interviewPhase === 'lobby' && (
            <div className="w-full max-w-4xl mx-auto flex flex-col justify-between h-full">
              <div className="pt-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 dark:from-slate-200 dark:via-slate-400 dark:to-slate-200 mb-4">
                    Hello, {user?.firstName || 'Candidate'}.
                  </h1>
                  <h2 className="text-4xl font-semibold text-slate-500 dark:text-slate-400">
                    Ready to start your interview?
                  </h2>
                </motion.div>
              </div>
            </div>
          )}

          {/* --- CHAT UI --- */}
          {interviewPhase === 'chat' && (
            <div
              ref={chatContainerRef}
              className="w-full max-w-4xl mx-auto flex-1 overflow-y-auto pt-16 space-y-2 no-scrollbar"
            >
              {chatHistory.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl max-w-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none">
                    <LoaderCircle className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- 8. NEW REPORT UI --- */}
          {interviewPhase === 'report' && (
            <div className="w-full max-w-4xl mx-auto flex-1 overflow-y-auto pt-16 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                  Your Interview Report
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  Here is a breakdown of your performance.
                </p>
              </motion.div>
              {isLoading ? (
                <LoadingSpinner text="Generating report..." />
              ) : finalReport ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md"
                >
                  {/* A simple way to display the report. You can make this much prettier. */}
                  <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {JSON.stringify(finalReport, null, 2)}
                  </pre>
                </motion.div>
              ) : (
                // This will show if `finalReport` is null and not loading (i.e., an error)
                <p className="text-red-500">{error || "Could not load report."}</p>
              )}
            </div>
          )}


          {/* --- BOTTOM INPUT BAR (Changes based on phase) --- */}
          <div className="mt-auto w-full pt-4 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full"
            >
              {error && interviewPhase !== 'report' && <ErrorMessage message={error} onRetry={activeSubmitHandler} />}

              {/* --- LOBBY INPUTS --- */}
              {interviewPhase === 'lobby' && (
                <>
                  {resumeFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 ml-2 flex"
                    >
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-2 flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-300" />
                        <span className="text-slate-800 dark:text-white font-medium">{resumeFile.name}</span>
                        <button onClick={handleFileDismiss} className="ml-2 p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600" disabled={isLoading}>
                          <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {/* Resume Text Area */}
                  <div className="relative mb-3">
                    <textarea
                      rows="1"
                      value={resumeText}
                      onChange={handleTextChange}
                      disabled={isLoading || isAuthLoading || resumeFile}
                      placeholder={resumeFile ? "File attached. Now add the job description." : "Paste resume, or upload a file..."}
                      className="w-full pl-12 pr-12 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:cursor-not-allowed max-h-36 overflow-y-auto"
                      onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                    />
                    <div className="absolute left-3 top-12 -translate-y-1/2 flex items-center">
                      {!resumeText && !isLoading && (
                        <>
                          <input
                            type="file" id="resume-upload" className="hidden"
                            onChange={handleFileChange} ref={fileInputRef}
                            accept=".pdf,.doc,.docx,.txt"
                          />
                          <label htmlFor="resume-upload" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                            <Paperclip className="w-5 h-5" />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Job Description Text Area */}
                  <div className="relative">
                    <textarea
                      rows="1"
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                      disabled={isLoading || isAuthLoading}
                      placeholder="Paste the job description here..."
                      className="w-full pl-12 pr-24 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:cursor-not-allowed max-h-36 overflow-y-auto"
                      onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                    />
                    {/* --- LOBBY SUBMIT BUTTON --- */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" disabled={isLoading || isAuthLoading || interviewPhase === 'finished'}>
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        onClick={activeSubmitHandler}
                        disabled={!canSubmit}
                        className="p-2 rounded-full bg-blue-500 text-white transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* --- CHAT INPUT --- */}
              {interviewPhase === 'chat' && (
                <div className="relative">
                  <textarea
                    rows="1"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    disabled={isLoading || isAuthLoading}
                    placeholder={"Type your answer..."}
                    className="w-full pl-12 pr-24 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:cursor-not-allowed max-h-36 overflow-y-auto"
                    onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
                        e.preventDefault();
                        activeSubmitHandler();
                      }
                    }}
                  />
                  {/* --- CHAT SUBMIT BUTTON --- */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" disabled={isLoading || isAuthLoading}>
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      onClick={activeSubmitHandler}
                      disabled={!canSubmit}
                      className="p-2 rounded-full bg-blue-500 text-white transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* --- 9. HIDE FOOTER ON REPORT PAGE --- */}
              {interviewPhase !== 'report' && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 px-4">
                  This is an AI-powered interview system. Your responses will be recorded and analyzed.
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboardPage;