import Gallery from "@/components/Gallery";
import { photos } from "@/lib/photos";

export default function Home() {
  return <Gallery photos={photos} />;
}
