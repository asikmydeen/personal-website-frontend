import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';
import { Button } from './button';

/**
 * Rich text editor component using contentEditable
 *
 * @param {Object} props - Component props
 * @param {string} props.content - Initial HTML content
 * @param {Function} props.onChange - Callback for content changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
const RichTextEditor = ({ content = '', onChange, placeholder = 'Write something...', className = '' }) => {
  const editorRef = useRef(null);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  // Handle content changes
  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Execute formatting command
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  // Formatting button component
  const FormatButton = ({ command, icon, title }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => execCommand(command)}
      className="h-8 px-2"
      title={title}
    >
      {icon}
    </Button>
  );

  return (
    <div className={`border rounded-md shadow-sm ${className}`}>
      <div className="flex flex-wrap border-b p-1 gap-1 bg-white dark:bg-gray-900">
        <FormatButton
          command="bold"
          icon={<Bold className="h-4 w-4" />}
          title="Bold"
        />
        <FormatButton
          command="italic"
          icon={<Italic className="h-4 w-4" />}
          title="Italic"
        />
        <FormatButton
          command="underline"
          icon={<Underline className="h-4 w-4" />}
          title="Underline"
        />

        <div className="h-full mx-1 w-px bg-gray-200 dark:bg-gray-700" />

        <FormatButton
          command="insertUnorderedList"
          icon={<List className="h-4 w-4" />}
          title="Bullet List"
        />
        <FormatButton
          command="insertOrderedList"
          icon={<ListOrdered className="h-4 w-4" />}
          title="Ordered List"
        />

        <div className="h-full mx-1 w-px bg-gray-200 dark:bg-gray-700" />

        <FormatButton
          command="justifyLeft"
          icon={<AlignLeft className="h-4 w-4" />}
          title="Align Left"
        />
        <FormatButton
          command="justifyCenter"
          icon={<AlignCenter className="h-4 w-4" />}
          title="Align Center"
        />
        <FormatButton
          command="justifyRight"
          icon={<AlignRight className="h-4 w-4" />}
          title="Align Right"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter the URL', 'https://');
            if (url) execCommand('createLink', url);
          }}
          className="h-8 px-2"
          title="Insert Link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable="true"
        className="prose prose-sm focus:outline-none min-h-[100px] p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        onInput={handleInput}
        onBlur={handleInput}
        placeholder={placeholder}
        dangerouslySetInnerHTML={content ? { __html: content } : undefined}
      />
    </div>
  );
};

export default RichTextEditor;
