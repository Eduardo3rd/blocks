import { ErrorBoundary } from '../../common/ErrorBoundary';
import styled from 'styled-components';

const BoardError = styled.div`
  width: 300px;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.game.surface};
  border: 2px solid ${({ theme }) => theme.colors.brand.secondary};
  border-radius: ${({ theme }) => theme.spacing.sm};
`;

export const BoardErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <BoardError>
        <div>
          <div>Game Board Error</div>
          <div>Please refresh the page</div>
        </div>
      </BoardError>
    }
  >
    {children}
  </ErrorBoundary>
);

