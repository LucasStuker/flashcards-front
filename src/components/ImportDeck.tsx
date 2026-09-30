"use client";

type Props = {
  onFile: (file: File | null) => void;
  uploading: boolean;
  variant?: "button" | "dropzone";
};

export function ImportDeck({ onFile, uploading, variant = "button" }: Props) {
  if (variant === "dropzone") {
    return (
      <label
        htmlFor="pdf-upload"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex cursor-pointer flex-col items-start gap-2 border border-dashed border-line bg-panel px-4 py-5 text-sm transition hover:border-accent ${
          uploading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        <span className="font-medium text-ink">
          {uploading ? "Enviando PDF…" : "Nenhum deck ainda"}
        </span>
        <span className="text-muted">
          Arraste um PDF ou clique para selecionar (máx. 40 MB).
        </span>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            onFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </label>
    );
  }

  return (
    <label
      htmlFor="pdf-upload-header"
      className={`inline-flex cursor-pointer bg-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-deep ${
        uploading ? "pointer-events-none opacity-70" : ""
      }`}
    >
      {uploading ? "Enviando…" : "Novo deck"}
      <input
        id="pdf-upload-header"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </label>
  );
}
