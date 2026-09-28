type RemoteImageProps = {
  src: string;
  alt: string;
  eager?: boolean;
  className?: string;
  proxyPath?: string;
};

export function RemoteImage({ src, alt, eager = false, className = "", proxyPath }: RemoteImageProps) {
  const source = new URL(src).protocol === "http:" && proxyPath ? proxyPath : src;
  // HTTPS loads directly; stored HTTP assets use the restricted same-origin endpoint on secure pages.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={source} alt={alt} loading={eager ? "eager" : "lazy"} referrerPolicy="no-referrer" className={`absolute inset-0 h-full w-full object-cover ${className}`} />;
}
