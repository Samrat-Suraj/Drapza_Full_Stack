import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as nextNav from 'next/navigation';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

// Components under test
import { DrapzaLogo } from '../components/drapza/DrapzaLogo';
import { ProductCard } from '../components/drapza/ProductCard';
import { TextBlock } from '../components/TextBlock';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import { Navigation } from '../components/Navigation';
import { AboutSection } from '../components/AboutSection';

describe('DRAPZA React UI Components Test Suite', () => {
  // 1. DrapzaLogo Component Tests
  describe('DrapzaLogo Component', () => {
    it('should render brand logo container by default', () => {
      const { container } = render(<DrapzaLogo showWordmark={true} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('.font-display')).toBeInTheDocument();
    });

    it('should render custom logo text when specified', () => {
      render(
        <DrapzaLogo
          customLogoType="text"
          customLogoText="DRAPZA ATELIER PARIS"
          showWordmark={true}
        />
      );
      expect(screen.getByText('DRAPZA ATELIER PARIS')).toBeInTheDocument();
    });

    it('should render tagline when showTagline is enabled', () => {
      render(
        <DrapzaLogo
          showTagline={true}
          customLogoTagline="WEAR YOUR STORY"
        />
      );
      expect(screen.getByText(/WEAR YOUR STORY/i)).toBeInTheDocument();
    });

    it('should handle onClick interaction callback', () => {
      const handleClick = jest.fn();
      const { container } = render(<DrapzaLogo onClick={handleClick} />);
      const logoWrapper = container.firstChild as HTMLElement;
      fireEvent.click(logoWrapper);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // 2. ProductCard Component Tests
  describe('ProductCard Component', () => {
    const mockProduct = {
      id: 'prod-001',
      name: 'OVERSIZED RAW HOODIE',
      price: '₹4,990',
      image: '/images/products/hoodie.jpg',
      slug: 'oversized-raw-hoodie',
    };

    it('should render product name and formatted price', () => {
      render(
        <ProductCard
          id={mockProduct.id}
          name={mockProduct.name}
          price={mockProduct.price}
          image={mockProduct.image}
        />
      );

      expect(screen.getByText('OVERSIZED RAW HOODIE')).toBeInTheDocument();
      expect(screen.getByText('₹4,990')).toBeInTheDocument();
    });

    it('should display discount badge and strike-through original price when discount is active', () => {
      render(
        <ProductCard
          id={mockProduct.id}
          name={mockProduct.name}
          price="₹4,990"
          originalPrice="₹4,990"
          discountTagActive={true}
          discountPercentage={30}
          offerTag="LIMITED DROP"
        />
      );

      expect(screen.getByText('LIMITED DROP')).toBeInTheDocument();
      expect(screen.getByText('₹4,990')).toBeInTheDocument();
    });

    it('should display percentage discount tag when offerTag is not provided', () => {
      render(
        <ProductCard
          id={mockProduct.id}
          name={mockProduct.name}
          price="₹4,990"
          discountTagActive={true}
          discountPercentage={25}
        />
      );

      expect(screen.getByText('25% OFF')).toBeInTheDocument();
    });

    it('should trigger onAddToCart callback when add to cart button is clicked', () => {
      const handleAddToCart = jest.fn();
      render(
        <ProductCard
          {...mockProduct}
          onAddToCart={handleAddToCart}
          product={mockProduct}
        />
      );

      const cartBtn = screen.getByRole('button', { name: /ADD TO CART/i });
      fireEvent.click(cartBtn);
      expect(handleAddToCart).toHaveBeenCalledTimes(1);
    });

    it('should trigger onNavigate callback when card image is clicked', () => {
      const handleNavigate = jest.fn();
      const { container } = render(
        <ProductCard
          {...mockProduct}
          onNavigate={handleNavigate}
        />
      );

      const cardImg = container.querySelector('.product-img');
      expect(cardImg).not.toBeNull();
      if (cardImg) fireEvent.click(cardImg);
      expect(handleNavigate).toHaveBeenCalledWith('/wardrobe/oversized-raw-hoodie');
    });

    it('should trigger onToggleWishlist and toggle wishlist state when wishlist button is clicked', () => {
      const handleToggleWishlist = jest.fn();
      render(
        <ProductCard
          {...mockProduct}
          onToggleWishlist={handleToggleWishlist}
        />
      );

      const wishlistBtn = screen.getByRole('button', { name: /Add to wishlist/i });
      expect(wishlistBtn).toBeInTheDocument();
      fireEvent.click(wishlistBtn);
      expect(handleToggleWishlist).toHaveBeenCalledTimes(1);
    });
  });

  // 3. TextBlock Component Tests
  describe('TextBlock Component', () => {
    it('should render default headline lines and narrative paragraphs', () => {
      render(<TextBlock />);
      expect(screen.getByText(/Designed absence, engineered silence./i)).toBeInTheDocument();
      expect(screen.getByText(/Designed for quiet tension/i)).toBeInTheDocument();
    });

    it('should respect custom config headline and body text', () => {
      render(
        <TextBlock
          config={{
            headline: 'TACTILE FABRICATION, PERMANENT ARCHITECTURE.',
            paragraph1: 'Custom atelier narrative for testing purposes.',
          }}
        />
      );

      expect(screen.getByText('TACTILE FABRICATION, PERMANENT ARCHITECTURE.')).toBeInTheDocument();
      expect(screen.getByText(/Custom atelier narrative/i)).toBeInTheDocument();
    });

    it('should return null when isEnabled is set to false in config', () => {
      const { container } = render(<TextBlock config={{ isEnabled: false }} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // 4. ContactForm Newsletter Transmit Component Tests
  describe('ContactForm Component', () => {
    it('should render input field with signal placeholder', () => {
      render(<ContactForm />);
      expect(screen.getByPlaceholderText(/ENTER SIGNAL ADDRESS/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /SUBMIT SIGNAL/i })).toBeInTheDocument();
    });

    it('should validate and show error message on invalid email submission', () => {
      render(<ContactForm />);
      const input = screen.getByPlaceholderText(/ENTER SIGNAL ADDRESS/i);
      const submitBtn = screen.getByRole('button', { name: /SUBMIT SIGNAL/i });

      fireEvent.change(input, { target: { value: 'invalid-email-address' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Please provide a valid email signal/i)).toBeInTheDocument();
    });

    it('should successfully submit and show confirmation on valid email input', () => {
      render(<ContactForm />);
      const input = screen.getByPlaceholderText(/ENTER SIGNAL ADDRESS/i);
      const submitBtn = screen.getByRole('button', { name: /SUBMIT SIGNAL/i });

      fireEvent.change(input, { target: { value: 'client.vip@drapza.com' } });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText(/Signal frequency received and logged into system buffer/i)
      ).toBeInTheDocument();
    });
  });

  // 5. Footer Component Tests
  describe('Footer Component', () => {
    it('should render brand logo and key navigation links', () => {
      render(<Footer />);
      expect(screen.getAllByText(/DRAPZA/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Shop All Products')).toBeInTheDocument();
      expect(screen.getByText('About Drapza')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('+91 8888333038')).toBeInTheDocument();
    });

    it('should invoke navigate callback when a link is clicked', () => {
      const mockNavigate = jest.fn();
      render(<Footer navigate={mockNavigate} />);

      const wardrobeLink = screen.getByText('Shop All Products');
      fireEvent.click(wardrobeLink);

      expect(mockNavigate).toHaveBeenCalledWith('/wardrobe');
    });

    it('should render null when isEnabled is false', () => {
      const { container } = render(<Footer config={{ isEnabled: false }} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // 6. Navigation Component Tests
  describe('Navigation Component', () => {
    it('should render brand logo and SHOP button', () => {
      render(<Navigation currentRoute="/" navigate={() => {}} />);
      expect(screen.getAllByText('DRAPZA').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Shop Catalog/i })).toBeInTheDocument();
    });

    it('should invoke navigate to /wardrobe when SHOP button is clicked', () => {
      const mockNav = jest.fn();
      render(<Navigation currentRoute="/" navigate={mockNav} />);

      const shopBtn = screen.getByRole('button', { name: /Shop Catalog/i });
      fireEvent.click(shopBtn);

      expect(mockNav).toHaveBeenCalledWith('/wardrobe');
    });

    it('should return null when rendered on auth routes like /login or /signup', () => {
      (nextNav as any).__setMockPathname('/login');
      const { container } = render(<Navigation currentRoute="/login" navigate={() => {}} />);
      expect(container.firstChild).toBeNull();
      (nextNav as any).__setMockPathname('/');
    });
  });

  // 7. AboutSection Component Tests
  describe('AboutSection Component', () => {
    it('should render About narrative section headline and philosophy', () => {
      render(<AboutSection />);
      expect(screen.getByText(/Clothing reduced to pure signal/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Our collections are built for the frictionless, the fast, and the quietly defiant./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/\/ Core State \//i)).toBeInTheDocument();
    });
  });
});
