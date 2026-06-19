import React from 'react';
import Editor from '@monaco-editor/react';
import { Play, FileCode2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  themeColor?: string; // e.g., 'neonBlue', 'neonOrange', etc.
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  onLanguageChange,
  onSubmit,
  isSubmitting,
  submitLabel = 'Analyze Code',
  themeColor = 'neonBlue',
}) => {
  const getBorderColorClass = () => {
    switch (themeColor) {
      case 'neonOrange': return 'focus-within:border-neonOrange/50 focus-within:shadow-[0_0_15px_rgba(255,95,31,0.15)]';
      case 'neonRed': return 'focus-within:border-neonRed/50 focus-within:shadow-[0_0_15px_rgba(255,7,58,0.15)]';
      case 'neonPurple': return 'focus-within:border-neonPurple/50 focus-within:shadow-[0_0_15px_rgba(189,0,255,0.15)]';
      default: return 'focus-within:border-neonBlue/50 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.15)]';
    }
  };

  const getButtonBgClass = () => {
    if (isSubmitting) return 'bg-gray-800 text-gray-500 cursor-not-allowed';
    switch (themeColor) {
      case 'neonOrange': return 'bg-neonOrange hover:shadow-[0_0_15px_rgba(255,95,31,0.4)] text-black';
      case 'neonRed': return 'bg-neonRed hover:shadow-[0_0_15px_rgba(255,7,58,0.4)] text-white';
      case 'neonPurple': return 'bg-neonPurple hover:shadow-[0_0_15px_rgba(189,0,255,0.4)] text-white';
      default: return 'bg-neonBlue hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] text-black';
    }
  };

  return (
    <div className={`w-full rounded-2xl overflow-hidden glass-panel border border-gray-800 transition-all duration-300 ${getBorderColorClass()}`}>
      {/* Editor Controls */}
      <div className="px-6 py-4 bg-[#0B0F19]/90 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-300">Code Workspace</span>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-[#111827] text-sm text-gray-300 px-3 py-1.5 rounded-lg border border-gray-800 outline-none focus:border-gray-700 transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <button
            onClick={onSubmit}
            disabled={isSubmitting || !code.trim()}
            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 ${getButtonBgClass()}`}
          >
            <Play className="w-4 h-4 fill-current" />
            {isSubmitting ? 'Processing...' : submitLabel}
          </button>
        </div>
      </div>

      {/* Monaco Editor Workspace */}
      <div className="h-[480px] bg-[#0E111A]">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={onChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            fontFamily: "'JetBrains Mono', monospace",
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            contextmenu: false,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
