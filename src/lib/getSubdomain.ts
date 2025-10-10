export function getSubdomain() {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;

  // أثناء التطوير على localhost
  if (host === "localhost" || host.includes("127.0.0.1")) {
    return null;
  }

  const parts = host.split(".");
  if (parts.length > 2) return parts[0]; // مثل center1.example.com → center1
  return null;
}
