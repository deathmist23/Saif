import {useEffect, useState} from 'react';
import {Layers} from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  fallbackMonogram?: string;
  className?: string;
  fallbackClassName?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  fallbackMonogram,
  className = '',
  fallbackClassName = '',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);
  const [usedEmbeddedFallback, setUsedEmbeddedFallback] = useState(false);

  useEffect(() => {
    setHasError(false);
    setUsedEmbeddedFallback(false);
  }, [src]);

  const embeddedPortrait =
    typeof window !== 'undefined'
      ? (window as Window & {__SAIF_PORTRAIT_FALLBACK__?: string}).__SAIF_PORTRAIT_FALLBACK__
      : undefined;

  const activeSrc = usedEmbeddedFallback && embeddedPortrait ? embeddedPortrait : src;

  if (hasError || !activeSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 text-center ${fallbackClassName || 'bg-slate-800 text-white p-4'} ${className}`}
      >
        {fallbackMonogram ? (
          <span className="font-display text-2xl font-bold tracking-wider text-white">
            {fallbackMonogram}
          </span>
        ) : (
          <>
            <Layers className="h-6 w-6 text-slate-400" aria-hidden="true" />
            <span className="max-w-xs font-display text-xs font-semibold text-slate-300">
              {fallbackTitle}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (
          !usedEmbeddedFallback &&
          embeddedPortrait &&
          src.includes('IMG_20240605_211150_8856819c.jpg')
        ) {
          setUsedEmbeddedFallback(true);
        } else {
          setHasError(true);
        }
      }}
      className={className}
    />
  );
}
