import messages from '@/messages/id/ui.json';

export default function LoadFallback({ className = '' }) {
  return (
    <p role="status" className={`m-0 text-sm text-muted ${className}`}>
      {messages.loadFallback.message}
    </p>
  );
}
