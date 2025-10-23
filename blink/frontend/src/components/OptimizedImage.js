import React, { useState, useEffect, useRef } from "react";

const OptimizedImage = ({
  src,
  alt,
  className = "",
  fallbackSrc = "/logo192.png",
  lazy = true,
  priority = false,
  width,
  height,
  onLoad,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(priority ? src : fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Generate optimized image URL with size hints
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return fallbackSrc;

    // If it's a Supabase URL, add transformation params
    if (originalSrc.includes("supabase.co/storage")) {
      try {
        const url = new URL(originalSrc);
        // Supabase storage transformation parameters
        if (width) url.searchParams.set("width", width);
        if (height) url.searchParams.set("height", height);
        url.searchParams.set("quality", "85");
        url.searchParams.set("format", "auto"); // Auto-detect WebP support
        return url.toString();
      } catch (e) {
        console.warn("Failed to optimize Supabase URL:", e);
        return originalSrc;
      }
    }

    return originalSrc;
  };

  useEffect(() => {
    if (!lazy || priority) {
      loadImage();
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px", // Increased from 50px to 100px for smoother experience
        threshold: 0.01, // Load when even 1% is visible
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, lazy, priority]);

  const loadImage = () => {
    const optimizedSrc = getOptimizedSrc(src);
    const img = new Image();

    // Set CORS for Supabase images
    if (optimizedSrc && optimizedSrc.includes("supabase")) {
      img.crossOrigin = "anonymous";
    }

    img.src = optimizedSrc;

    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      console.warn("Image load failed:", optimizedSrc);
      // Try original src if optimized fails
      if (optimizedSrc !== src && src) {
        const fallbackImg = new Image();
        if (src.includes("supabase")) {
          fallbackImg.crossOrigin = "anonymous";
        }
        fallbackImg.src = src;
        fallbackImg.onload = () => {
          setImageSrc(src);
          setIsLoading(false);
        };
        fallbackImg.onerror = () => {
          console.error("Final fallback failed, using placeholder");
          setImageSrc(fallbackSrc);
          setIsLoading(false);
          setHasError(true);
        };
      } else {
        setImageSrc(fallbackSrc);
        setIsLoading(false);
        setHasError(true);
      }
    };
  };

  return (
    <div ref={imgRef} className="relative">
      {isLoading && !priority && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"
          style={{ width: width || "100%", height: height || "100%" }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        loading={lazy && !priority ? "lazy" : "eager"}
        fetchpriority={priority ? "high" : "low"}
        width={width}
        height={height}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
