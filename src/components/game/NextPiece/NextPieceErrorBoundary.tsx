import { ErrorBoundary } from '../../common/ErrorBoundary';
import styled from 'styled-components';

const NextError = styled.div`
  width: 160px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: ${({ theme }) => theme.colors.game.surface};
  border: 2px solid ${({ theme }) => theme.colors.brand.secondary};
  border-radius: ${({ theme }) => theme.spacing.sm};
`;

export const NextPieceErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <NextError>
        <div>Next Piece Preview Error</div>
      </NextError>
    }
  >
    {children}
  </ErrorBoundary>
); 