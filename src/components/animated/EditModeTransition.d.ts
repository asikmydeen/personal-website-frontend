import React, { ReactNode } from 'react';
interface EditModeTransitionProps {
    children: ReactNode;
    editMode: boolean;
    onClose?: () => void;
    onSave?: () => void;
    title?: string;
}
/**
 * A component that provides a smooth transition when switching between view and edit modes.
 * Perfect for forms, detail views, and any editable content.
 */
declare const EditModeTransition: React.FC<EditModeTransitionProps>;
export default EditModeTransition;
