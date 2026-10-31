import React from 'react';
import { ModelSelector } from './ModelSelector';

export interface ModelSelectorDropdownProps {
  direction?: 'up' | 'down';
  className?: string;
  prefixLabel?: string;
}

/**
 * Backwards compatibility wrapper that forwards to the reusable ModelSelector
 */
export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  className = '',
}) => {
  return <ModelSelector variant="compact" className={className} />;
};

export default ModelSelectorDropdown;
