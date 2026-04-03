type ExportLinksProps = {
  csvLabel?: string;
  disabled?: boolean;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  pdfLabel?: string;
};

export function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

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
      className="ui-download-button rounded-full px-3.5 py-2 text-[13px] font-medium text-[color:var(--ink2)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="ui-download-button__icon bg-[rgba(45,122,79,0.12)] text-[color:var(--green)]">
        <DownloadIcon />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ExportLinks({
  csvLabel = "Ladda ner som CSV",
  disabled = false,
  onExportCsv,
  onExportPdf,
  pdfLabel = "Ladda ner som PDF",
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
