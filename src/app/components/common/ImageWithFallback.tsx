import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  fallbackSrc: string;
  alt: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(fallbackSrc);

  useEffect(() => {
    const img = document.createElement('img');
    img.src = src;
    img.onload = () => {
      setImgSrc(src);
    };
    img.onerror = () => {
      setImgSrc(fallbackSrc);
    };
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
      width={45}
      height={45}
    />
  );
}
