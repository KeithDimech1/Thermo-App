/**
 * AddToCompareButton - Client component for adding configs to comparison basket
 *
 * Handles:
 * - Reading existing comparison basket from sessionStorage
 * - Adding/removing configs from basket
 * - Visual feedback for selected state
 * - Toast notifications for user feedback
 */

'use client';

import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface AddToCompareButtonProps {
  configId: number;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AddToCompareButton({
  configId,
  variant = 'secondary',
  size = 'sm',
  className = '',
}: AddToCompareButtonProps) {
  const [isInBasket, setIsInBasket] = useState(false);
  const { showToast, ToastContainer } = useToast();

  // Check if this config is already in the comparison basket
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('compareBasket');
      if (stored) {
        const basket = JSON.parse(stored) as number[];
        setIsInBasket(basket.includes(configId));
      }
    }
  }, [configId]);

  const handleAddToCompare = () => {
    // Get existing basket from session storage
    let basket: number[] = [];
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('compareBasket');
      if (stored) {
        basket = JSON.parse(stored) as number[];
      }
    }

    // Toggle config in basket
    const isRemoving = basket.includes(configId);
    if (isRemoving) {
      basket = basket.filter((id) => id !== configId);
    } else {
      if (basket.length >= 4) {
        alert('Maximum 4 configurations can be compared at once. Please remove some before adding more.');
        return;
      }
      basket.push(configId);
    }

    // Save to session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('compareBasket', JSON.stringify(basket));
      setIsInBasket(basket.includes(configId));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('basketUpdated'));
    }

    // Show feedback message
    if (!isRemoving) {
      const message = basket.length === 1
        ? 'Added to comparison basket. Click the basket indicator in the header to compare.'
        : `Added to basket (${basket.length}/4 items). Click the basket indicator when ready to compare.`;
      showToast(message);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={handleAddToCompare}>
        {isInBasket ? '✓ In Comparison' : 'Add to Compare'}
      </Button>
      <ToastContainer />
    </>
  );
}

/**
 * CompareBasketIndicator - Shows number of items in comparison basket
 * Can be placed in navigation or as a floating indicator
 */
export function CompareBasketIndicator() {
  const [basketCount, setBasketCount] = useState(0);

  useEffect(() => {
    // Initial load
    const updateCount = () => {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('compareBasket');
        if (stored) {
          const basket = JSON.parse(stored) as number[];
          setBasketCount(basket.length);
        } else {
          setBasketCount(0);
        }
      }
    };

    updateCount();

    // Listen for storage events (updates from other tabs/windows)
    window.addEventListener('storage', updateCount);

    // Listen for custom basket update events (same window)
    window.addEventListener('basketUpdated', updateCount);

    // Fallback polling (reduced frequency since we have event-based updates)
    const interval = setInterval(updateCount, 2000);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('basketUpdated', updateCount);
      clearInterval(interval);
    };
  }, []);

  if (basketCount === 0) return null;

  const handleClick = () => {
    const stored = sessionStorage.getItem('compareBasket');
    if (stored) {
      const basket = JSON.parse(stored) as number[];
      window.location.href = `/compare?configs=${basket.join(',')}`;
    } else {
      window.location.href = '/compare';
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 transition-colors"
    >
      <span>Compare</span>
      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
        {basketCount}
      </span>
    </button>
  );
}
