import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import GeminiSidebar from "../components/GeminiSidebar.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
// --- 1. IMPORT YOUR REAL API FUNCTIONS ---
import {
  startInterviewApi,
  sendAnswerApi,
  getReportApi,
} from "../services/interviewApi.js";
// TODO: You still need your resume upload function (if you use it)
// import { uploadResume } from '../services/sessionApi.js';
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

// --- (ChatBubble component is unchanged) ---
const ChatBubble = ({ message }) => {
  const { isDark } = useTheme();
  const isBot = message.role === "bot";
  const isFeedback = message.role === "feedback";

  if (isFeedback) {
    return (
      <div className="my-2 flex justify-center">
        <div
          className={`text-xs p-2 px-3 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 flex items-center`}
        >
          <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} my-2`}>
      <div
        className={`p-3 rounded-2xl max-w-lg ${
          isBot
            ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none"
            : "bg-blue-500 text-white rounded-br-none"
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

// --- ADD THIS HELPER FUNCTION ---
// This function builds the final HTML string from your template
function generateReportHtml(data) {
  const createListItems = (items) => {
    // Ensure items is an array
    if (!Array.isArray(items)) return "";
    return items.map((item) => `<li>${item}</li>`).join("");
  };

  const createQuestionSections = (questions) => {
    // Ensure questions is an array before mapping
    if (!Array.isArray(questions)) {
      console.warn("question_breakdown is not an array:", questions);
      return ""; // Return an empty string if data is not as expected
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

  // Your HTML template as a template literal
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
  const navigate = useNavigate();

  // === GENERAL STATE ===
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- (State for final report is unchanged) ---
  const [finalReport, setFinalReport] = useState(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // --- ADD THIS useEffect HOOK ---
  useEffect(() => {
    // This effect runs when `finalReport` is set and the phase is 'report'
    if (finalReport && interviewPhase === "report") {
      try {
        const finalHtml = generateReportHtml(finalReport);
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(finalHtml);
          newWindow.document.close();
        } else {
          // Fallback if popups are blocked
          alert("Please allow popups to view your report.");
        }
      } catch (error) {
        console.error("Failed to build report HTML:", error);
        setError(
          "Report data was fetched, but the HTML template failed to build."
        );
      }
    }
  }, [finalReport, interviewPhase]); // Dependencies: only run when these change

  // --- (Lobby helper functions are unchanged) ---
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

  // --- API FUNCTIONS ---

  /**
   * --- (This function is unchanged) ---
   * Step 1 - Starts the interview
   */
  const handleStartInterview = async () => {
    setError(null);
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
        // TODO: Implement your file upload logic here if needed
        // For now, we just simulate it as your BE accepts text
        console.log("Simulating file upload and text extraction...");
        // const uploadResponse = await uploadResume(resumeFile, token);
        // resumeData = uploadResponse.extracted_text;
        resumeData = `Uploaded file: ${resumeFile.name}. (This is a placeholder, actual text extraction needed if you support files)`;
      }

      // --- REAL API CALL ---
      const response = await startInterviewApi(
        {
          resume_text: resumeData,
          job_description_text: jobDescriptionText,
        },
        token
      );
      // --- END REAL API CALL ---

      setSessionId(response.session_id);
      setChatHistory([{ role: "bot", content: response.first_question }]);
      setInterviewPhase("chat"); // <-- This is the magic!

      setResumeText("");
      setJobDescriptionText("");
      setResumeFile(null);
    } catch (err) {
      setError(err.detail || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * --- (This function is unchanged) ---
   * Step 2 - Handles the main chat loop
   */
  const handleSendAnswer = async () => {
    if (currentInput.trim() === "") return;

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
      // --- REAL API CALL ---
      const response = await sendAnswerApi(
        {
          session_id: sessionId,
          answer_text: userAnswerText,
        },
        token
      );
      // --- END REAL API CALL ---

      const newBotMessages = [];
      // 1. Add feedback, if any
      if (response.feedback && response.feedback.improvement_points) {
        const feedbackText = response.feedback.improvement_points
          .map((p) => p.bullet)
          .join(" ");
        newBotMessages.push({ role: "feedback", content: feedbackText });
      }

      // 2. Add next question OR fetch the report
      if (response.is_finished) {
        newBotMessages.push({
          role: "bot",
          content:
            "That was my last question. Thank you for your time! Generating your final report...",
        });
        setChatHistory([...newHistory, ...newBotMessages]);

        // --- (This call is unchanged) ---
        await handleFetchReport(); // This will also set the phase to 'report'
      } else {
        if (response.next_question) {
          newBotMessages.push({
            role: "bot",
            content: response.next_question.conversational_text,
          });
        } else {
          // Fallback in case is_finished is false but next_question is null
          newBotMessages.push({
            role: "bot",
            content: "Please wait a moment...",
          });
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
   * --- MODIFY THIS FUNCTION ---
   * (Fetches report and saves the WHOLE JSON object)
   */
  const handleFetchReport = async () => {
    setIsLoading(true); // Keep spinner active
    try {
      const reportData = await getReportApi(sessionId, token);

      // --- THIS IS THE FIX ---
      // The API returns the state, and the report is nested.
      // We must extract the 'final_report' object.
      if (reportData && reportData.final_report) {
        setFinalReport(reportData.final_report); // Save the NESTED report object
      } else {
        // Handle cases where the report object is missing
        console.error("Report data is missing from API response:", reportData);
        throw new Error("Report data not found in the response.");
      }
      // --- END FIX ---

      setInterviewPhase("report"); // Change the UI to show the report
    } catch (err) {
      setError(err.detail || "Could not fetch your report.");
      // Even if report fails, keep the phase as 'report' to show the error
      setInterviewPhase("report");
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

  // (This logic is unchanged)
  const canSubmitLobby =
    (resumeText.trim() !== "" || resumeFile !== null) &&
    jobDescriptionText.trim() !== "" &&
    !isLoading &&
    !isAuthLoading;
  const canSubmitChat =
    currentInput.trim() !== "" &&
    !isLoading &&
    !isAuthLoading &&
    interviewPhase === "chat";

  const activeSubmitHandler =
    interviewPhase === "lobby" ? handleStartInterview : handleSendAnswer;
  const canSubmit = interviewPhase === "lobby" ? canSubmitLobby : canSubmitChat;

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? "dark" : ""}`}>
      <GeminiSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="flex-1 flex flex-col items-center w-full px-4 pb-4 overflow-y-auto">
          {/* --- (Conditional UI logic is unchanged) --- */}

          {/* --- LOBBY UI (Unchanged) --- */}
          {interviewPhase === "lobby" && (
            <div className="w-full max-w-4xl mx-auto flex flex-col justify-between h-full">
              <div className="pt-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 dark:from-slate-200 dark:via-slate-400 dark:to-slate-200 mb-4">
                    Hello, {user?.firstName || "Candidate"}.
                  </h1>
                  <h2 className="text-4xl font-semibold text-slate-500 dark:text-slate-400">
                    Ready to start your interview?
                  </h2>
                </motion.div>
              </div>
            </div>
          )}

          {/* --- CHAT UI (Unchanged) --- */}
          {interviewPhase === "chat" && (
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

          {/* --- UPDATED REPORT UI --- */}
          {interviewPhase === "report" && (
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
                  className="bg-green-100 dark:bg-green-900/50 p-6 rounded-lg shadow-md text-center"
                >
                  {/* This block replaces the <pre> tag */}
                  <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Your report has been generated and opened in a new tab.
                  </h2>
                  <p className="text-green-700 dark:text-green-300 mt-2">
                    If the tab did not open, please check your browser's popup
                    blocker.
                  </p>
                  <button
                    onClick={() => {
                      // Reset state to go back to the lobby
                      setInterviewPhase("lobby");
                      setChatHistory([]);
                      setSessionId(null);
                      setFinalReport(null);
                      setError(null);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Start New Interview
                  </button>
                </motion.div>
              ) : (
                // This will show if `finalReport` is null and not loading (i.e., an error)
                <p className="text-red-500">
                  {error || "Could not load report."}
                </p>
              )}
            </div>
          )}

          {/* --- BOTTOM INPUT BAR (Unchanged) --- */}
          <div className="mt-auto w-full pt-4 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full"
            >
              {error && interviewPhase !== "report" && (
                <ErrorMessage message={error} onRetry={activeSubmitHandler} />
              )}

              {/* --- LOBBY INPUTS (Unchanged) --- */}
              {interviewPhase === "lobby" && (
                <>
                  {resumeFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 ml-2 flex"
                    >
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-2 flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-300" />
                        <span className="text-slate-800 dark:text-white font-medium">
                          {resumeFile.name}
                        </span>
                        <button
                          onClick={handleFileDismiss}
                          className="ml-2 p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {/* Resume Text Area (Unchanged) */}
                  <div className="relative mb-3">
                    <textarea
                      rows="1"
                      value={resumeText}
                      onChange={handleTextChange}
                      disabled={isLoading || isAuthLoading || resumeFile}
                      placeholder={
                        resumeFile
                          ? "File attached. Now add the job description."
                          : "Paste resume, or upload a file..."
                      }
                      className="w-full pl-12 pr-12 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:cursor-not-allowed max-h-36 overflow-y-auto"
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                      {!resumeText && !isLoading && (
                        <>
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
                            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <Paperclip className="w-5 h-5" />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Job Description Text Area (Unchanged) */}
                  <div className="relative">
                    <textarea
                      rows="1"
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                      disabled={isLoading || isAuthLoading}
                      placeholder="Paste the job description here..."
                      className="w-full pl-12 pr-24 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:cursor-not-allowed max-h-36 overflow-y-auto"
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                    {/* --- LOBBY SUBMIT BUTTON (Unchanged) --- */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <button
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        disabled={
                          isLoading ||
                          isAuthLoading ||
                          interviewPhase === "finished"
                        }
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        onClick={activeSubmitHandler}
                        disabled={!canSubmit}
                        className="p-2 rounded-full bg-blue-500 text-white transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? (
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* --- CHAT INPUT (Unchanged) --- */}
              {interviewPhase === "chat" && (
                <div className="relative">
                  <textarea
                    rows="1"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    disabled={isLoading || isAuthLoading}
                    placeholder={"Type your answer..."}
                    className="w-full pl-12 pr-24 py-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:cursor-not-allowed max-h-36 overflow-y-auto"
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                        e.preventDefault();
                        activeSubmitHandler();
                      }
                    }}
                  />
                  {/* --- CHAT SUBMIT BUTTON (Unchanged) --- */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <button
                      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      disabled={isLoading || isAuthLoading}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      onClick={activeSubmitHandler}
                      disabled={!canSubmit}
                      className="p-2 rounded-full bg-blue-500 text-white transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* --- (Footer logic is unchanged) --- */}
              {interviewPhase !== "report" && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 px-4">
                  This is an AI-powered interview system. Your responses will be
                  recorded and analyzed.
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
