import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
