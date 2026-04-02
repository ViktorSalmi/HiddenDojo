type ExportLinksProps = {
  csvLabel?: string;
  disabled?: boolean;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  pdfLabel?: string;
};

function ExportLink({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink2)] transition-colors hover:border-[#bbbbbb] hover:text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function ExportLinks({
  csvLabel = "Exportera CSV",
  disabled = false,
  onExportCsv,
  onExportPdf,
  pdfLabel = "Exportera PDF",
}: ExportLinksProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <ExportLink
        disabled={disabled || !onExportCsv}
        label={csvLabel}
        onClick={onExportCsv}
      />
      <ExportLink
        disabled={disabled || !onExportPdf}
        label={pdfLabel}
        onClick={onExportPdf}
      />
    </div>
  );
}
