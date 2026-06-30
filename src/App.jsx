import { Toaster } from 'sonner';
import AppRouter from './routes/AppRouter';
import { ConfirmProvider } from './shared/components/ConfirmDialog/ConfirmProvider';
import './App.css';
import 'sonner/dist/styles.css';

function App() {
  return (
    <ConfirmProvider>
      <AppRouter />
      <Toaster
        richColors
        closeButton
        position="top-right"
        duration={3800}
        toastOptions={{
          style: {
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </ConfirmProvider>
  );
}

export default App;
