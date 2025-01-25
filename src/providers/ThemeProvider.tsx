import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: ${({ theme }) => theme.colors.game.background};
    color: ${({ theme }) => theme.colors.ui.text.primary};
    font-family: ${({ theme }) => theme.typography.fonts.main};
    line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  }

  * {
    box-sizing: border-box;
  }

  button {
    font-family: ${({ theme }) => theme.typography.fonts.main};
  }
`;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </StyledThemeProvider>
  );
}; 