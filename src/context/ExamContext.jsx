import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { calculateCategoryScores } from '../lib/saw'

const ExamContext = createContext({})

export const useExam = () => useContext(ExamContext)

export const ExamProvider = ({ children }) => {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [examId, setExamId] = useState(null)
  const [packageId, setPackageId] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [duration, setDuration] = useState(3600) // Base duration in seconds

  // Reference for stable background interval checks
  const isActiveRef = useRef(isActive)
  const endTimeRef = useRef(endTime)

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { endTimeRef.current = endTime }, [endTime])

  // Background auto-submit checker (doesn't trigger rapid UI re-renders!)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isActiveRef.current || !endTimeRef.current) return;
      
      const timeRemaining = new Date(endTimeRef.current).getTime() - Date.now();
      // If timeRemaining reaches 0 securely
      if (timeRemaining <= 0) {
        setIsActive(false);
        if (typeof window !== 'undefined' && window.autoSubmitExam) {
          window.autoSubmitExam();
        }
      }
    }, 2000); // Check every 2 seconds quietly
    
    return () => clearInterval(interval);
  }, []);

  // Save exam state to localStorage securely to allow tab resume
  useEffect(() => {
    if (isActive && examId && endTime) {
      const state = {
        version: 2,
        packageId,
        answers,
        currentIndex: currentQuestionIndex,
        examId,
        startTime,
        endTime,
        duration
      }
      localStorage.setItem('examState', JSON.stringify(state))
    }
  }, [answers, currentQuestionIndex, isActive, examId, packageId, startTime, endTime, duration])

  // Get strict remaining time locally without reliance on a ticking state
  const getRemainingTime = () => {
    if (!endTime) return 0;
    return Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  }

  // Initialize or RESUME exam
  const startExam = (examQuestions, upcomingPackageId, inputDuration = 3600) => {
    // 1. Try to recover an active session
    const savedState = localStorage.getItem('examState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Protect from old cache crashes (version 1 used timeLeft)
        if (parsed.version === 2 && parsed.packageId === upcomingPackageId) {
          const endTimestamp = new Date(parsed.endTime).getTime();
          // Check if time hasn't completely elapsed
          if (Date.now() < endTimestamp - 2000) {
            console.log('ExamContext: Resuming existing exam session from tab/refresh');
            setQuestions(examQuestions);
            setAnswers(parsed.answers || {});
            setCurrentQuestionIndex(parsed.currentIndex || 0);
            setExamId(parsed.examId);
            setPackageId(parsed.packageId);
            setStartTime(parsed.startTime);
            setEndTime(parsed.endTime);
            setDuration(parsed.duration || inputDuration);
            setIsActive(true);
            return;
          }
        }
      } catch (err) {
        console.warn('ExamContext: Failed to parse state cache, starting fresh.', err);
      }
    }

    // 2. Start a fresh new exam
    console.log('ExamContext: Starting fresh exam');
    setQuestions(examQuestions);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setPackageId(upcomingPackageId);
    setDuration(inputDuration);
    
    const nowISO = new Date();
    setStartTime(nowISO.toISOString());
    const newEndTime = new Date(nowISO.getTime() + inputDuration * 1000).toISOString();
    setEndTime(newEndTime);
    
    setExamId(`exam_${Date.now()}`);
    setIsActive(true);
  }

  const setAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }

  const isAnswered = (questionId) => answers[questionId] !== undefined;

  const getAnsweredCount = () => Object.keys(answers).length;

  const finishExam = () => {
    setIsActive(false)
    const finalFinishTime = new Date().toISOString();
    let usedDurationSecs = duration - getRemainingTime();
    
    const scores = calculateCategoryScores(questions, answers)
    
    const examResult = {
      id: examId,
      startTime,
      endTime: finalFinishTime,
      duration: usedDurationSecs,
      questions: questions.length,
      answered: getAnsweredCount(),
      scores,
      answers
    }
    
    localStorage.removeItem('examState')
    return examResult
  }

  const clearExam = () => {
    setQuestions([])
    setAnswers({})
    setCurrentQuestionIndex(0)
    setIsActive(false)
    setExamId(null)
    setPackageId(null)
    setStartTime(null)
    setEndTime(null)
    localStorage.removeItem('examState')
  }

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const value = {
    questions,
    answers,
    currentQuestionIndex,
    isActive,
    examId,
    endTime,
    duration,
    
    startExam,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    finishExam,
    clearExam,
    
    isAnswered,
    getAnsweredCount,
    getRemainingTime,
    formatTime,
    
    currentQuestion: questions[currentQuestionIndex],
    totalQuestions: questions.length
  }

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  )
}