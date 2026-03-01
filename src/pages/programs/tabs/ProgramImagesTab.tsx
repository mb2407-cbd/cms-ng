/**
 * @file ProgramImagesTab.tsx
 * @description Images tab for viewing program images grouped by category/type
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useMemo, useEffect, useState } from 'react';
import { Image as ImageIcon, ExternalLink, Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getProgramImages, uploadProgramImage } from '../../../services/program.service';
import type { Program, ProgramImage } from '../../../types';

// Image categories from old system (programs.service.ts)
const IMAGE_CATEGORIES_ORDER = [
  'Iconic',
  'Poster Art',
  'VOD Art',
  'Box Art',
  'Key Art',
  'Banner-L1',
  'Banner-L2',
  'Banner-L3',
  'Staple',
  'Background',
  'Logo',
];

interface ProgramImagesTabProps {
  program: Partial<Program>;
  onChange: (field: string, value: any) => void;
  readOnly: boolean;
}

const ProgramImagesTab: React.FC<ProgramImagesTabProps> = ({ program, readOnly }) => {
  const [fetchedImages, setFetchedImages] = useState<ProgramImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Iconic');
  const [uploadRatio, setUploadRatio] = useState('16:9');
  const [uploadWidth, setUploadWidth] = useState<number | null>(null);
  const [uploadHeight, setUploadHeight] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [publishOnUpload, setPublishOnUpload] = useState(false);
  const [publishingImageId, setPublishingImageId] = useState<string>('');

  // Determine the base program ID (strip version suffix for image API call)
  const programBaseId = useMemo(() => {
    const id = program.id || '';
    // Program IDs like SH010064900000001 - base is SH010064900000 (14 chars)
    // If id is longer than 14 chars and starts with 2 letters, strip trailing version digits
    if (id.length > 14 && /^[A-Z]{2}/.test(id)) {
      return id.substring(0, 14);
    }
    return id;
  }, [program.id]);

  // Fetch images from API if program data doesn't include them
  useEffect(() => {
    const hasInlineImages =
      (program.images && program.images.length > 0) ||
      (program.publishedImages && program.publishedImages.length > 0) ||
      (program.programImages && Object.keys(program.programImages).length > 0);

    if (!hasInlineImages && programBaseId) {
      setIsLoadingImages(true);
      getProgramImages(programBaseId)
        .then((response: any) => {
          const imgs = response?.response || response || [];
          if (Array.isArray(imgs)) {
            setFetchedImages(imgs);
          }
        })
        .catch((err) => {
          console.error('[ProgramImagesTab] Failed to fetch images:', err);
        })
        .finally(() => setIsLoadingImages(false));
    }
  }, [programBaseId, program.images, program.publishedImages, program.programImages]);

  const refreshImages = async () => {
    if (!programBaseId) return;
    const response: any = await getProgramImages(programBaseId);
    const imgs = response?.response || response || [];
    if (Array.isArray(imgs)) {
      setFetchedImages(imgs);
    }
  };

  // Collect all images from different sources
  const allImages = useMemo(() => {
    const images: ProgramImage[] = [];
    // Prefer latest backend state when available
    if (fetchedImages.length > 0) images.push(...fetchedImages);
    if (program.images) images.push(...program.images);
    if (program.programImages) {
      Object.values(program.programImages).forEach((imgs) => {
        if (Array.isArray(imgs)) images.push(...imgs);
      });
    }
    if (program.publishedImages) images.push(...program.publishedImages);
    // Deduplicate by id
    const seen = new Set<string>();
    return images.filter((img) => {
      if (!img.id || seen.has(img.id)) return false;
      seen.add(img.id);
      return true;
    });
  }, [program.images, program.programImages, program.publishedImages, fetchedImages]);

  // Group images by category, ordered by IMAGE_CATEGORIES_ORDER
  const groupedImages = useMemo(() => {
    const groups: Record<string, ProgramImage[]> = {};
    allImages.forEach((image) => {
      const category = image.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(image);
    });
    // Sort: known categories first in order, then others alphabetically
    const sorted: [string, ProgramImage[]][] = [];
    IMAGE_CATEGORIES_ORDER.forEach((cat) => {
      if (groups[cat]) { sorted.push([cat, groups[cat]]); delete groups[cat]; }
    });
    Object.keys(groups).sort().forEach((cat) => sorted.push([cat, groups[cat]]));
    return sorted;
  }, [allImages]);

  const getImageUrl = (image: ProgramImage): string => {
    if (image.imageURL) return image.imageURL;
    if (image.uri && image.baseUrl) return `${image.baseUrl}${image.uri}`;
    if (image.uri) return image.uri;
    return '';
  };

  const gcd = (a: number, b: number): number => {
    if (b === 0) return a;
    return gcd(b, a % b);
  };

  const setFileAndDimensions = (file: File) => {
    setSelectedFile(file);
    setUploadError('');
    setUploadSuccess('');

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      setUploadWidth(width);
      setUploadHeight(height);
      if (width > 0 && height > 0) {
        const divisor = gcd(width, height);
        setUploadRatio(`${width / divisor}:${height / divisor}`);
      }
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      setUploadWidth(null);
      setUploadHeight(null);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleUpload = async () => {
    if (!programBaseId || !selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('images[0].category', uploadCategory);
      formData.append('images[0].ratio', uploadRatio);
      formData.append('images[0].published', publishOnUpload ? 'true' : 'false');
      if (uploadWidth != null) formData.append('images[0].width', String(uploadWidth));
      if (uploadHeight != null) formData.append('images[0].height', String(uploadHeight));
      formData.append('images[0].imageFile', selectedFile);

      await uploadProgramImage(programBaseId, formData);
      await refreshImages();
      setSelectedFile(null);
      setUploadWidth(null);
      setUploadHeight(null);
      setPublishOnUpload(false);
      setUploadSuccess('Image uploaded successfully.');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPublished = async (image: ProgramImage) => {
    if (!programBaseId || !image.id || publishingImageId) return;
    setPublishingImageId(image.id);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('images[0].id', image.id);
      formData.append('images[0].published', 'true');
      formData.append('images[0].ratio', image.ratio || '');
      if (image.width != null) formData.append('images[0].width', String(image.width));
      if (image.height != null) formData.append('images[0].height', String(image.height));
      if (image.resized != null) formData.append('images[0].resized', String(image.resized));

      await uploadProgramImage(programBaseId, formData);
      await refreshImages();
      setUploadSuccess(`Published image for ratio ${image.ratio}.`);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to publish image.');
    } finally {
      setPublishingImageId('');
    }
  };

  const uploadPanel = !readOnly ? (
    <section className="p-4 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]">
      <h2 className="text-base font-semibold text-[var(--color-neutral-800)] dark:text-white mb-3">
        Upload New Image
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-1">
            Image File
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setFileAndDimensions(file);
            }}
            className="block w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-[var(--color-primary-600)] file:text-white file:cursor-pointer"
          />
          {selectedFile && (
            <p className="text-xs mt-1 text-[var(--color-neutral-500)]">
              {selectedFile.name}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-1">
            Category
          </label>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="w-full px-2.5 py-2 text-sm rounded border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-800)]"
          >
            {IMAGE_CATEGORIES_ORDER.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-1">
            Ratio
          </label>
          <input
            type="text"
            value={uploadRatio}
            onChange={(e) => setUploadRatio(e.target.value)}
            placeholder="16:9"
            className="w-full px-2.5 py-2 text-sm rounded border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-800)]"
          />
          {uploadWidth && uploadHeight && (
            <p className="text-xs mt-1 text-[var(--color-neutral-500)]">
              {uploadWidth}x{uploadHeight}
            </p>
          )}
        </div>
      </div>

      <label className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
        <input
          type="checkbox"
          checked={publishOnUpload}
          onChange={(e) => setPublishOnUpload(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--color-neutral-300)]"
        />
        Mark as published (will replace currently published image with same ratio/type)
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || !programBaseId || isUploading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>

        {uploadError && (
          <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            {uploadError}
          </span>
        )}
        {uploadSuccess && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 size={16} />
            {uploadSuccess}
          </span>
        )}
      </div>
    </section>
  ) : null;

  if (isLoadingImages) {
    return (
      <div className="max-w-5xl">
        {uploadPanel}
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="text-[var(--color-primary-500)] mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
            Loading Images...
          </h3>
        </div>
      </div>
    );
  }

  if (allImages.length === 0) {
    return (
      <div className="max-w-5xl space-y-6">
        {uploadPanel}
        <div className="flex flex-col items-center justify-center py-20">
          <ImageIcon size={48} className="text-[var(--color-neutral-300)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mb-2">
            No Images Available
          </h3>
          <p className="text-sm text-[var(--color-neutral-500)]">
            No images have been added to this program
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {uploadPanel}
      <div className="flex items-center gap-4 text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
        <span className="font-medium">{allImages.length} total images</span>
        <span className="text-[var(--color-neutral-400)]">|</span>
        <span>{groupedImages.length} categories</span>
      </div>

      {groupedImages.map(([category, images]) => (
        <section key={category}>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
            {category} <span className="text-sm font-normal text-[var(--color-neutral-500)]">({images.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => {
              const imageUrl = getImageUrl(image);
              return (
                <div
                  key={image.id || index}
                  className="rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] overflow-hidden"
                >
                  {/* Image Preview */}
                  <div className="relative aspect-video bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${category} - ${image.ratio || ''}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const msg = document.createElement('div');
                            msg.className = 'text-sm text-center p-2';
                            msg.style.color = 'var(--color-neutral-400)';
                            msg.textContent = 'Image not available';
                            parent.appendChild(msg);
                          }
                        }}
                      />
                    ) : (
                      <ImageIcon size={32} className="text-[var(--color-neutral-400)]" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {image.published && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {image.ratio && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {image.ratio}
                          </span>
                        )}
                        {image.width && image.height && (
                          <span className="text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                            {image.width}x{image.height}
                          </span>
                        )}
                      </div>
                      {imageUrl && (
                        <a href={imageUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] dark:text-[var(--color-primary-400)]"
                          title="Open full size">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        disabled={!!image.published || publishingImageId === image.id || !!publishingImageId}
                        onClick={() => handleSetPublished(image)}
                        className="w-full px-2.5 py-1.5 text-xs font-medium rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishingImageId === image.id
                          ? 'Publishing...'
                          : image.published
                            ? 'Published'
                            : 'Set as Published'}
                      </button>
                    )}
                    <div className="text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] space-y-0.5">
                      {image.tier && Array.isArray(image.tier) && image.tier.length > 0 && (
                        <div>Tier: {image.tier.join(', ')}</div>
                      )}
                      {image.source && <div>Source: {image.source}</div>}
                      {image.imageLang && <div>Lang: {image.imageLang.toUpperCase()}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProgramImagesTab;
