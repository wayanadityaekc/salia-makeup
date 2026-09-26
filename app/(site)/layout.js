import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { UserProvider } from "@/components/auth/UserProvider";

export default function SiteLayout({ children }) {
  return (
    <UserProvider>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </UserProvider>
  );
}
