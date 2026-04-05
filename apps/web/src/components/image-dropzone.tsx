'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Badge, Button, Card } from 'ui';
import { cn } from 'utils';

import { getFileStorageProvider } from '../lib/file-storage';
import type {
  FileStorageProvider,
  UploadFileContext,
} from '../lib/file-storage';

type UploadItem = {
  id: string;
  error?: string;
  file: File;
  previewUrl: string;
  status: 'uploading' | 'error';
};

interface ImageDropzoneProps {
  accept?: string[];
  disabled?: boolean;
  maxFileCount: number;
  maxFileSizeBytes: number;
  onChange: (value: string[]) => void;
  provider?: FileStorageProvider;
  uploadContext: UploadFileContext;
  value: string[];
}

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createUploadItem(file: File): UploadItem {
  const itemId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${file.name}-${Date.now()}-${Math.random()}`;

  return {
    id: itemId,
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'uploading',
  };
}

export function ImageDropzone({
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
  maxFileCount,
  maxFileSizeBytes,
  onChange,
  provider,
  uploadContext,
  value,
}: ImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadsRef = useRef<UploadItem[]>([]);
  const storageProvider = provider ?? getFileStorageProvider();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((upload) => {
        URL.revokeObjectURL(upload.previewUrl);
      });
    };
  }, []);

  const isBusy = uploads.some((upload) => upload.status === 'uploading');
  const remainingSlots = maxFileCount - value.length;

  async function uploadItems(items: UploadItem[], nextValue: string[]) {
    const uploadedUrls: string[] = [];

    for (const item of items) {
      try {
        const result = await storageProvider.uploadFile({
          file: item.file,
          context: uploadContext,
        });
        uploadedUrls.push(result.url);
        URL.revokeObjectURL(item.previewUrl);
        setUploads((current) =>
          current.filter((candidate) => candidate.id !== item.id),
        );
      } catch (error) {
        setUploads((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'No fue posible subir la imagen.',
                  status: 'error',
                }
              : candidate,
          ),
        );
      }
    }

    if (uploadedUrls.length) {
      onChange(nextValue.concat(uploadedUrls).slice(0, maxFileCount));
      setErrorMessage(null);
    }
  }

  async function processFiles(fileList: FileList | File[]) {
    if (disabled || isBusy) {
      return;
    }

    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length === 0) {
      return;
    }

    const replacingSingleImage = maxFileCount === 1;
    const nextValue = replacingSingleImage ? [] : value;
    const nextRemainingSlots = maxFileCount - nextValue.length;

    if (selectedFiles.length > nextRemainingSlots) {
      setErrorMessage(
        `Solo puedes mantener hasta ${maxFileCount} imagen(es) aquí.`,
      );
      return;
    }

    for (const file of selectedFiles) {
      if (!accept.includes(file.type)) {
        setErrorMessage('Selecciona imágenes JPG, PNG o WEBP válidas.');
        return;
      }

      if (file.size > maxFileSizeBytes) {
        setErrorMessage(
          `Cada archivo debe pesar menos de ${formatFileSize(maxFileSizeBytes)}.`,
        );
        return;
      }
    }

    const items = selectedFiles.map(createUploadItem);
    setErrorMessage(null);
    setUploads(items);

    if (replacingSingleImage && value.length) {
      onChange([]);
    }

    await uploadItems(items, nextValue);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function retryUpload(item: UploadItem) {
    setErrorMessage(null);
    setUploads((current) =>
      current.map((candidate) =>
        candidate.id === item.id
          ? { ...candidate, error: undefined, status: 'uploading' }
          : candidate,
      ),
    );

    await uploadItems(
      [{ ...item, error: undefined, status: 'uploading' }],
      value,
    );
  }

  function removeImageAt(index: number) {
    if (disabled || isBusy) {
      return;
    }

    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="space-y-3">
      <input
        accept={accept.join(',')}
        className="sr-only"
        disabled={disabled || isBusy}
        id={inputId}
        multiple={maxFileCount > 1}
        onChange={(event) => {
          void processFiles(event.target.files ?? []);
        }}
        ref={inputRef}
        type="file"
      />

      <div
        aria-disabled={disabled || isBusy}
        className={cn(
          'rounded-[var(--radius-lg)] border border-dashed border-border-subtle bg-white/70 p-5 transition-colors',
          isDragging && 'border-secondary bg-secondary/5',
          disabled && 'opacity-60',
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !isBusy) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void processFiles(event.dataTransfer.files);
        }}
        onKeyDown={(event) => {
          if (
            (event.key === 'Enter' || event.key === ' ') &&
            !disabled &&
            !isBusy
          ) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="icon-tile size-11 rounded-2xl">
              <UploadCloud className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-text-secondary">
                Arrastra imágenes aquí o selecciónalas manualmente
              </p>
              <p className="text-sm text-text-muted">
                {`Hasta ${maxFileCount} archivo(s). JPG, PNG o WEBP. Máximo ${formatFileSize(
                  maxFileSizeBytes,
                )} por imagen.`}
              </p>
            </div>
          </div>
          <Button
            disabled={disabled || isBusy || remainingSlots <= 0}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="secondary"
          >
            <ImagePlus className="mr-2 size-4" />
            {maxFileCount === 1 ? 'Seleccionar imagen' : 'Seleccionar imágenes'}
          </Button>
        </div>
      </div>

      {errorMessage ? <p className="field-error">{errorMessage}</p> : null}

      {value.length || uploads.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((imageUrl, index) => (
            <Card
              className="space-y-3 p-3"
              interactive={false}
              key={imageUrl}
              variant="soft"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-base">
                <img
                  alt={`Imagen subida ${index + 1}`}
                  className="h-full w-full object-cover"
                  src={imageUrl}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="success">Lista</Badge>
                <Button
                  disabled={disabled || isBusy}
                  onClick={() => removeImageAt(index)}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="mr-2 size-4" />
                  Quitar
                </Button>
              </div>
            </Card>
          ))}

          {uploads.map((upload) => (
            <Card
              className="space-y-3 p-3"
              interactive={false}
              key={upload.id}
              variant="soft"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-base">
                <img
                  alt={upload.file.name}
                  className="h-full w-full object-cover"
                  src={upload.previewUrl}
                />
              </div>
              <div className="space-y-2">
                <p className="truncate text-sm font-medium text-text-secondary">
                  {upload.file.name}
                </p>
                <div className="flex items-center justify-between gap-2">
                  {upload.status === 'uploading' ? (
                    <Badge variant="info">
                      <LoaderCircle className="mr-2 size-3 animate-spin" />
                      Subiendo...
                    </Badge>
                  ) : (
                    <Badge variant="error">Error</Badge>
                  )}
                  {upload.status === 'error' ? (
                    <Button
                      onClick={() => {
                        void retryUpload(upload);
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <RefreshCw className="mr-2 size-4" />
                      Reintentar
                    </Button>
                  ) : null}
                </div>
                {upload.error ? (
                  <p className="field-error">{upload.error}</p>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
