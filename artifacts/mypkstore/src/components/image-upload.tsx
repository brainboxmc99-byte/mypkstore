import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export function ImageUpload({ label, value, onChange, placeholder }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "https://... or upload below"}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-20 w-20 object-cover rounded border mt-1"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
    </div>
  );
}
