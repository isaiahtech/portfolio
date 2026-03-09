import Gallery from "@/components/Gallery";
import { getInstagramMedia } from "@/lib/instagram";

export default async function Home() {
  const media = await getInstagramMedia();
  return <Gallery media={media} />;
}
