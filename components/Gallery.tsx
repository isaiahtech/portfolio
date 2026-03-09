"use client";

import { useState } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { motion } from "framer-motion";
import type { InstagramMedia } from "@/lib/instagram";

interface GalleryProps {
  media: InstagramMedia[];
}

const breakpointCols = {
  default: 3,
  1280: 3,
  768: 2,
  480: 1,
};

const isPlaceholder = (id: string) => id.startsWith("placeholder-");

export default function Gallery({ media }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const slides = media.map((item) => ({
    src: item.media_url,
    alt: item.caption ?? "Photo by Isaiah Dasen",
  }));

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <Masonry
        breakpointCols={breakpointCols}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {media.map((item, index) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02, y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative overflow-hidden rounded-xl cursor-pointer"
            style={{ border: "1px solid rgba(28, 27, 25, 0.08)" }}
            onClick={() => !isPlaceholder(item.id) && setLightboxIndex(index)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(196, 149, 106, 0.45)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 32px rgba(196, 149, 106, 0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(28, 27, 25, 0.08)";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            <Image
              src={item.media_url}
              alt={item.caption ?? `Photo ${index + 1}`}
              width={600}
              height={800}
              className="w-full h-auto object-cover block"
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
              unoptimized
            />

            {item.caption && (
              <div
                className="absolute inset-0 flex items-end p-4 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                }}
              >
                <p className="text-white/90 text-sm line-clamp-3 leading-snug">
                  {item.caption}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </Masonry>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        styles={{
          container: {
            backgroundColor: "rgba(20, 18, 16, 0.97)",
            backdropFilter: "blur(16px)",
          },
        }}
      />
    </div>
  );
}
