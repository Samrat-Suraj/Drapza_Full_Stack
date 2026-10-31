'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGetTermsQuery } from '../redux/api/contentApi';
import { Footer } from '../components/Footer';

export const TermsPage = () => {
  const router = useRouter();
  const { data: termsConfig } = useGetTermsQuery();

  const defaultTerms = [
    {
      title: '1. Atelier Protocol & Ordering',
      content: 'All garments from Drapza are modular outerwear engineered for extreme urban climates. Orders placed through our digital archive are tailored upon demand to reduce deadstock and guarantee craft excellence.'
    },
    {
      title: '2. Textile Specifications & Technical Fabrics',
      content: 'Our garments incorporate technical ripstop, 3-layer bonded membranes, waterproof taped seams, and custom YKK Aquaguard hardware. Variations in sheen and weave texture reflect individual dye lot characteristics.'
    },
    {
      title: '3. Returns & Exchange Governance',
      content: 'Unworn garments in pristine condition with authentic archive security tags and original modular storage packaging are eligible for return or size exchange within 7 days of verified dispatch receipt.'
    },
    {
      title: '4. Intellectual Property & Brand Rights',
      content: 'All silhouettes, modular component designs, digital telemetry assets, and visual lookbooks are the exclusive intellectual property of Drapza Atelier. Unauthorized reproduction is strictly forbidden.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0c', color: '#ffffff', fontFamily: 'var(--font-host-grotesk), sans-serif' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: '0.8rem', letterSpacing: '0.15em' }}
        >
          ← RETURN TO ARCHIVE
        </button>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.75rem', letterSpacing: '0.2em', color: '#71717a' }}>
          GOVERNANCE & PROTOCOLS
        </span>
      </div>

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '4.5rem 1.5rem' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.75rem', letterSpacing: '0.25em', color: '#a1a1aa' }}>
          OFFICIAL ATELIER CHARTER
        </span>
        <h1 style={{ fontFamily: 'var(--font-koulen)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '0.04em', margin: '0.5rem 0 2.5rem 0' }}>
          TERMS & ARCHIVE CONDITIONS
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {defaultTerms.map((sec, idx) => (
            <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#ffffff' }}>
                {sec.title}
              </h3>
              <p style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '0.98rem', margin: 0 }}>
                {sec.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;
