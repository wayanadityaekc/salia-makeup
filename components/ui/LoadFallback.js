// Shown instead of an empty block when the data a component needs did not arrive.
export default function LoadFallback({ className = "" }) {
  return (
    <p role="status" className={`m-0 text-sm text-muted ${className}`}>
      Maaf, informasi ini belum bisa dimuat. Silakan coba lagi.
    </p>
  );
}
