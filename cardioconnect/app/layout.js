import "./globals.css";

export const metadata = {
  title: "CardioConnect — Patient Contact Manager",
  description: "Manage patient contacts, send WhatsApp/SMS messages, and organize your cardiology practice.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f5f0]">{children}</body>
    </html>
  );
}
