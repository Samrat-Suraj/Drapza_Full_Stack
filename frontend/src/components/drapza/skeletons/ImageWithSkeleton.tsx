"use client";

import React, { useState, useEffect, useRef } from "react";
import { Skeleton } from "./Skeleton";

export interface ImageWithSkeletonProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonClassName?: string;
  fallbackSrc?: string;
  dark?: boolean;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  skeletonClassName = "",
  fallbackSrc = "/images/drapza/products/product_1.png",
  loading = "eager",
  dark = false,
  onLoad,
  onError,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached or complete on mount or src change
  useEffect(() => {
    setHasError(false);
    if (imgRef.current && (imgRef.current.complete || imgRef.current.naturalWidth > 0)) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  const activeSrc = hasError ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Shimmering Skeleton Placeholder */}
      {!isLoaded && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden ${skeletonClassName}`}
        >
          <Skeleton
            dark={dark}
            className="w-full h-full absolute inset-0"
            ariaLabel={`Loading visual for ${alt || "item"}`}
          />
        </div>
      )}

      {/* Main Image with Smooth Opacity Reveal */}
      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ease-out ${isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
        {...rest}
      />
    </div>
  );
};

export default ImageWithSkeleton;
