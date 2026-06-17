import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '@/lib/upload';
import { getErrorMessage } from '@/lib/api';
import { Spinner } from './Spinner';

export function ImageUpload({ value = [], onChange, folder = 'dishes', max = 4 }: {
  value?: string[]; onChange: (urls: string[]) => void; folder?: string; max?: number;
}) {
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = [...value];
      for (const f of files.slice(0, max - value.length)) urls.push(await uploadImage(f, folder));
      onChange(urls);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
            <img src={url} className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute right-0 top-0 bg-black/50 p-0.5 text-white"><X className="h-3 w-3" /></button>
          </div>
        ))}
        {value.length < max && (
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed text-slate-400 hover:border-brand-400">
            {busy ? <Spinner /> : <Upload className="h-5 w-5" />}
            <input type="file" accept="image/*" multiple hidden onChange={onPick} />
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">Up to {max} images. Requires Cloudinary configured.</p>
    </div>
  );
}
