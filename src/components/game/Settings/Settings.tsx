import { useState } from 'react'
import styles from './Settings.module.css'
import { KeyboardSettings } from '../KeyboardSettings/KeyboardSettings'
import { KeyBindings } from '../../../utils/keyBindingsStorage'

type SettingsTab = 'controls' | 'keyboard';

interface SettingsProps {
  settings: {
    das: number;
    arr: number;
  };
  onSave: (settings: { das: number; arr: number }) => void;
  onClose: () => void;
  onKeyBindingsChange?: (bindings: KeyBindings) => void;
}

export const Settings = ({ settings, onSave, onClose, onKeyBindingsChange }: SettingsProps) => {
  const [das, setDas] = useState(settings.das);
  const [arr, setArr] = useState(settings.arr);
  const [activeTab, setActiveTab] = useState<SettingsTab>('controls');
  const [showKeyboardSettings, setShowKeyboardSettings] = useState(false);

  const handleSave = () => {
    onSave({ das, arr });
    onClose();
  };

  const handleKeyBindingsSave = (bindings: KeyBindings) => {
    onKeyBindingsChange?.(bindings);
    setShowKeyboardSettings(false);
  };

  // If keyboard settings modal is open, show it instead
  if (showKeyboardSettings) {
    return (
      <KeyboardSettings
        onSave={handleKeyBindingsSave}
        onClose={() => setShowKeyboardSettings(false)}
      />
    );
  }

  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsPanel}>
        <h2 className={styles.title}>Settings</h2>
        
        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'controls' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            CONTROLS
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'keyboard' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('keyboard')}
          >
            KEYBOARD
          </button>
        </div>

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <div className={styles.tabContent}>
            <div className={styles.setting}>
              <label>
                <span className={styles.settingLabel}>DAS (Delayed Auto Shift)</span>
                <span className={styles.settingValue}>{das}ms</span>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={das}
                  onChange={(e) => setDas(Number(e.target.value))}
                />
              </label>
            </div>

            <div className={styles.setting}>
              <label>
                <span className={styles.settingLabel}>ARR (Auto Repeat Rate)</span>
                <span className={styles.settingValue}>{arr}ms</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={arr}
                  onChange={(e) => setArr(Number(e.target.value))}
                />
              </label>
            </div>

            <div className={styles.buttons}>
              <button className={styles.saveButton} onClick={handleSave}>Save</button>
              <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* Keyboard Tab */}
        {activeTab === 'keyboard' && (
          <div className={styles.tabContent}>
            <p className={styles.keyboardHint}>
              Customize your keyboard controls
            </p>
            <button
              className={styles.editKeysButton}
              onClick={() => setShowKeyboardSettings(true)}
            >
              EDIT KEY BINDINGS
            </button>
            <div className={styles.buttons}>
              <button className={styles.cancelButton} onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 