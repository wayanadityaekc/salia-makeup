import { MessageCircle } from "lucide-react";
import { site } from "@/lib/config";
import { waLink } from "@/lib/utils";

export default function WhatsAppFloat() {
  const pesan = `Halo ${site.brand}, saya mau tanya soal layanan make up / nail art.`;
  return (
    <a
      href={waLink(site.whatsapp, pesan)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-rose text-white shadow-lg transition hover:bg-rose-deep"
    >
      <MessageCircle size={26} />
    </a>
  );
}
