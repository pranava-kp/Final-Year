// frontend/src/hooks/useWebSpeech.js
import { useState, useEffect, useRef } from 'react';

const useWebSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    // 1. Check if browser supports the API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;      // Keep listening even if user pauses
      recognition.interimResults = true;  // Show results while speaking (typing effect)
      recognition.lang = 'en-US';

      // 2. Event Handlers
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        let currentTranscript = "";
        // --- THE FIX IS HERE ---
        // Loop from 0 to length (instead of resultIndex) to construct 
        // the FULL transcript of the current session.
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 3. Control Functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript(""); // Clear old transcript for a new turn
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    hasSupport: !!recognitionRef.current 
  };
};

export default useWebSpeech;