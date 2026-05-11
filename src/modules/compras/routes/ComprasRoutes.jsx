import { PurchasesProvider } from '../presentation/context/PurchasesContext.jsx';
import PurchasesPage from '../presentation/pages/PurchasesPage.jsx';

const ComprasRoute = () => (
  <PurchasesProvider>
    <PurchasesPage />
  </PurchasesProvider>
);

export default ComprasRoute;
