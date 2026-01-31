// useImagePreloader.tsx - IMPROVED VERSION
import { useState, useEffect } from 'react';

export const useImagePreloader = (imageUrls: string[]) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // If no images to preload, mark as loaded immediately
    if (!imageUrls || imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    let loadedCount = 0;
    const totalImages = imageUrls.length;
    const errorList: string[] = [];

    const preloadImages = async () => {
      const promises = imageUrls.map((url) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          
          img.onload = () => {
            if (!mounted) return;
            loadedCount++;
            setProgress(Math.round((loadedCount / totalImages) * 100));
            
            // Mark as loaded when all images are loaded
            if (loadedCount >= totalImages) {
              if (mounted) {
                setIsLoading(false);
                setErrors(errorList);
              }
            }
            resolve();
          };
          
          img.onerror = () => {
            if (!mounted) return;
            loadedCount++;
            setProgress(Math.round((loadedCount / totalImages) * 100));
            errorList.push(`Failed to load: ${url}`);
            
            // Still mark as loaded when all are attempted
            if (loadedCount >= totalImages) {
              if (mounted) {
                setIsLoading(false);
                setErrors(errorList);
              }
            }
            resolve();
          };
          
          img.src = url;
        });
      });

      try {
        await Promise.all(promises);
      } catch (error) {
        console.error('Image preload error:', error);
      }

      // Fallback timeout in case images take too long
      setTimeout(() => {
        if (mounted && isLoading) {
          console.log('Image preload timeout, continuing anyway');
          setIsLoading(false);
        }
      }, 5000); // 5 second timeout
    };

    preloadImages();

    return () => {
      mounted = false;
    };
  }, [imageUrls]);

  return { isLoading, progress, errors };
};