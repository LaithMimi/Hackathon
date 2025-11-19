import React, { useEffect, useState } from 'react';
import './App.css';
import { BookOpen, FileText, GraduationCap, Calendar, Pencil, FolderOpen, MessageSquare, Send, X, ChevronRight } from 'lucide-react';

const BASE_URL = 'https://your-api-url.com';
const USE_MOCKS = true;
const MOCK_COURSES = [
  { id: 'cs101', name: 'Introduction to Computer Science', code: 'CS101' },
  { id: 'cs201', name: 'Data Structures & Algorithms', code: 'CS201' },
  { id: 'ee101', name: 'Circuits I', code: 'EE101' },
  { id: 'me210', name: 'Statics', code: 'ME210' },
  { id: 'ba120', name: 'Principles of Marketing', code: 'BA120' },
  { id: 'cs310', name: 'Operating Systems', code: 'CS310' },
];
const buildMockFiles = (course, categoryId) => {
  const names = {
    'past-papers': 'Past Paper',
    'slides': 'Lecture Slides',
    'homeworks': 'Homework',
    'other': 'Resource',
  };
  const base = names[categoryId] || 'Material';
  const today = new Date();
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      id: `${course.id}-${categoryId}-${i + 1}`,
      label: `${base} ${i + 1} · ${course.code || course.id}`,
      url: '#',
      date: `${d.getFullYear()}-${mm}-${dd}`,
    };
  });
};
const mockAsk = ({ course, categoryId, question }) => {
  const tips = [
    'Focus on understanding core concepts before memorizing details.',
    'Practice with previous materials to identify weak spots.',
    'Summarize each topic in your own words.',
  ];
  return `About ${course.name} (${categoryId || 'general'}):\n\nQ: ${question}\n\nA: Consider breaking the problem down into smaller parts. ${tips[Math.floor(Math.random() * tips.length)]}`;
};

