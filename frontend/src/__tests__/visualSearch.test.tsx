import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VisualSearchModal } from '../components/drapza/VisualSearchModal';
import { productApi } from '../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe('Visual AI Garment Search Suite', () => {
  it('should verify productApi.visualSearch endpoint is defined', () => {
    expect(typeof productApi.visualSearch).toBe('function');
  });

  it('should render VisualSearchModal dialog when isOpen is true', () => {
    render(<VisualSearchModal isOpen={true} onClose={jest.fn()} initialTab="text" />);
    
    expect(screen.getByRole('dialog', { name: /visual ai garment search/i })).toBeInTheDocument();
    expect(screen.getByText('SEARCH ARCHIVE')).toBeInTheDocument();
    expect(screen.getByText('TEXT SEARCH')).toBeInTheDocument();
    expect(screen.getAllByText('IMAGE LENS').length).toBeGreaterThan(0);
    expect(screen.getByText('PASTE IMAGE')).toBeInTheDocument();
    expect(screen.getByText('CAMERA')).toBeInTheDocument();
  });

  it('should allow switching between search modes (Text, Lens, Paste, Camera)', () => {
    render(<VisualSearchModal isOpen={true} onClose={jest.fn()} initialTab="text" />);

    const lensTabBtn = screen.getAllByText('IMAGE LENS')[0];
    fireEvent.click(lensTabBtn);
    expect(screen.getByText(/DRAG & DROP GARMENT PHOTO/i)).toBeInTheDocument();
    expect(screen.getByText(/OR TEST WITH ATELIER PRESETS/i)).toBeInTheDocument();

    const pasteTabBtn = screen.getByText('PASTE IMAGE');
    fireEvent.click(pasteTabBtn);
    expect(screen.getByText(/PASTE COPIED GARMENT PHOTO/i)).toBeInTheDocument();

    const cameraTabBtn = screen.getByText('CAMERA');
    fireEvent.click(cameraTabBtn);
    expect(screen.getByText(/RETRY CAMERA ACCESS|CAPTURE SNAPSHOT/i)).toBeInTheDocument();
  });

  it('should not render anything when isOpen is false', () => {
    const { container } = render(<VisualSearchModal isOpen={false} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
