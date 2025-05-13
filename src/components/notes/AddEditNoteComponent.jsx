import React, { useState, useEffect } from 'react';
import { createNote, updateNote } from '../../services/notesService';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';

const AddEditNoteComponent = ({ noteData, onClose, onSaveSuccess }) => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configure the WYSIWYG editor
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      Link.configure({ openOnClick: false })
    ],
    content: '',
  });

  useEffect(() => {
    if (noteData && noteData.id) {
      setTitle(noteData.title || '');
      setTags(Array.isArray(noteData.tags) ? noteData.tags.join(', ') : '');

      // Set the editor content if editor is ready
      if (editor && noteData.content) {
        editor.commands.setContent(noteData.content);
      }
    } else {
      // Reset fields for new note
      setTitle('');
      setTags('');
      if (editor) {
        editor.commands.setContent('');
      }
    }
  }, [noteData, editor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const noteContent = editor ? editor.getHTML() : '';
      const noteDataToSave = {
        title,
        content: noteContent,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      let response;
      if (noteData && noteData.id) {
        response = await updateNote(noteData.id, noteDataToSave);
      } else {
        response = await createNote(noteDataToSave);
      }

      if (response.success && response.data) {
        if (typeof onSaveSuccess === 'function') {
          onSaveSuccess(response.data);
        }
      } else {
        setError(response.error || `Failed to ${noteData && noteData.id ? 'update' : 'add'} note.`);
      }
    } catch (err) {
      setError(`An unexpected error occurred while ${noteData && noteData.id ? 'updating' : 'creating'} the note.`);
      console.error('Save note error:', err);
    }

    setLoading(false);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title*</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
            placeholder="Note Title"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content*</label>

          {/* WYSIWYG Editor Toolbar */}
          <div className="tiptap-toolbar">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={editor?.isActive('bold') ? 'active' : ''}
              title="Bold"
            >
              <span className="font-bold">B</span>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={editor?.isActive('italic') ? 'active' : ''}
              title="Italic"
            >
              <span className="italic">I</span>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={editor?.isActive('underline') ? 'active' : ''}
              title="Underline"
            >
              <span className="underline">U</span>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''}
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''}
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={editor?.isActive('bulletList') ? 'active' : ''}
              title="Bullet List"
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={editor?.isActive('orderedList') ? 'active' : ''}
              title="Numbered List"
            >
              1. List
            </button>
          </div>

          {/* WYSIWYG Editor Content */}
          <div className="tiptap-content">
            <EditorContent editor={editor} className="tiptap-editor" />
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="e.g., work, personal, ideas"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (noteData && noteData.id ? 'Save Changes' : 'Create Note')}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddEditNoteComponent;
