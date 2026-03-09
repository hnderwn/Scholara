import { createContext, useContext, useState, useEffect } from 'react'
import { calculateCategoryScores } from '../lib/saw'

const ExamContext = createContext({})

export const useExam = () => useContext(ExamContext)

export const ExamProvider = ({ children }) => {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(3600) // 60 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [examId, setExamId] = useState(null)
  const [startTime, setStartTime] = useState(null)

  // Load saved exam state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('examState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setAnswers(parsed.answers || {})
        setCurrentQuestionIndex(parsed.currentIndex || 0)
        setTimeLeft(parsed.timeLeft || 3600)
        setExamId(parsed.examId || null)
        setStartTime(parsed.startTime || null)
      } catch (error) {
        console.error('Error loading exam state:', error)
      }
    }
  }, [])

  // Save exam state to localStorage
  useEffect(() => {
    if (isActive) {
      const state = {
        answers,
        currentIndex: currentQuestionIndex,
        timeLeft,
        examId,
        startTime
      }
      localStorage.setItem('examState', JSON.stringify(state))
    }
  }, [answers, currentQuestionIndex, timeLeft, isActive, examId, startTime])

  // Timer countdown
  useEffect(() => {
    let interval = null
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      // Auto-submit when time runs out
      if (typeof window !== 'undefined' && window.autoSubmitExam) {
        window.autoSubmitExam()
      }
    }
    
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  // Initialize exam
  const startExam = (examQuestions, duration = 3600) => {
    setQuestions(examQuestions)
    setTimeLeft(duration)
    setIsActive(true)
    setStartTime(new Date().toISOString())
    setExamId(`exam_${Date.now()}`)
    setAnswers({})
    setCurrentQuestionIndex(0)
  }

  // Set answer for a question
  const setAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  // Navigate to question
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
    }
  }

  // Next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // Previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  // Check if question is answered
  const isAnswered = (questionId) => {
    return answers[questionId] !== undefined
  }

  // Get answered count
  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  // Finish exam and calculate results
  const finishExam = () => {
    setIsActive(false)
    const endTime = new Date().toISOString()
    
    // Calculate scores
    const scores = calculateCategoryScores(questions, answers)
    
    const examResult = {
      id: examId,
      startTime,
      endTime,
      duration: 3600 - timeLeft,
      questions: questions.length,
      answered: getAnsweredCount(),
      scores,
      answers
    }
    
    // Clear saved state
    localStorage.removeItem('examState')
    
    return examResult
  }

  // Clear exam state
  const clearExam = () => {
    setQuestions([])
    setAnswers({})
    setCurrentQuestionIndex(0)
    setTimeLeft(3600)
    setIsActive(false)
    setExamId(null)
    setStartTime(null)
    localStorage.removeItem('examState')
  }

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const value = {
    // State
    questions,
    answers,
    currentQuestionIndex,
    timeLeft,
    isActive,
    examId,
    startTime,
    
    // Actions
    startExam,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    finishExam,
    clearExam,
    
    // Helpers
    isAnswered,
    getAnsweredCount,
    formatTime,
    
    // Current question
    currentQuestion: questions[currentQuestionIndex],
    totalQuestions: questions.length
  }

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  )
}