import { ErrorBoundary } from '../../common/ErrorBoundary';
import styled from 'styled-components';

const HoldError = styled.div`
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: ${({ theme }) => theme.colors.game.surface};
  border: 2px solid ${({ theme }) => theme.colors.brand.secondary};
  border-radius: ${({ theme }) => theme.spacing.sm};
`;

export const HoldAreaErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <HoldError>
        <div>Hold Area Error</div>
      </HoldError>
    }
  >
    {children}
  </ErrorBoundary>
); 