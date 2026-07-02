import { S } from "@/styles/sharedStyles";
import { Image as ImageIcon, Camera } from "lucide-react";

/** Galerie photo (placeholder). @param {{ count: number }} props */
export default function PhotoGallery({ count }) {
  return (
    <div style={S.gallery}>
      <div style={S.galleryMain}>
        <ImageIcon size={28} strokeWidth={1.25} color="var(--ink-soft)" style={{ opacity: 0.5 }} />
      </div>
      <button style={S.galleryCount}>
        <Camera size={13} /> {count} photos
      </button>
    </div>
  );
}
