import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiImage, FiX, FiMic, FiMicOff, FiBook,
  FiChevronDown, FiPaperclip, FiZap,
} from 'react-icons/fi';
import AppLayout from '../components/AppLayout';
import ChatMarkdown from '../components/ChatMarkdown';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI, sessionAPI, curriculumAPI } from '../utils/api';
import toast from 'react-hot-toast';

const levels = [
  { key: 'beginner', label: 'Beginner', desc: 'Real-life analogies, simple language' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Textbook depth with diagrams' },
  { key: 'advanced', label: 'Advanced', desc: 'Exam-focused, formulas & edge cases' },
];

const samplePrompts = [
  { emoji: '🌱', text: 'Explain photosynthesis with a simple example' },
  { emoji: '📐', text: 'What is Pythagoras theorem? Show me a proof' },
  { emoji: '⚖️', text: 'Why does ice float on water?' },
  { emoji: '📜', text: 'Summarize the causes of the French Revolution' },
];

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function ConceptExplainer() {
  const { sessionId: urlSessionId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(urlSessionId || null);
  const [level, setLevel] = useState('beginner');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [showScope, setShowScope] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (user?.grade) {
      curriculumAPI.getSubjects(user.grade).then(res => setSubjects(res.data.subjects)).catch(() => {});
    }
  }, [user?.grade]);

  useEffect(() => {
    if (subject && user?.grade) {
      curriculumAPI.getChapters(user.grade, subject).then(res => setChapters(res.data.chapters)).catch(() => {});
      setChapter('');
    } else {
      setChapters([]);
    }
  }, [subject, user?.grade]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (!urlSessionId) {
      setMessages([]);
      setSessionId(null);
    }
  }, [subject]);

  useEffect(() => {
    if (urlSessionId) {
      sessionAPI.get(urlSessionId).then(res => {
        setMessages(res.data.session.messages || []);
        setSessionId(urlSessionId);
        if (res.data.session.metadata?.explanationLevel) setLevel(res.data.session.metadata.explanationLevel);
        if (res.data.session.metadata?.subject) setSubject(res.data.session.metadata.subject);
        if (res.data.session.metadata?.chapter) setChapter(res.data.session.metadata.chapter);
      }).catch(() => toast.error('Failed to load session'));
    }
  }, [urlSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition failed. Try again.');
    };

    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, []);

  const toggleVoice = () => {
    if (!SpeechRecognition) return toast.error('Voice input not supported in this browser');
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }
    setDocFile(file);
  };

  const removeDoc = () => {
    setDocFile(null);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleSend = async (overrideInput, levelOverride) => {
    const inputToSend = (overrideInput ?? input).trim();
    if (!inputToSend && !imageFile && !docFile) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    const userMessage = inputToSend;
    const useLevel = levelOverride || level;
    setInput('');
    const displayContent = userMessage || (imageFile ? '[Image uploaded]' : docFile ? `[File: ${docFile.name}]` : '');
    setMessages(prev => [...prev, { role: 'user', content: displayContent }]);
    setLoading(true);

    try {
      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('message', userMessage);
        formData.append('explanationLevel', useLevel);
        if (subject) formData.append('subject', subject);
        if (chapter) formData.append('chapter', chapter);
        if (sessionId) formData.append('sessionId', sessionId);
        response = await aiAPI.conceptExplainerImage(formData);
        removeImage();
      } else if (docFile) {
        const formData = new FormData();
        formData.append('file', docFile);
        formData.append('message', userMessage);
        formData.append('explanationLevel', useLevel);
        if (subject) formData.append('subject', subject);
        if (chapter) formData.append('chapter', chapter);
        if (sessionId) formData.append('sessionId', sessionId);
        response = await aiAPI.conceptExplainerFile(formData);
        removeDoc();
      } else {
        response = await aiAPI.conceptExplainer({
          message: userMessage,
          sessionId,
          explanationLevel: useLevel,
          subject: subject || undefined,
          chapter: chapter || undefined,
        });
      }

      setSessionId(response.data.sessionId);
      const aiText = response.data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (err) {
      toast.error('Failed to get response');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // The last real (typed) question the student asked — used to re-explain at a
  // new difficulty level when they switch Beginner/Intermediate/Advanced.
  const lastTypedQuestion = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'user' && m.content && !m.content.startsWith('[Image') && !m.content.startsWith('[File')) {
        return m.content;
      }
    }
    return null;
  };

  // Clicking a level: if the student has already asked something, re-answer that
  // SAME question at the new level. Otherwise just switch the level for the next question.
  const handleLevelChange = (newLevel) => {
    if (newLevel === level) return;
    setLevel(newLevel);
    if (loading) return;
    const lastQ = lastTypedQuestion();
    if (lastQ) handleSend(lastQ, newLevel);
  };

  // 3-4 standardized starter questions that adapt to the chosen chapter/subject.
  const quickQuestions = (() => {
    const topic = chapter || subject;
    if (!topic) return [];
    return [
      `What is ${topic}?`,
      `Explain ${topic} with a simple example`,
      `What are the key points and important factors in ${topic}?`,
      `Which important questions can come from ${topic} in exams?`,
    ];
  })();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scopeLabel = subject
    ? `${subject}${chapter ? ' · ' + (chapter.length > 22 ? chapter.substring(0, 22) + '…' : chapter) : ''}`
    : 'All subjects';

  return (
    <AppLayout activeTool="concept-explainer">
      <div className="flex flex-col h-full">
        {/* Top Control Bar */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white/70 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">Level</span>
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                {levels.map(l => {
                  const active = level === l.key;
                  return (
                    <button
                      key={l.key}
                      onClick={() => handleLevelChange(l.key)}
                      title={l.desc}
                      className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all ${
                        active
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
                      }`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowScope(!showScope)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all border ${
                subject
                  ? 'bg-primary-50 text-primary-700 border-primary-100'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-primary-200 hover:text-primary-600'
              }`}
            >
              <FiBook size={13} />
              {scopeLabel}
              <FiChevronDown size={12} className={`transition-transform ${showScope ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {showScope && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                  >
                    <option value="">All subjects</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={chapter}
                    onChange={e => setChapter(e.target.value)}
                    disabled={!subject}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none disabled:opacity-40"
                  >
                    <option value="">All chapters</option>
                    {chapters.map((ch, i) => <option key={i} value={ch}>{ch}</option>)}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center pt-8"
              >
                <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200/60 text-primary-600 items-center justify-center mb-4 shadow-sm">
                  <FiZap className="text-2xl" />
                </div>
                <h2 className="font-display font-extrabold text-xl md:text-2xl text-gray-900">
                  Ask me anything from your Class {user?.grade} syllabus
                </h2>
                <p className="mt-2 text-[13.5px] text-gray-500 max-w-md mx-auto">
                  Pick a subject + chapter for focused answers, or just ask. You can also speak, attach an image, or drop a PDF.
                </p>

                {/* Starter questions — standardized & topic-aware once a subject/chapter is picked */}
                {quickQuestions.length > 0 && (
                  <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Quick questions on {chapter || subject}
                  </p>
                )}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
                  {quickQuestions.length > 0
                    ? quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="surface surface-hover text-left px-4 py-3 flex items-start gap-3 group"
                        >
                          <span className="text-xl flex-shrink-0">{['❓', '💡', '🔑', '📝'][i] || '✨'}</span>
                          <span className="text-[13px] text-gray-700 leading-relaxed group-hover:text-gray-900">{q}</span>
                        </button>
                      ))
                    : samplePrompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(p.text)}
                          className="surface surface-hover text-left px-4 py-3 flex items-start gap-3 group"
                        >
                          <span className="text-xl flex-shrink-0">{p.emoji}</span>
                          <span className="text-[13px] text-gray-700 leading-relaxed group-hover:text-gray-900">{p.text}</span>
                        </button>
                      ))}
                </div>

                {SpeechRecognition && (
                  <p className="text-[11.5px] text-gray-400 mt-6">
                    Voice input available — tap the mic to speak your question
                  </p>
                )}
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md shadow-[0_8px_22px_-12px_rgba(46,134,193,0.55)]'
                    : 'bg-white border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] rounded-bl-md'
                }`}>
                  {msg.role === 'assistant' ? (
                    <ChatMarkdown content={msg.content} />
                  ) : (
                    <p className="text-[13.5px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-[12px] text-gray-400 font-medium">Thinking…</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Attachment previews */}
        {(imagePreview || docFile) && (
          <div className="px-5 py-2 border-t border-gray-100 bg-white/70">
            <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-2">
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="upload" className="h-16 w-16 rounded-xl object-cover border border-gray-100" />
                  <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                    <FiX size={10} />
                  </button>
                </div>
              )}
              {docFile && (
                <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                  <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary-50 text-primary-600">
                    <FiPaperclip size={12} />
                  </span>
                  <div className="text-[12px] leading-tight">
                    <p className="font-semibold text-gray-700 truncate max-w-[180px]">{docFile.name}</p>
                    <p className="text-gray-400 text-[10.5px]">{(docFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={removeDoc} className="ml-1 text-gray-400 hover:text-red-500">
                    <FiX size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="px-5 py-2 border-t border-gray-100 bg-rose-50/70">
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              <span className="text-[12px] text-rose-600 font-semibold">Listening… speak now</span>
            </div>
          </div>
        )}

        {/* Quick question chips — always handy once a topic is picked */}
        {quickQuestions.length > 0 && messages.length > 0 && (
          <div className="px-4 md:px-5 pt-2 border-t border-gray-100 bg-white">
            <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-[12px] text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-40"
                >
                  {q.length > 38 ? q.slice(0, 38) + '…' : q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 md:p-5 border-t border-gray-100 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-[0_4px_18px_-12px_rgba(15,23,42,0.18)] focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100 transition-all">
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
              <input type="file" ref={docInputRef} accept=".pdf,.txt" onChange={handleDocSelect} className="hidden" />
              <div className="flex items-center gap-0.5 pl-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                  title="Upload image"
                >
                  <FiImage className="text-lg" />
                </button>
                <button
                  onClick={() => docInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                  title="Upload file (PDF, TXT)"
                >
                  <FiPaperclip className="text-lg" />
                </button>
                {SpeechRecognition && (
                  <button
                    onClick={toggleVoice}
                    className={`p-2 rounded-xl transition-colors ${
                      isListening
                        ? 'bg-rose-100 text-rose-500 hover:bg-rose-200'
                        : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    {isListening ? <FiMicOff className="text-lg" /> : <FiMic className="text-lg" />}
                  </button>
                )}
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening…' : 'Ask anything from your syllabus…'}
                rows={1}
                className="flex-1 resize-none px-2 py-2.5 outline-none text-[14px] max-h-32 bg-transparent"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && !imageFile && !docFile)}
                className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-95 transition-opacity disabled:opacity-40 flex-shrink-0 shadow-[0_6px_16px_-8px_rgba(46,134,193,0.6)]"
                aria-label="Send"
              >
                <FiSend className="text-base" />
              </button>
            </div>
            <p className="mt-1.5 text-[10.5px] text-gray-400 text-center">
              AI can be inaccurate. Always double-check important facts.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
