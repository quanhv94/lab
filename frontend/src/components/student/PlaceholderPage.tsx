export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-qh-muted">{description}</p>
      <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Nội dung đang được xây dựng.
      </p>
    </div>
  );
}
