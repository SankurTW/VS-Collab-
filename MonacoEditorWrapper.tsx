import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useCollaboration } from '../../hooks/useCollaboration';
import { setCursorPosition, setSelection } from '../../store/slices/editorSlice';
import { createInsertOp, createDeleteOp } from '../../utils/ot';
import RemoteCursors from './RemoteCursors';
import { ProgrammingLanguage } from '../../types';

interface MonacoEditorWrapperProps {
  roomId: string;
  language: ProgrammingLanguage;
  readOnly?: boolean;
}

const MonacoEditorWrapper: React.FC<MonacoEditorWrapperProps> = ({
  roomId,
  language,
  readOnly = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const dispatch = useAppDispatch();
  
  const content = useAppSelector((state) => state.editor.content);
  const remoteUsers = useAppSelector((state) => state.editor.remoteUsers);
  const { sendEdit, sendCursor, sendSelection } = useCollaboration(roomId);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Monaco', 'Menlo', monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      readOnly,
    });

    // Cursor position change listener
    editor.onDidChangeCursorPosition((e) => {
      const position = {
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      };
      dispatch(setCursorPosition(position));
      sendCursor(position);
    });

    // Selection change listener
    editor.onDidChangeCursorSelection((e) => {
      const selection = {
        startLineNumber: e.selection.startLineNumber,
        startColumn: e.selection.startColumn,
        endLineNumber: e.selection.endLineNumber,
        endColumn: e.selection.endColumn,
      };
      
      // Only send if it's a real selection (not just cursor)
      if (!e.selection.isEmpty()) {
        dispatch(setSelection(selection));
        sendSelection(selection);
      } else {
        dispatch(setSelection(null));
        sendSelection(null);
      }
    });

    // Content change listener
    editor.onDidChangeModelContent((e) => {
      if (e.changes.length === 0) return;

      // Process each change and create OT operations
      e.changes.forEach((change) => {
        const offset = editor.getModel()?.getOffsetAt({
          lineNumber: change.range.startLineNumber,
          column: change.range.startColumn,
        }) || 0;

        let operation;
        if (change.text) {
          // Insert operation
          operation = createInsertOp(offset, change.text);
        } else {
          // Delete operation
          const length = change.rangeLength;
          operation = createDeleteOp(offset, length);
        }

        sendEdit(editor.getValue(), operation);
      });
    });
  };

  const handleEditorChange: OnChange = (value, event) => {
    // Content changes are handled by onDidChangeModelContent
    // This is just a backup to ensure we have the latest content
  };

  // Apply remote cursor decorations
  useEffect(() => {
    if (!editorRef.current || !isEditorReady) return;

    const decorations: editor.IModelDeltaDecoration[] = [];
    const model = editorRef.current.getModel();
    if (!model) return;

    Object.values(remoteUsers).forEach((user) => {
      // Cursor decoration
      const cursorPos = model.getPositionAt(
        model.getOffsetAt({
          lineNumber: user.cursor.lineNumber,
          column: user.cursor.column,
        })
      );

      decorations.push({
        range: {
          startLineNumber: cursorPos.lineNumber,
          startColumn: cursorPos.column,
          endLineNumber: cursorPos.lineNumber,
          endColumn: cursorPos.column,
        },
        options: {
          className: 'remote-cursor',
          beforeContentClassName: 'remote-cursor-line',
          stickiness: editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Selection decoration
      if (user.selection) {
        decorations.push({
          range: {
            startLineNumber: user.selection.startLineNumber,
            startColumn: user.selection.startColumn,
            endLineNumber: user.selection.endLineNumber,
            endColumn: user.selection.endColumn,
          },
          options: {
            className: 'remote-selection',
            isWholeLine: false,
            inlineClassName: 'remote-selection-inline',
            stickiness: editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
    });

    const oldDecorations = editorRef.current.getModel()?.getAllDecorations() || [];
    editorRef.current.deltaDecorations(
      oldDecorations.map((d) => d.id),
      decorations
    );
  }, [remoteUsers, isEditorReady]);

  // Update editor content when it changes externally
  useEffect(() => {
    if (!editorRef.current || !isEditorReady) return;

    const currentValue = editorRef.current.getValue();
    if (currentValue !== content) {
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(content);
      if (position) {
        editorRef.current.setPosition(position);
      }
    }
  }, [content, isEditorReady]);

  return (
    <div className="relative w-full h-full">
      <Editor
        height="100%"
        language={language}
        value={content}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          readOnly,
        }}
      />
      <RemoteCursors users={Object.values(remoteUsers)} />
      <style>{`
        .remote-cursor {
          background-color: transparent;
          border-left: 2px solid var(--cursor-color, #00ff00);
        }
        
        .remote-cursor-line::before {
          content: attr(data-username);
          position: absolute;
          top: -20px;
          left: 0;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          background-color: var(--cursor-color, #00ff00);
          color: white;
          white-space: nowrap;
          z-index: 1000;
        }
        
        .remote-selection {
          background-color: var(--selection-color, rgba(0, 255, 0, 0.2));
        }
        
        .remote-selection-inline {
          background-color: var(--selection-color, rgba(0, 255, 0, 0.2));
        }
      `}</style>
    </div>
  );
};

export default MonacoEditorWrapper;