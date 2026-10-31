'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransition';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';

export const NotFoundPage = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '404: This page could not be found.';
    window.scrollTo(0, 0);
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <div className="page not-found-page-wrapper">
      {/* Authentic Next.js Error View */}
      <div className="not-found-screen">
        <div className="not-found-inner">
          <h1 className="next-error-h1">404</h1>
          <div className="not-found-message">
            <h2>This page could not be found.</h2>
          </div>
        </div>

        {/* Minimal Return Action */}
        <div className="not-found-btn-wrapper">
          <a
            href="/"
            className="not-found-btn"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            ← Return to Base
          </a>
        </div>
      </div>

      {/* Global Digifox Footer System */}
      <ContactForm />
      <Footer navigate={navigate} />
    </div>
  );
};
