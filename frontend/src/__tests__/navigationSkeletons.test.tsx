import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import route loading components
import RootLoading from '../app/loading';
import WardrobeLoading from '../app/wardrobe/loading';
import ProductPageLoading from '../app/wardrobe/[slug]/loading';
import UnitLoading from '../app/unit/loading';
import TrackLoading from '../app/track/loading';
import CheckoutLoading from '../app/checkout/loading';
import ProfileLoading from '../app/profile/loading';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Global Navigation & Loading Skeleton Verification', () => {
  test('RootLoading renders status and busy role with skeletons', () => {
    render(<RootLoading />);
    const status = screen.getByRole('status', { name: /loading page/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  test('WardrobeLoading renders ProductGridSkeleton', () => {
    render(<WardrobeLoading />);
    const status = screen.getByRole('status', { name: /loading wardrobe collection/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  test('ProductPageLoading [slug] renders ProductDetailSkeleton', () => {
    render(<ProductPageLoading />);
    const status = screen.getByRole('status', { name: /loading product details/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  test('UnitLoading renders ProductDetailSkeleton', () => {
    render(<UnitLoading />);
    const status = screen.getByRole('status', { name: /loading product details/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  test('TrackLoading renders TrackOrderSkeleton', () => {
    render(<TrackLoading />);
    const status = screen.getByRole('status', { name: /loading order tracking/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  test('CheckoutLoading renders CartPageSkeleton', () => {
    render(<CheckoutLoading />);
    const status = screen.getByRole('status', { name: /loading checkout/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  test('ProfileLoading renders ProfileSkeleton', () => {
    render(<ProfileLoading />);
    const status = screen.getByRole('status', { name: /loading profile/i });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
  });
});
