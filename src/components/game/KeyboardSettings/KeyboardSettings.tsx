import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyBindings,
  ACTION_ORDER,
  ACTION_DISPLAY_NAMES,
  getKeyDisplayName,
  loadKeyBindings,
  saveKeyBindings,
  getDefaultBindings,
  findConflictingAction,
} from '../../../utils/keyBindingsStorage';
import { InputAction } from '../../../engine/types';
import styles from './KeyboardSettings.module.css';

interface KeyboardSettingsProps {
  onSave?: (bindings: KeyBindings) => void;
  onClose: () => void;
}

export const KeyboardSettings: React.FC<KeyboardSettingsProps> = ({
  onSave,
  onClose,
}) => {
  const [bindings, setBindings] = useState<KeyBindings>(loadKeyBindings);
  const [originalBindings] = useState<KeyBindings>(loadKeyBindings);
  const [listeningFor, setListeningFor] = useState<InputAction | null>(null);
  const [conflict, setConflict] = useState<{
    action: InputAction;
    existingAction: InputAction;
    keyCode: string;
  } | null>(null);

  // Check if there are unsaved changes
  const isDirty = JSON.stringify(bindings) !== JSON.stringify(originalBindings);

  // Handle key capture
  useEffect(() => {
    if (!listeningFor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const keyCode = event.code;

      // Check for conflicts
      const conflictingAction = findConflictingAction(bindings, keyCode, listeningFor);

      if (conflictingAction) {
        setConflict({
          action: listeningFor,
          existingAction: conflictingAction,
          keyCode,
        });
      } else {
        // No conflict, assign directly
        setBindings((prev) => ({
          ...prev,
          [listeningFor]: keyCode,
        }));
        setListeningFor(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [listeningFor, bindings]);

  // Handle clicking on an action row
  const handleActionClick = useCallback((action: InputAction) => {
    if (conflict) return; // Don't allow changing while conflict dialog is open
    setListeningFor(action);
  }, [conflict]);

  // Handle conflict resolution - swap keys
  const handleSwapKeys = useCallback(() => {
    if (!conflict) return;

    const { action, existingAction, keyCode } = conflict;
    const currentKey = bindings[action];

    setBindings((prev) => ({
      ...prev,
      [action]: keyCode,
      [existingAction]: currentKey,
    }));

    setConflict(null);
    setListeningFor(null);
  }, [conflict, bindings]);

  // Handle conflict resolution - cancel
  const handleCancelConflict = useCallback(() => {
    setConflict(null);
    setListeningFor(null);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    saveKeyBindings(bindings);
    onSave?.(bindings);
    onClose();
  }, [bindings, onSave, onClose]);

  // Handle cancel with dirty check
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Discard them?'
      );
      if (!confirmDiscard) return;
    }
    onClose();
  }, [isDirty, onClose]);

  // Handle reset to defaults
  const handleResetDefaults = useCallback(() => {
    const confirmReset = window.confirm(
      'Reset all key bindings to defaults?'
    );
    if (confirmReset) {
      setBindings(getDefaultBindings());
    }
  }, []);

  // Cancel listening mode when clicking outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && listeningFor && !conflict) {
      setListeningFor(null);
    }
  }, [listeningFor, conflict]);

  return (
    <div className={styles.container} onClick={handleBackdropClick}>
      <div className={styles.panel}>
        <h2 className={styles.title}>KEYBOARD CONTROLS</h2>

        <div className={styles.bindingsList}>
          {ACTION_ORDER.map((action) => (
            <div
              key={action}
              className={`${styles.bindingRow} ${
                listeningFor === action ? styles.listening : ''
              }`}
              onClick={() => handleActionClick(action)}
            >
              <span className={styles.actionName}>
                {ACTION_DISPLAY_NAMES[action]}
              </span>
              <span className={styles.keyDisplay}>
                {listeningFor === action ? (
                  <span className={styles.pressKey}>Press a key...</span>
                ) : (
                  getKeyDisplayName(bindings[action])
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Conflict Dialog */}
        {conflict && (
          <div className={styles.conflictOverlay}>
            <div className={styles.conflictDialog}>
              <p className={styles.conflictMessage}>
                <strong>{getKeyDisplayName(conflict.keyCode)}</strong> is already
                assigned to{' '}
                <strong>{ACTION_DISPLAY_NAMES[conflict.existingAction]}</strong>
              </p>
              <div className={styles.conflictButtons}>
                <button
                  className={styles.swapButton}
                  onClick={handleSwapKeys}
                >
                  SWAP KEYS
                </button>
                <button
                  className={styles.cancelConflictButton}
                  onClick={handleCancelConflict}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.buttons}>
          <button
            className={styles.resetButton}
            onClick={handleResetDefaults}
          >
            RESET DEFAULTS
          </button>
          <div className={styles.mainButtons}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={!isDirty}
            >
              SAVE
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              {isDirty ? 'CANCEL' : 'CLOSE'}
            </button>
          </div>
        </div>

        {isDirty && (
          <p className={styles.unsavedHint}>You have unsaved changes</p>
        )}
      </div>
    </div>
  );
};

