import fs from 'fs';
import path from 'path';
import Gallery from "@/components/Gallery";

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

export default function Home() {
  const galleryDir = path.join(process.cwd(), 'public', 'gallery');
  const files = fs.existsSync(galleryDir)
    ? fs.readdirSync(galleryDir).filter((f) =>
        IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase())
      )
    : [];

  const photos = files.map((f) => ({ src: `/gallery/${f}` }));

  return <Gallery photos={photos} />;
}
