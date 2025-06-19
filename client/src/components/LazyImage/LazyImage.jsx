import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, onLoadComplete }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '100px' } // Load ảnh khi nó cách màn hình 100px
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) observer.unobserve(imgRef.current);
    };
  }, []);

  return (
    <div ref={imgRef} style={{ minHeight: '200px' }}>
      {' '}
      {/* Giữ vị trí ảnh */}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onLoad={() => {
            setIsLoaded(true);
            if (onLoadComplete) onLoadComplete();
          }}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.5s',
            width: '100%',
            height: 'auto',
            background: '#f0f0f0', // Placeholder màu xám
          }}
        />
      )}
    </div>
  );
};

export default LazyImage;
