import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Paperclip, X, FileText, LoaderCircle, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GeminiSidebar from '../components/GeminiSidebar';
import { useTheme } from '../contexts/ThemeContext';
// NEW: We'll assume these are your new API functions
// import { startInterviewApi, sendAnswerApi } from '../services/interviewApi';
import ErrorMessage from '../components/ErrorMessage';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

// NEW: A simple ChatBubble component
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
        className={`p-3 rounded-2xl max-w-lg ${
          isBot
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
  
  // === NEW STATE ===
  const [interviewPhase, setInterviewPhase] = useState('lobby'); // 'lobby', 'chat', 'finished'
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState(''); // For the chat box
  const chatContainerRef = useRef(null);

  // === LOBBY STATE ===
  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState(''); // NEW: For the JD
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // === GENERAL STATE ===
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // NEW: Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // --- LOBBY FUNCTIONS ---
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
   * NEW: Step 1 - Starts the interview
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
    
    // TODO: Replace with your actual API calls
    // This is a placeholder to simulate the flow
    try {
      // 1. If file, upload it first (You already have this logic)
      let resumeData = resumeText;
      if (hasFile) {
        // const uploadResponse = await uploadResume(resumeFile, token);
        // resumeData = uploadResponse.extracted_text; // Assuming API returns text
        console.log("Simulating file upload...");
        // For this example, let's just use the file name as "text"
        resumeData = `Uploaded file: ${resumeFile.name}`;
      }

      // 2. Start the interview
      // const response = await startInterviewApi({ resume_text: resumeData, job_description_text: jobDescriptionText }, token);
      
      // === SIMULATED API RESPONSE ===
      await new Promise(res => setTimeout(res, 1500)); // Simulate network delay
      const response = {
        session_id: "abc-123-xyz-789",
        first_question: {
          conversational_text: "Welcome! Thanks for applying. To get started, could you please tell me a bit about yourself and walk me through your resume?"
        }
      };
      // === END SIMULATION ===

      setSessionId(response.session_id);
      setChatHistory([
        { role: 'bot', content: response.first_question.conversational_text }
      ]);
      setInterviewPhase('chat'); // <-- This is the magic!
      
      // Clear lobby inputs
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
   * NEW: Step 2 - Handles the main chat loop
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
      // TODO: Replace with your actual API call
      // const response = await sendAnswerApi({ session_id: sessionId, answer_text: userAnswerText }, token);

      // === SIMULATED API RESPONSE ===
      await new Promise(res => setTimeout(res, 2000));
      const response = {
        feedback: { improvement_points: [{ bullet: "That's a good summary. You could also mention your impact at that role." }] },
        next_question: { conversational_text: "Great, thanks. Now, I see you worked with Python and React. Could you describe a challenging project where you used both?" },
        is_finished: false
      };
      // === END SIMULATION ===

      const newBotMessages = [];
      // 1. Add feedback, if any
      if (response.feedback && response.feedback.improvement_points) {
        const feedbackText = response.feedback.improvement_points.map(p => p.bullet).join(' ');
        newBotMessages.push({ role: 'feedback', content: feedbackText });
      }

      // 2. Add next question or end message
      if (response.is_finished) {
        newBotMessages.push({ role: 'bot', content: "That was my last question. Thank you for your time! We'll be in touch." });
        setInterviewPhase('finished');
        // TODO: Navigate to report page or show report here
        // navigate(`/report/${sessionId}`);
      } else {
        newBotMessages.push({ role: 'bot', content: response.next_question.conversational_text });
      }

      setChatHistory([...newHistory, ...newBotMessages]);

    } catch (err) {
      setError(err.detail || "An unexpected error occurred. Please try again.");
      // If API fails, let user try sending again
      setChatHistory(chatHistory); // Revert history
      setCurrentInput(userAnswerText); // Put text back in box
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
  const canSubmitChat = currentInput.trim() !== '' && !isLoading && !isAuthLoading && interviewPhase !== 'finished';
  
  // NEW: Determine which submit handler to use
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
          
          {/* NEW: Conditional UI based on phase */}
          {interviewPhase === 'lobby' ? (
            // --- LOBBY UI ---
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
          ) : (
            // --- CHAT UI ---
            <div
              ref={chatContainerRef}
              className="w-full max-w-4xl mx-auto flex-1 overflow-y-auto pt-16 space-y-2 no-scrollbar"
            >
              {chatHistory.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
              ))}
              {isLoading && interviewPhase === 'chat' && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl max-w-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none">
                    <LoaderCircle className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
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
              {error && <ErrorMessage message={error} onRetry={activeSubmitHandler} />}
              
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
                          <X className="w-4 h-4 text-slate-600 dark:text-slate-300"/>
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
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
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
                  {/* NEW: Job Description Text Area */}
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
              {interviewPhase !== 'lobby' && (
                <div className="relative">
                  <textarea
                    rows="1"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    disabled={isLoading || isAuthLoading || interviewPhase === 'finished'}
                    placeholder={interviewPhase === 'finished' ? "Interview complete. Thank you." : "Type your answer..."}
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
              )}

              {/* Footer text */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 px-4">
                This is an AI-powered interview system. Your responses will be recorded and analyzed.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboardPage;