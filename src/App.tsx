import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { ProcessFlow } from './pages/ProcessFlow';
import { LogsPage } from './pages/LogsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { PriceResearchPage } from './pages/PriceResearchPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProcurementProvider } from './store/procurementStore';
import { Layout } from './components/Layout';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', onLocationChange);

    // Override pushState and replaceState to catch navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      onLocationChange();
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      onLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // Simple router
  let content;
  if (currentPath === '/') {
    content = <Dashboard />;
  } else if (currentPath === '/process') {
    content = <ProcessFlow />;
  } else if (currentPath === '/logs') {
    content = <LogsPage />;
  } else if (currentPath === '/docs') {
    content = <DocumentsPage />;
  } else if (currentPath === '/prices') {
    content = <PriceResearchPage />;
  } else if (currentPath === '/audit') {
    content = <AuditPage />;
  } else if (currentPath === '/settings') {
    content = <SettingsPage />;
  } else {
    content = (
      <Layout currentPath={currentPath}>
        <div className="p-8 flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Em Desenvolvimento</h2>
            <p className="text-slate-500">Esta funcionalidade será implementada em breve.</p>
            <button 
              onClick={() => window.history.pushState({}, '', '/')}
              className="mt-6 text-blue-600 hover:underline"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProcurementProvider>
      {content}
    </ProcurementProvider>
  );
}
