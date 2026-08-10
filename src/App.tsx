import { BrowserRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { QueryProvider } from '@/context/QueryProvider';
import AppRoutes from '@/routes';
import '@/styles/index.css';
import '@/i18n';

export default function App() {
  return (
    <QueryProvider>
      <HelmetProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </HelmetProvider>
    </QueryProvider>
  );
}
