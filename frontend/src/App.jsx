import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ParallaxProvider } from 'react-scroll-parallax';

import ErrorBoundary from './ErrorBoundary';
import Home from './pages/Home';
import Resume from './pages/Resume';
import Blog from './pages/Blog';
import ScrollToTop from './components/ScrollToTop';
import SinglePost from './pages/SinglePost';

const DefaultLayout = React.lazy(() => import('./layout/Default'));

function App() {
    return (
      <ErrorBoundary>
        <ParallaxProvider>
          <BrowserRouter>
            <ScrollToTop/>
              <Routes>

                <Route element={<DefaultLayout />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/resume" element={<Resume />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/post/:slug" element={<SinglePost />} />
                </Route>

                <Route path="*" element={<Navigate to="/home" />} />

              </Routes>
          </BrowserRouter>
        </ParallaxProvider>
      </ErrorBoundary>
    );
}

export default App;
