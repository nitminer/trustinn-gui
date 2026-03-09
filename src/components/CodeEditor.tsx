'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Play, Code } from 'lucide-react';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  terminalOutput: string;
  toolSelected?: boolean;
  onCompile?: () => void;
  isCompiling?: boolean;
}

export default function CodeEditor({ code, language, onCodeChange, onExecute, isExecuting, terminalOutput, toolSelected = true, onCompile, isCompiling = false }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const languageOptions = [
    { value: 'c', label: 'C', defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}` },
    { value: 'cpp', label: 'C++', defaultCode: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}` },
    { value: 'java', label: 'Java', defaultCode: `public class program {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}` },
    { value: 'python', label: 'Python', defaultCode: `print("Hello, World!")` },
    { value: 'javascript', label: 'JavaScript', defaultCode: `console.log("Hello, World!");` },
    { value: 'solidity', label: 'Solidity', defaultCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    function greet() public pure returns (string memory) {
        return "Hello, World!";
    }
}` }
  ];

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Define custom theme
    monaco.editor.defineTheme('customTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#d4d4d4',
        'editorWhitespace.foreground': '#404040',
        'editorIndentGuide.background': '#404040',
        'editorLineNumber.foreground': '#858585',
      }
    });

    monaco.editor.setTheme('customTheme');

    // Configure language-specific settings
    if (language === 'c' || language === 'cpp') {
      // Add C/C++ specific snippets
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: () => {
          return {
            suggestions: [
              {
                label: 'printf',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'printf("${1:message}");',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Print formatted output'
              },
              {
                label: 'scanf',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'scanf("${1:format}", &${2:variable});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Read formatted input'
              },
              {
                label: 'main',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'int main() {\n\t${1:// code here}\n\treturn 0;\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Main function'
              },
              {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'if (${1:condition}) {\n\t${2:// code here}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement'
              },
              {
                label: 'for',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n\t${4:// code here}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop'
              }
            ]
          };
        }
      });
    } else if (language === 'java') {
      monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: () => {
          return {
            suggestions: [
              {
                label: 'System.out.println',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'System.out.println(${1:message});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Print to console'
              },
              {
                label: 'public static void main',
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: 'public static void main(String[] args) {\n\t${1:// code here}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Main method'
              },
              {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'if (${1:condition}) {\n\t${2:// code here}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement'
              }
            ]
          };
        }
      });
    } else if (language === 'python') {
      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => {
          return {
            suggestions: [
              {
                label: 'print',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'print(${1:message})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Print to console'
              },
              {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'if ${1:condition}:\n\t${2:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement'
              },
              {
                label: 'for',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop'
              },
              {
                label: 'def',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Function definition'
              }
            ]
          };
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Code className="text-blue-600 mr-2" size={20} />
          Write Your Code
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onExecute}
            disabled={isExecuting || !toolSelected}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            title={!toolSelected ? 'Please select a tool first' : ''}
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Execute
              </>
            )}
          </button>
          {onCompile && (
            <button
              onClick={onCompile}
              disabled={isCompiling}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              title="Compile code"
            >
              {isCompiling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Compiling...
                </>
              ) : (
                <>
                  <Code size={16} />
                  Compile
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden ">
        <Editor
          height="400px"
          
          language={language}
          value={code}
          onChange={(value) => onCodeChange(value || '')}
          onMount={handleEditorDidMount}
          loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
          options={{
            minimap: { enabled: false },
            padding: { top: 5, bottom: 5 , },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: language === 'python' ? 4 : 2,
            insertSpaces: true,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            parameterHints: {
              enabled: true
            },
            hover: {
              enabled: true
            },
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorBlinking: 'blink',
            renderWhitespace: 'selection',
            bracketPairColorization: {
              enabled: true
            }
          }}
          theme="customTheme"
        />
      </div>
    </div>
  );
}