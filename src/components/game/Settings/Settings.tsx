import { useState } from 'react'
import styles from './Settings.module.css'

interface SettingsProps {
  settings: {
    das: number;
    arr: number;
  };
  onSave: (settings: { das: number; arr: number }) => void;
  onClose: () => void;
}

export const Settings = ({ settings, onSave, onClose }: SettingsProps) => {
  const [das, setDas] = useState(settings.das);
  const [arr, setArr] = useState(settings.arr);

  const handleSave = () => {
    onSave({ das, arr });
    onClose();
  };

  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsPanel}>
        <h2>Settings</h2>
        
        <div className={styles.setting}>
          <label>
            DAS (Delayed Auto Shift) - {das}ms
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
            ARR (Auto Repeat Rate) - {arr}ms
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
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}; 