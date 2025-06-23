export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="pt-20 px-4 sm:px-6 lg:px-8">{children}</div>;
} 