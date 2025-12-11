// =============================================================================
// MOBILE SETTINGS
// Simple settings modal for mobile devices
// =============================================================================

import React from 'react';
import styles from './MobileGame.module.css';

interface MobileSettingsProps {
  onClose: () => void;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({ onClose }) => {
  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsContent}>
        <h2 className={styles.settingsTitle}>SETTINGS</h2>

        <div className={styles.settingsInfo}>
          <p>Mobile version uses default settings optimized for touch controls.</p>
          <p>Button mappings:</p>
          <ul>
            <li><strong>D-Pad Up:</strong> Hard Drop</li>
            <li><strong>D-Pad Down:</strong> Soft Drop</li>
            <li><strong>D-Pad Left/Right:</strong> Move</li>
            <li><strong>A:</strong> Rotate Clockwise</li>
            <li><strong>B:</strong> Rotate Counter-Clockwise</li>
            <li><strong>X:</strong> Hold Piece</li>
            <li><strong>Y:</strong> Activate Zone</li>
            <li><strong>Start:</strong> Pause</li>
            <li><strong>Select:</strong> Rotate 180°</li>
          </ul>
        </div>

        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default MobileSettings;
