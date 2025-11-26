import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react"; // Cpu icon removed
import "./App.css";

const phrases = [
  "Prepared for the interview?",
  "Let's ace the interview!",
  "Go get 'em tiger!",
];

function App() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(75);
  const navigate = useNavigate();

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    if (!isDeleting && currentText === currentPhrase) {
      const pauseTimeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(pauseTimeout);
    } else if (isDeleting && currentText === "") {
      const pauseTimeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, 500);
      return () => clearTimeout(pauseTimeout);
    }

    const mainTimeout = setTimeout(() => {
      if (isDeleting) {
        setTypingSpeed(35);
        setCurrentText(currentPhrase.substring(0, currentText.length - 1));
      } else {
        setTypingSpeed(75);
        setCurrentText(currentPhrase.substring(0, currentText.length + 1));
      }
    }, typingSpeed);

    return () => clearTimeout(mainTimeout);
  }, [currentText, isDeleting, currentPhraseIndex, typingSpeed]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Left side: landing-promo class restored for your BG image */}
      <div className="landing-promo w-full lg:w-1/2 relative overflow-hidden flex flex-col justify-center items-center p-8 lg:p-16 text-white min-h-[40vh] lg:min-h-screen bg-no-repeat bg-cover bg-center">
        {/* Overlay for better text readability (optional, remove if your image is dark enough) */}
        <div className="absolute inset-0 bg-black/30 z-0" />

        <div className="relative z-10 w-full max-w-xl text-center lg:text-left">
          <div className="min-h-[120px] lg:min-h-[160px] flex items-center justify-center lg:justify-start">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight drop-shadow-md">
              {currentText}
              <span className="inline-block w-1 h-10 md:h-14 ml-2 bg-blue-400 animate-pulse align-middle rounded-full" />
            </h1>
          </div>
          <p className="mt-8 text-lg text-white/90 max-w-md font-medium drop-shadow-sm mx-auto lg:mx-0">
            Your personal AI coach for technical interviews. Practice, improve,
            and succeed.
          </p>
        </div>
      </div>

      {/* Right side: Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            {/* Symbol removed here */}
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              InterviewPrep
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Join thousands of candidates acing their interviews.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            <button
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center group"
              onClick={() => navigate("/signin")}
            >
              <LogIn
                className="mr-2 group-hover:scale-110 transition-transform"
                size={20}
              />
              Sign In
            </button>

            <button
              className="w-full py-4 px-6 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center group shadow-sm hover:shadow-md"
              onClick={() => navigate("/signup")}
            >
              <UserPlus
                className="mr-2 group-hover:scale-110 transition-transform"
                size={20}
              />
              Sign Up
            </button>
          </div>

          <p className="mt-10 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
