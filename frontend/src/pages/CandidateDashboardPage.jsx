import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  Paperclip,
  X,
  FileText,
  LoaderCircle,
  Bot,
  User,
  Sparkles,
  Briefcase,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import GeminiSidebar from "../components/GeminiSidebar.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import {
  startInterviewApi,
  sendAnswerApi,
  getReportApi,
} from "../services/interviewApi.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import useWebSpeech from "../hooks/useWebSpeech";

// --- HELPER: Report HTML Generator ---
function generateReportHtml(data) {
  const createListItems = (items) => {
    if (!Array.isArray(items)) return "";
    return items.map((item) => `<li>${item}</li>`).join("");
  };

  const createQuestionSections = (questions) => {
    if (!Array.isArray(questions)) {
      console.warn("question_breakdown is not an array:", questions);
      return "";
    }
    return questions
      .map(
        (q) => `
            <div class="question-section">
                <h3>Question ${q.question_number}: ${q.question_text}</h3>
                <p><strong>Candidate's Answer:</strong> ${q.candidate_answer.replace(
                  /\n/g,
                  "<br>"
                )}</p>
                <div class="evaluation-summary">
                    <p><strong>Evaluation Summary (Score: ${
                      q.evaluation_score
                    }%):</strong> ${q.evaluation_summary}</p>
                </div>
                <div class="feedback">
                    <h4>Feedback & Improvement Points:</h4>
                    <ul>
                        ${createListItems(q.feedback_points)}
                    </ul>
                </div>
            </div>
        `
      )
      .join("");
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 20px auto; background: #f4f4f4; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #0056b3; }
        h1 { text-align: center; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px; }
        .section { background: #fff; padding: 15px; margin-bottom: 20px; border-radius: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.05); }
        .overall-summary p { font-size: 1.1em; }
        .overall-summary .score { font-weight: bold; }
        .question-section { border-left: 5px solid #007bff; padding-left: 15px; margin-top: 25px; }
        .question-section h3 { color: #007bff; margin-top: 0; }
        .question-section strong { color: #555; }
        .evaluation-summary { background: #e9f7ff; border-left: 3px solid #0056b3; padding: 10px; margin-top: 10px; border-radius: 3px; }
        .feedback { background: #fff3cd; border-left: 3px solid #ffc107; padding: 10px; margin-top: 10px; border-radius: 3px; }
        ul { list-style-type: disc; margin-left: 20px; }
        ol { list-style-type: decimal; margin-left: 20px; }
    </style>
</head>
<body>
    <h1>Interview Performance Report</h1>
    <div class="section overall-summary">
        <h2>Overall Summary</h2>
        <p>${data.overall_summary}</p>
        <p class="score"><strong>Overall Score: ${
          data.overall_score
        }%</strong></p>
    </div>
    <div class="section">
        <h2>Top 3 Areas for Improvement</h2>
        <ol>
            ${createListItems(data.top_3_improvements)}
        </ol>
    </div>
    <div class="section">
        <h2>Detailed Question Breakdown</h2>
        ${createQuestionSections(data.question_breakdown)}
    </div>
</body>
</html>
    `;
}

// --- COMPONENT: Chat Bubble ---
const ChatBubble = ({ message }) => {
  const isBot = message.role === "bot";
  const isFeedback = message.role === "feedback";

  if (isFeedback) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-4 flex justify-center"
      >
        <div className="text-xs font-medium py-2 px-4 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center shadow-sm border border-indigo-100 dark:border-indigo-800">
          <Sparkles className="w-3 h-3 mr-2 text-indigo-500" />
          <span>{message.content}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isBot ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isBot ? "justify-start" : "justify-end"} my-4 px-2`}
    >
      <div
        className={`flex max-w-2xl ${
          isBot ? "flex-row" : "flex-row-reverse"
        } items-end gap-3`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isBot
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          {isBot ? <Bot size={16} /> : <User size={16} />}
        </div>

        {/* Bubble */}
        <div
          className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isBot
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-none"
              : "bg-blue-600 text-white rounded-br-none"
          }`}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT: CandidateDashboardPage ---
const CandidateDashboardPage = () => {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const { isDark } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // === INTERVIEW STATE ===
  const [interviewPhase, setInterviewPhase] = useState("lobby"); // 'lobby', 'chat', 'report'
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const chatContainerRef = useRef(null);

  // === LOBBY STATE ===
  const [resumeText, setResumeText] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);

  // === GENERAL STATE ===
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // === REPORT STATE ===
  const [finalReport, setFinalReport] = useState(null);

  // === WEB SPEECH API ===
  const { isListening, transcript, startListening, stopListening, hasSupport } =
    useWebSpeech();
  const previousInputRef = useRef("");

  useEffect(() => {
    if (isListening) {
      previousInputRef.current = currentInput;
    }
  }, [isListening]);

  useEffect(() => {
    if (transcript && isListening) {
      const prefix = previousInputRef.current;
      const spacer = prefix && !prefix.endsWith(" ") ? " " : "";
      setCurrentInput(`${prefix}${spacer}${transcript}`);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (finalReport && interviewPhase === "report") {
      try {
        const finalHtml = generateReportHtml(finalReport);
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(finalHtml);
          newWindow.document.close();
        } else {
          alert("Please allow popups to view your report.");
        }
      } catch (error) {
        console.error("Failed to build report HTML:", error);
        setError(
          "Report data was fetched, but the HTML template failed to build."
        );
      }
    }
  }, [finalReport, interviewPhase]);

  // --- HANDLERS ---
  const handleTextChange = (e) => {
    setResumeText(e.target.value);
    if (resumeFile) setResumeFile(null);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeText("");
    }
  };
  const handleFileDismiss = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartInterview = async () => {
    setError(null);
    if (isListening) stopListening();

    const hasText = resumeText.trim() !== "";
    const hasFile = resumeFile !== null;
    const hasJd = jobDescriptionText.trim() !== "";

    if ((!hasText && !hasFile) || !hasJd) {
      setError(
        "Please provide both a resume (text or file) and a job description."
      );
      return;
    }

    setIsLoading(true);

    try {
      let resumeData = resumeText;
      if (hasFile) {
        resumeData = `Uploaded file: ${resumeFile.name}. (Placeholder)`;
      }

      const response = await startInterviewApi(
        {
          resume_text: resumeData,
          job_description_text: jobDescriptionText,
        },
        token
      );

      setSessionId(response.session_id);
      setChatHistory([{ role: "bot", content: response.first_question }]);
      setInterviewPhase("chat");

      setResumeText("");
      setJobDescriptionText("");
      setResumeFile(null);
    } catch (err) {
      setError(err.detail || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnswer = async () => {
    if (currentInput.trim() === "") return;
    if (isListening) stopListening();

    const userAnswerText = currentInput;
    const newHistory = [
      ...chatHistory,
      { role: "user", content: userAnswerText },
    ];

    setChatHistory(newHistory);
    setCurrentInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendAnswerApi(
        { session_id: sessionId, answer_text: userAnswerText },
        token
      );

      const newBotMessages = [];
      if (response.feedback && response.feedback.improvement_points) {
        const feedbackText = response.feedback.improvement_points
          .map((p) => p.bullet)
          .join(" ");
        newBotMessages.push({ role: "feedback", content: feedbackText });
      }

      if (response.is_finished) {
        newBotMessages.push({
          role: "bot",
          content:
            "That was my last question. Thank you for your time! Generating your final report...",
        });
        setChatHistory([...newHistory, ...newBotMessages]);
        await handleFetchReport();
      } else {
        if (response.next_question) {
          newBotMessages.push({
            role: "bot",
            content: response.next_question.conversational_text,
          });
        } else {
          newBotMessages.push({
            role: "bot",
            content: "Please wait a moment...",
          });
        }
        setChatHistory([...newHistory, ...newBotMessages]);
      }
    } catch (err) {
      setError(err.detail || "An unexpected error occurred. Please try again.");
      setChatHistory(chatHistory);
      setCurrentInput(userAnswerText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchReport = async () => {
    setIsLoading(true);
    try {
      const reportData = await getReportApi(sessionId, token);
      if (reportData && reportData.final_report) {
        setFinalReport(reportData.final_report);
      } else {
        throw new Error("Report data not found in the response.");
      }
      setInterviewPhase("report");
    } catch (err) {
      setError(err.detail || "Could not fetch your report.");
      setInterviewPhase("report");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner text="Authenticating..." />
      </div>
    );
  }

  const canSubmitLobby =
    (resumeText.trim() !== "" || resumeFile !== null) &&
    jobDescriptionText.trim() !== "" &&
    !isLoading;
  const canSubmitChat =
    currentInput.trim() !== "" && !isLoading && interviewPhase === "chat";
  const activeSubmitHandler =
    interviewPhase === "lobby" ? handleStartInterview : handleSendAnswer;

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? "dark" : ""}`}>
      <GeminiSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
        {/* === HEADER === */}
        <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
          {/* Title Removed as requested */}
          <div className="flex-1"></div>

          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
                interviewPhase === "chat"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  interviewPhase === "chat"
                    ? "bg-green-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              <span>
                {interviewPhase === "lobby"
                  ? "Setup"
                  : interviewPhase === "chat"
                  ? "Live Session"
                  : "Report"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center w-full relative overflow-hidden">
          <AnimatePresence>
            {error && interviewPhase !== "report" && (
              <div className="absolute top-4 left-0 right-0 z-50 flex justify-center px-4">
                <ErrorMessage message={error} onRetry={activeSubmitHandler} />
              </div>
            )}
          </AnimatePresence>

          {/* === PHASE 1: LOBBY === */}
          {interviewPhase === "lobby" && (
            <div className="w-full h-full p-4 overflow-y-auto flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8"
              >
                <div className="text-center mb-8">
                  {/* Title and Subtitle removed as requested */}
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                    <Cpu size={32} />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Resume Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center">
                        <FileText size={16} className="mr-2" /> Resume / CV
                      </span>
                      {resumeFile && (
                        <button
                          onClick={handleFileDismiss}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center"
                        >
                          <X size={12} className="mr-1" /> Remove File
                        </button>
                      )}
                    </label>

                    <div className="relative group">
                      {!resumeFile && (
                        <div className="absolute top-3 right-3 z-10">
                          <input
                            type="file"
                            id="resume-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            accept=".pdf,.doc,.docx,.txt"
                          />
                          <label
                            htmlFor="resume-upload"
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors block"
                            title="Attach File"
                          >
                            <Paperclip size={18} />
                          </label>
                        </div>
                      )}
                      <textarea
                        rows={3}
                        value={resumeText}
                        onChange={handleTextChange}
                        disabled={isLoading || isAuthLoading || resumeFile}
                        placeholder={
                          resumeFile
                            ? `Attached: ${resumeFile.name}`
                            : "Paste your resume text here, or click the paperclip to upload..."
                        }
                        className={`w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all resize-none text-sm ${
                          resumeFile
                            ? "text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/10 border-blue-200"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Job Description Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                      <Briefcase size={16} className="mr-2" /> Job Description
                    </label>
                    <textarea
                      rows={3}
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                      disabled={isLoading}
                      placeholder="Paste the job description here..."
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all resize-none text-sm text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleStartInterview}
                    disabled={!canSubmitLobby}
                    className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="animate-spin" size={20} />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Interview</span>
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* === PHASE 2: CHAT === */}
          {interviewPhase === "chat" && (
            <>
              <div
                ref={chatContainerRef}
                className="flex-1 w-full max-w-4xl px-4 py-6 overflow-y-auto no-scrollbar space-y-2 scroll-smooth"
              >
                {chatHistory.map((msg, index) => (
                  <ChatBubble key={index} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start px-2 my-4">
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none">
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                <div className="max-w-4xl mx-auto relative">
                  <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                    {hasSupport && (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
                          isListening
                            ? "bg-red-500 text-white shadow-md animate-pulse"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                        }`}
                        title={
                          isListening ? "Stop Recording" : "Start Voice Input"
                        }
                        disabled={isLoading}
                      >
                        <Mic size={20} />
                      </button>
                    )}

                    <textarea
                      rows={1}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && canSubmitChat) {
                          e.preventDefault();
                          handleSendAnswer();
                        }
                      }}
                      disabled={isLoading}
                      placeholder="Type your answer..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 py-3 px-2 resize-none max-h-32 overflow-y-auto leading-relaxed"
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />

                    <button
                      onClick={handleSendAnswer}
                      disabled={!canSubmitChat}
                      className={`p-3 rounded-full flex-shrink-0 transition-all ${
                        canSubmitChat
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <LoaderCircle className="animate-spin" size={20} />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-2">
                    AI can make mistakes. Please review critical information.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* === PHASE 3: REPORT === */}
          {interviewPhase === "report" && (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <div className="max-w-lg w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center"
                >
                  {isLoading ? (
                    <div className="py-12">
                      <LoadingSpinner text="Compiling detailed report..." />
                    </div>
                  ) : finalReport ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                        <FileText size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Report Generated!
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Your comprehensive interview analysis has been opened in
                        a new tab.
                      </p>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-6 text-sm text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                        If you don't see the tab, please check your popup
                        blocker.
                      </div>
                      <button
                        onClick={() => {
                          setInterviewPhase("lobby");
                          setChatHistory([]);
                          setSessionId(null);
                          setFinalReport(null);
                          setError(null);
                        }}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl transition-colors"
                      >
                        Start New Session
                      </button>
                    </>
                  ) : (
                    <div className="py-8">
                      <p className="text-red-500 mb-4">
                        {error || "Could not load report."}
                      </p>
                      <button
                        onClick={handleFetchReport}
                        className="text-blue-600 hover:underline"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboardPage;
