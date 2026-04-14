export default function ManagementTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="content-panel-transition">{children}</div>;
}
