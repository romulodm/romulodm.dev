import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ErrorBoundary from './ErrorBoundary';
import Home from './pages/Home';

const DefaultLayout = React.lazy(() => import('./layout/Default'));

function App() {

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
               
          <Route element={<DefaultLayout />}>
            <Route path="/home" element={<Home />} />
          </Route>

          <Route path="*" element={<Navigate to="/home" />} />

        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;