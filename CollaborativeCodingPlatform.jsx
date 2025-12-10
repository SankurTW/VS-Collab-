import React, { useState, useEffect, useRef } from 'react';
import { Play, Users, Video, MessageSquare, Settings, Clock, Sparkles, Terminal, FileCode, Share2, Eye, EyeOff } from 'lucide-react';

// Mock Monaco Editor Component
const MonacoEditor = ({ value, onChange, language, readOnly }) => (
  <div className="relative w-full h-full bg-gray-900 font-mono text-sm">
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className="w-full h-full bg-transparent text-green-400 p-4 resize-none focus:outline-none"
      style={{ fontFamily: 'monospace' }}
      placeholder="// Start coding here..."
    />
  </div>
);

// Remote Cursor Component
const RemoteCursor = ({ user, position, color }) => (
  <div
    className="absolute pointer-events-none z-50"
    style={{
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: 'translate(-50%, -100%)'
    }}
  >
    <div className={`px-2 py-1 rounded text-xs text-white`} style={{ backgroundColor: color }}>
      {user}
    </div>
    <div className="w-0.5 h-5" style={{ backgroundColor: color }} />
  </div>
);

// Problem Statement Component
const ProblemStatement = ({ problem }) => (
  <div className="h-full overflow-y-auto p-4 bg-gray-800 text-gray-100">
    <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
    <div className="mb-4">
      <span className={`px-3 py-1 rounded text-sm ${
        problem.difficulty === 'Easy' ? 'bg-green-600' :
        problem.difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'
      }`}>
        {problem.difficulty}
      </span>
    </div>
    <div className="prose prose-invert max-w-none">
      <p className="mb-4">{problem.description}</p>
      <h3 className="text-lg font-semibold mb-2">Example:</h3>
      <pre className="bg-gray-900 p-3 rounded mb-4">
        <code>{problem.example}</code>
      </pre>
      <h3 className="text-lg font-semibold mb-2">Constraints:</h3>
      <ul className="list-disc list-inside">
        {problem.constraints.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  </div>
);

// Chat Component
const Chat = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" 
                 style={{ backgroundColor: msg.color }}>
              {msg.user[0]}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-300">{msg.user}</div>
              <div className="text-sm text-gray-100">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Output Panel Component
const OutputPanel = ({ output, testResults, isRunning }) => (
  <div className="h-full flex flex-col bg-gray-900 text-gray-100">
    <div className="flex border-b border-gray-700">
      <button className="px-4 py-2 bg-gray-800 border-r border-gray-700">Console</button>
      <button className="px-4 py-2 hover:bg-gray-800 border-r border-gray-700">Test Results</button>
    </div>
    <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
      {isRunning ? (
        <div className="flex items-center gap-2 text-yellow-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent" />
          Running code...
        </div>
      ) : (
        <>
          {output && (
            <div className="mb-4">
              <div className="text-green-400 mb-2">Output:</div>
              <pre className="text-gray-300">{output}</pre>
            </div>
          )}
          {testResults && testResults.length > 0 && (
            <div>
              <div className="text-blue-400 mb-2">Test Results:</div>
              {testResults.map((test, i) => (
                <div key={i} className={`mb-2 p-2 rounded ${test.passed ? 'bg-green-900' : 'bg-red-900'}`}>
                  <div className="font-semibold">{test.passed ? '✓' : '✗'} Test {i + 1}</div>
                  <div className="text-xs mt-1">Expected: {test.expected}</div>
                  <div className="text-xs">Got: {test.actual}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

// AI Review Panel Component
const AIReviewPanel = ({ suggestions, isLoading }) => (
  <div className="h-full overflow-y-auto p-4 bg-gray-800 text-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="w-5 h-5 text-purple-400" />
      <h3 className="text-lg font-semibold">AI Code Review</h3>
    </div>
    {isLoading ? (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent" />
        Analyzing code...
      </div>
    ) : suggestions.length > 0 ? (
      <div className="space-y-3">
        {suggestions.map((suggestion, i) => (
          <div key={i} className="p-3 bg-gray-900 rounded border-l-4 border-purple-500">
            <div className="font-semibold text-sm mb-1">{suggestion.title}</div>
            <div className="text-sm text-gray-300">{suggestion.description}</div>
            {suggestion.code && (
              <pre className="mt-2 p-2 bg-gray-950 rounded text-xs overflow-x-auto">
                <code className="text-green-400">{suggestion.code}</code>
              </pre>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-gray-400 text-sm">No suggestions yet. Write some code and click "Get AI Review"</div>
    )}
  </div>
);

// Replay Player Component
const ReplayPlayer = ({ events, onSeek }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const handleSeek = (time) => {
    setCurrentTime(time);
    onSeek(time);
  };

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className="flex-1"
        />
        <div className="text-white text-sm">{currentTime}s / 100s</div>
        <select
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          className="px-2 py-1 bg-gray-700 text-white rounded"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="2">2x</option>
          <option value="4">4x</option>
        </select>
      </div>
    </div>
  );
};

// Main Application Component
export default function CollaborativeCodingPlatform() {
  const [code, setCode] = useState('// Two Sum Problem\nfunction twoSum(nums, target) {\n  // Your code here\n}');
  const [activeUsers] = useState([
    { id: '1', name: 'Alice', color: '#3b82f6', cursor: { x: 200, y: 100 } },
    { id: '2', name: 'Bob', color: '#10b981', cursor: { x: 350, y: 150 } }
  ]);
  const [chatMessages, setChatMessages] = useState([
    { user: 'Alice', text: 'Let\'s start with a hash map approach', color: '#3b82f6' },
    { user: 'Bob', text: 'Good idea! That should be O(n)', color: '#10b981' }
  ]);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [showHiddenTests, setShowHiddenTests] = useState(false);
  const [activePanel, setActivePanel] = useState('problem');

  const problem = {
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    example: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] = 9',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Only one valid answer exists'
    ]
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setOutput('[0, 1]\nExecution time: 45ms\nMemory: 12.3 MB');
      setTestResults([
        { passed: true, expected: '[0,1]', actual: '[0,1]' },
        { passed: true, expected: '[1,2]', actual: '[1,2]' },
        { passed: false, expected: '[0,3]', actual: '[0,2]' }
      ]);
      setIsRunning(false);
    }, 2000);
  };

  const handleAIReview = () => {
    setIsAILoading(true);
    setShowAI(true);
    setTimeout(() => {
      setAiSuggestions([
        {
          title: 'Optimize with Hash Map',
          description: 'Consider using a hash map for O(n) time complexity instead of nested loops.',
          code: 'const map = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const complement = target - nums[i];\n  if (map.has(complement)) return [map.get(complement), i];\n  map.set(nums[i], i);\n}'
        },
        {
          title: 'Add Input Validation',
          description: 'Add checks for null or undefined inputs to make your solution more robust.'
        }
      ]);
      setIsAILoading(false);
    }, 1500);
  };

  const handleSendMessage = (text) => {
    setChatMessages([...chatMessages, { user: 'You', text, color: '#f59e0b' }]);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-lg">CodeCollab</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>{activeUsers.length} online</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInterviewMode(!isInterviewMode)}
            className={`px-3 py-1 rounded text-sm ${isInterviewMode ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            {isInterviewMode ? 'Interview Mode ON' : 'Practice Mode'}
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-96 border-r border-gray-700 flex flex-col">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActivePanel('problem')}
              className={`flex-1 px-4 py-2 text-sm ${activePanel === 'problem' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              Problem
            </button>
            <button
              onClick={() => setActivePanel('chat')}
              className={`flex-1 px-4 py-2 text-sm ${activePanel === 'chat' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              Chat
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {activePanel === 'problem' ? (
              <ProblemStatement problem={problem} />
            ) : (
              <Chat messages={chatMessages} onSendMessage={handleSendMessage} />
            )}
          </div>
        </div>

        {/* Editor Section */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <select className="px-3 py-1 bg-gray-700 rounded text-sm">
                <option>JavaScript</option>
                <option>Python</option>
                <option>Java</option>
                <option>C++</option>
              </select>
              {isInterviewMode && (
                <button
                  onClick={() => setShowHiddenTests(!showHiddenTests)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                >
                  {showHiddenTests ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Hidden Tests
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleAIReview}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4" />
                AI Review
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-1 px-4 py-1 bg-green-600 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Run Code
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 relative">
            <MonacoEditor
              value={code}
              onChange={setCode}
              language="javascript"
            />
            {activeUsers.map(user => (
              <RemoteCursor
                key={user.id}
                user={user.name}
                position={user.cursor}
                color={user.color}
              />
            ))}
          </div>

          {/* Output Section */}
          <div className="h-64 border-t border-gray-700">
            <OutputPanel
              output={output}
              testResults={testResults}
              isRunning={isRunning}
            />
          </div>
        </div>

        {/* Right Sidebar - AI Review */}
        {showAI && (
          <div className="w-96 border-l border-gray-700">
            <div className="h-full flex flex-col">
              <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
                <span className="font-semibold">AI Assistant</span>
                <button onClick={() => setShowAI(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <AIReviewPanel suggestions={aiSuggestions} isLoading={isAILoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}