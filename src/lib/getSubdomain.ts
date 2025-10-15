// export function getSubdomain() {
//   if (typeof window === "undefined") return null;

//   const host = window.location.hostname;

//   // أثناء التطوير على localhost
//   if (host === "localhost" || host.includes("127.0.0.1")) {
//     return null;
//   }

//   const parts = host.split(".");
//   if (parts.length > 2) return parts[0]; // مثل center1.example.com → center1
//   return null;
// }
// lib/getSubdomain.ts

export function getSubdomain() {
  if (typeof window === "undefined") return null;

  const path = window.location.pathname; // مثال: "/alex/dashboard"
  const parts = path.split("/").filter(Boolean); // ["alex", "dashboard"]

  // أول جزء من المسار هو اسم المركز
  if (parts.length > 0) {
    return parts[0]; // alex
  }

  return null; // لو مفيش مسار بعد الدومين
}