const App = () => {
  // Initial setup modal
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Course selection
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Files
  const [files, setFiles] = useState([]);

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [error, setError] = useState('');

  const majors = ['Software Engineering', 'Data Science', 'Cybersecurity', 'Artificial Intelligence'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const categories = [
    { id: 'past-papers', name: 'Past Papers', icon: FileText, color: '#667eea' },
    { id: 'slides', name: 'Lecture Slides', icon: BookOpen, color: '#764ba2' },
    { id: 'homeworks', name: 'Assignments', icon: Pencil, color: '#f093fb' },
    { id: 'other', name: 'Course Resources', icon: FolderOpen, color: '#48bb78' }
  ];

  useEffect(() => {
    if (selectedMajor && selectedYear && !showSetupModal) {
      if (USE_MOCKS) {
        setCourses(MOCK_COURSES);
      } else {
        fetch(`${BASE_URL}/courses`)
          .then((res) => res.json())
          .then((data) => setCourses(data))
          .catch(() => setError('Failed to load courses.'));
      }
    }
  }, [selectedMajor, selectedYear, showSetupModal]);

  useEffect(() => {
    if (selectedCategory && selectedCourse) {
      if (USE_MOCKS) {
        setFiles(buildMockFiles(selectedCourse, selectedCategory.id));
      } else {
        fetch(`${BASE_URL}/courses/${selectedCourse.id}/files?category=${selectedCategory.id}`)
          .then((res) => res.json())
          .then((data) => setFiles(data))
          .catch(() => setError('Failed to load files.'));
      }
    }
  }, [selectedCategory, selectedCourse]);

  const handleSetupComplete = () => {
    if (!selectedMajor || !selectedYear) {
      setError('Please select both major and year.');
      return;
    }
    setShowSetupModal(false);
    setError('');
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowCategoryModal(true);
    setSelectedCategory(null);
    setFiles([]);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };

  const handleAsk = () => {
    if (!selectedCourse) {
      setError('Please select a course first.');
      return;
    }
    if (!question.trim()) return;

    const userMessage = { role: 'user', content: question };
    setChatHistory((prev) => [...prev, userMessage]);
    setLoadingAnswer(true);
    setError('');
    if (USE_MOCKS) {
      const q = question;
      setQuestion('');
      setTimeout(() => {
        const content = mockAsk({ course: selectedCourse, categoryId: selectedCategory?.id, question: q });
        const botMessage = { role: 'assistant', content };
        setChatHistory((prev) => [...prev, botMessage]);
        setLoadingAnswer(false);
      }, 600);
    } else {
      fetch(`${BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          course_id: selectedCourse.id, 
          category: selectedCategory?.id,
          question 
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const botMessage = { role: 'assistant', content: data.answer || 'No answer received.' };
          setChatHistory((prev) => [...prev, botMessage]);
          setQuestion('');
        })
        .catch(() => setError('AI failed to respond.'))
        .finally(() => setLoadingAnswer(false));
    }
  };

  const handleBackToCourses = () => {
    setSelectedCategory(null);
    setFiles([]);
    setSelectedCourse(null);
    setChatHistory([]);
  };

  return (
    <div className="app">
      {/* Setup Modal */}
      {showSetupModal && (
        <div className="modal-overlay">
          <div className="modal setup-modal">
            <div className="modal-header">
              <GraduationCap size={48} className="modal-icon" />
              <h2>Welcome to CourseHub</h2>
              <p>Let's get you started with your courses</p>
            </div>
            
            <div className="modal-content">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>
                  <BookOpen size={20} />
                  Select Your Major
                </label>
                <select 
                  value={selectedMajor} 
                  onChange={(e) => setSelectedMajor(e.target.value)}
                  className="modal-select"
                >
                  <option value="">Choose your major</option>
                  {majors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={20} />
                  Select Your Year
                </label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="modal-select"
                >
                  <option value="">Choose your year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button className="btn-primary" onClick={handleSetupComplete}>
                Get Started
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal category-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
              <X size={24} />
            </button>
            
            <div className="modal-header">
              <h2>{selectedCourse.name}</h2>
              <p>What would you like to access?</p>
            </div>
            
            <div className="category-grid">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.id}
                    className="category-card"
                    onClick={() => handleCategorySelect(category)}
                    style={{ '--category-color': category.color }}
                  >
                    <div className="category-icon">
                      <Icon size={32} />
                    </div>
                    <h3>{category.name}</h3>
                    <div className="category-arrow">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showSetupModal && (
        <>
          <header className="header">
            <div className="header-content">
              <div className="logo">
                <BookOpen size={32} />
                <span>CourseHub</span>
              </div>
              <div className="header-info">
                <span className="info-tag">{selectedMajor}</span>
                <span className="info-tag">{selectedYear}</span>
              </div>
            </div>
          </header>

          {showChat ? (
            <div className="split-container chat-open">
              <main className="main-content">
                {selectedCategory ? (
                  // Files View
                  <div className="files-view">
                  <div className="view-header">
                    <button className="btn-back" onClick={handleBackToCourses}>
                      <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                      Back to Courses
                    </button>
                    <div className="view-title">
                      <h1>{selectedCourse.name}</h1>
                      <p className="category-badge" style={{ color: selectedCategory.color }}>
                        {selectedCategory.name}
                      </p>
                    </div>
                  </div>

                  {files.length > 0 ? (
                    <div className="files-grid">
                      {files.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-card"
                        >
                          <div className="file-icon">
                            <FileText size={24} />
                          </div>
                          <div className="file-info">
                            <h3>{file.label}</h3>
                            {file.date && <span className="file-date">{file.date}</span>}
                          </div>
                          <ChevronRight size={20} className="file-arrow" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FolderOpen size={64} />
                      <h3>No files available</h3>
                      <p>Check back later for updates</p>
                    </div>
                  )}
                </div>
              ) : (
                // Courses View
                <div className="courses-view">
                  <div className="view-header">
                    <h1>Your Courses</h1>
                    <p>Select a course to explore materials</p>
                  </div>

                  <div className="courses-grid">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="course-card"
                        onClick={() => handleCourseClick(course)}
                      >
                        <div className="course-icon-wrapper">
                          <BookOpen size={48} />
                        </div>
                        <h3>{course.name}</h3>
                        <p className="course-code">{course.code || 'Course Materials'}</p>
                        <div className="course-overlay">
                          <span>Explore Materials</span>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </main>

              {/* Chat Panel - Right Side */}
              <aside className="chat-panel">
                <div className="chat-header">
                  <div>
                    <h3>AI Assistant</h3>
                    <p>Ask about {selectedCategory?.name}</p>
                  </div>
                  <button onClick={() => setShowChat(false)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="chat-messages">
                  {chatHistory.length === 0 ? (
                    <div className="chat-empty">
                      <MessageSquare size={48} />
                      <p>Ask me anything about these materials</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div key={i} className={`chat-message ${msg.role}`}>
                        <div className="message-avatar">
                          {msg.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-content">{msg.content}</div>
                      </div>
                    ))
                  )}
                  {loadingAnswer && (
                    <div className="chat-message assistant">
                      <div className="message-avatar">🤖</div>
                      <div className="message-content typing">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-input">
                  <input
                    type="text"
                    placeholder="Ask about the materials..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  />
                  <button onClick={handleAsk} disabled={!question.trim()}>
                    <Send size={20} />
                  </button>
                </div>
              </aside>
            </div>
          ) : (
            <main className="main-content">
              {selectedCategory ? (
                // Files View
                <div className="files-view">
                  <div className="view-header">
                    <button className="btn-back" onClick={handleBackToCourses}>
                      <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                      Back to Courses
                    </button>
                    <div className="view-title">
                      <h1>{selectedCourse?.name || 'Your Courses'}</h1>
                      {selectedCategory && (
                        <p className="category-badge" style={{ color: selectedCategory.color }}>
                          {selectedCategory.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* keep same body as above */}
                  {files.length > 0 ? (
                    <div className="files-grid">
                      {files.map((file) => (
                        <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="file-card">
                          <div className="file-icon"><FileText size={24} /></div>
                          <div className="file-info">
                            <h3>{file.label}</h3>
                            {file.date && <span className="file-date">{file.date}</span>}
                          </div>
                          <ChevronRight size={20} className="file-arrow" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FolderOpen size={64} />
                      <h3>No files available</h3>
                      <p>Check back later for updates</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="courses-view">
                  <div className="view-header">
                    <h1>Your Courses</h1>
                    <p>Select a course to explore materials</p>
                  </div>
                  <div className="courses-grid">
                    {courses.map((course) => (
                      <div key={course.id} className="course-card" onClick={() => handleCourseClick(course)}>
                        <div className="course-icon-wrapper"><BookOpen size={48} /></div>
                        <h3>{course.name}</h3>
                        <p className="course-code">{course.code || 'Course Materials'}</p>
                        <div className="course-overlay"><span>Explore Materials</span><ChevronRight size={20} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          )}

          {/* Chatbot FAB */}
          {selectedCategory && !showChat && (
            <button className="chat-fab" onClick={() => setShowChat(true)}>
              <MessageSquare size={24} />
            </button>
          )}
        </>
      )}

      
    </div>
  );
};

export default App;