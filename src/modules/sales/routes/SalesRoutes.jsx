import { SalesProvider } from '../presentation/context/SalesContext.jsx';
import SalesPage from '../presentation/pages/SalesPage.jsx';

const SalesRoute = () => (
  <SalesProvider>
    <SalesPage />
  </SalesProvider>
);

export default SalesRoute;
