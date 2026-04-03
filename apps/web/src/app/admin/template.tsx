export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="content-panel-transition">{children}</div>;
}
