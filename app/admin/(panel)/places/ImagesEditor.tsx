"use client";

import { useState } from "react";
import { signUpload } from "../../actions.ts";
import { input, secondary } from "../../ui.tsx";

export type EditableImage = { url: string; publicId?: string; alt: string; credit?: string; license?: string };

// Photo list for a place: upload (or add by URL), reorder, and describe each image. The first photo is the cover.
// The list is sent with the form as JSON in a hidden field.
export function ImagesEditor({ initial, uploads }: { initial: EditableImage[]; uploads: boolean }) {
  const [images, setImages] = useState(initial);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState("");

  const update = (i: number, patch: Partial<EditableImage>) => setImages((list) => list.map((img, j) => (j === i ? { ...img, ...patch } : img)));
  const move = (i: number, by: number) =>
    setImages((list) => {
      const next = [...list];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const added: EditableImage[] = [];
    for (const [n, file] of [...files].entries()) {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
        setStatus(`${file.name} skipped: images up to 10 MB only.`);
        continue;
      }
      setStatus(`Uploading ${n + 1} of ${files.length}…`);
      const sig = await signUpload();
      if (!sig) return setStatus("Uploads aren't configured (Cloudinary keys missing).");
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sig.apiKey);
      body.append("timestamp", String(sig.timestamp));
      body.append("signature", sig.signature);
      body.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
      if (!res.ok) {
        setStatus(`Upload of ${file.name} failed. Try again.`);
        continue;
      }
      const data: { secure_url: string; public_id: string } = await res.json();
      added.push({ url: data.secure_url, publicId: data.public_id, alt: "" });
    }
    setImages((list) => [...list, ...added].slice(0, 12));
    if (added.length) setStatus(`${added.length} uploaded. Add a description for each one.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      {uploads ? (
        <label
          className="flex cursor-pointer flex-col items-center gap-1 rounded-sm border-2 border-dashed border-border p-6 text-center text-sm hover:border-brand"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files);
          }}
        >
          <span className="font-medium">Drop photos here or choose files</span>
          <span className="text-muted">JPEG, PNG or WebP, up to 10 MB each, 12 photos at most</span>
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
        </label>
      ) : (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://upload.wikimedia.org/… or https://res.cloudinary.com/…"
            aria-label="Image URL"
            className={input}
          />
          <button
            type="button"
            className={secondary}
            onClick={() => {
              if (!url.trim()) return;
              setImages((list) => [...list, { url: url.trim(), alt: "" }].slice(0, 12));
              setUrl("");
            }}
          >
            Add
          </button>
        </div>
      )}
      <p role="status" className="text-sm text-muted">
        {status}
      </p>

      <ol className="flex flex-col gap-3">
        {images.map((img, i) => (
          <li key={img.url} className="grid gap-3 rounded-sm border border-border p-3 sm:grid-cols-[8rem_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary pasted URL */}
            <img src={img.url} alt="" className="aspect-[4/3] w-full rounded bg-border object-cover" />
            <div className="flex flex-col gap-2">
              <input
                value={img.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                required
                maxLength={150}
                placeholder="Describe the photo for people who can't see it (required)"
                aria-label={`Photo ${i + 1} description`}
                className={input}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={img.credit ?? ""} onChange={(e) => update(i, { credit: e.target.value })} placeholder="Photographer / credit" aria-label={`Photo ${i + 1} credit`} className={input} />
                <input value={img.license ?? ""} onChange={(e) => update(i, { license: e.target.value })} placeholder="Licence, e.g. CC BY-SA 4.0" aria-label={`Photo ${i + 1} licence`} className={input} />
              </div>
              <div className="flex gap-2 text-sm">
                {i === 0 && <span className="mr-auto self-center rounded-sm bg-yellow px-1.5 text-xs font-semibold text-board-ink">Cover photo</span>}
                <button type="button" className="ml-auto disabled:opacity-40" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} up`}>
                  ↑
                </button>
                <button type="button" className="disabled:opacity-40" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} down`}>
                  ↓
                </button>
                <button type="button" className="text-red-700 dark:text-red-400" onClick={() => setImages((list) => list.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
