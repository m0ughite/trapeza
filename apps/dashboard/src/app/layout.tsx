export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 24, background: "#0b0f14", color: "#e8eef4" }}>
        {children}
      </body>
    </html>
  );
}
