'use client';

interface EditorPageHeaderProps {
  title: string;
  description: string;
  /** @deprecated back navigation now lives in the editor header */
  lang?: string;
  /** @deprecated back navigation now lives in the editor header */
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export function EditorPageHeader({
  title,
  description,
  actions,
}: EditorPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
      {actions && <div className="flex gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
