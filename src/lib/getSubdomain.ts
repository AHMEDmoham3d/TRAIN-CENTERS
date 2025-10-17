// export function getSubdomain() {
//   if (typeof window === "undefined") return null;

//   const path = window.location.pathname; // مثال: "/alex/dashboard"
//   const parts = path.split("/").filter(Boolean); // ["alex", "dashboard"]

//   // أول جزء من المسار هو اسم المركز
//   if (parts.length > 0) {
//     return parts[0]; // alex
//   }

//   return null; // لو مفيش مسار بعد الدومين
// }
export function getSubdomain() {
  if (typeof window === "undefined") return null;

  const path = window.location.pathname;
  const parts = path.split("/").filter(Boolean);

  console.log("🔍 Path parts:", parts); // ← ده السطر الجديد

  if (parts.length > 0) {
    return parts[0].trim().toLowerCase();
  }

  return null;
}
