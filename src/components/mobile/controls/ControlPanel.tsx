// =============================================================================
// CONTROL PANEL COMPONENT
// Assembles all mobile controls with classic styling
// =============================================================================

import React from 'react';
import { InputAction } from '../../../engine/types';
import { DPad } from './DPad';
import { ABXYButtons } from './ABXYButtons';
import { SystemButtons } from './SystemButtons';
import styles from './Controls.module.css';

interface ControlPanelProps {
  onInput: (action: InputAction) => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onInput, 
  disabled = false 
}) => {
  return (
    <div className={styles.controlPanel}>
      {/* Main controls row - D-pad and ABXY buttons */}
      <div className={styles.mainControls}>
        <div className={styles.dpadArea}>
          <DPad onInput={onInput} disabled={disabled} />
        </div>
        
        <div className={styles.abxyArea}>
          <ABXYButtons onInput={onInput} disabled={disabled} />
        </div>
      </div>

      {/* System buttons row */}
      <div className={styles.systemArea}>
        <SystemButtons 
          onInput={onInput} 
          disabled={disabled} 
        />
      </div>
    </div>
  );
};

export default ControlPanel;
