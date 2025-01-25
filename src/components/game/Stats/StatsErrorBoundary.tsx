import { ErrorBoundary } from '../../common/ErrorBoundary';
import styled from 'styled-components';

const StatsError = styled.div`
  width: 200px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: ${({ theme }) => theme.colors.game.surface};
  border: 2px solid ${({ theme }) => theme.colors.brand.secondary};
  border-radius: ${({ theme }) => theme.spacing.sm};
`;

export const StatsErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <StatsError>
        <div>Stats Display Error</div>
      </StatsError>
    }
  >
    {children}
  </ErrorBoundary>
); 