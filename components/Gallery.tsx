"use client";

import { useState } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { motion } from "framer-motion";
import type { Photo } from "@/lib/photos";

interface GalleryProps {
  photos: Photo[];
}

const breakpointCols = {
  default: 3,
  1280: 3,
  768: 2,
  480: 1,
};

export default function Gallery({ photos }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const slides = photos.map((p) => ({
    src: p.src,
    alt: p.alt ?? "Photo by Isaiah Dasen",
  }));

  return (
    <div className="px-6 py-6">
      <Masonry
        breakpointCols={breakpointCols}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {photos.map((photo, index) => (
          <motion.div
            key={photo.src}
            whileHover={{ scale: 1.02, y: -3 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative overflow-hidden rounded-xl cursor-pointer"
            style={{ border: "1px solid rgba(28, 27, 25, 0.08)" }}
            onClick={() => setLightboxIndex(index)}
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
              src={photo.src}
              alt={photo.alt ?? `Photo ${index + 1}`}
              width={600}
              height={800}
              className="w-full h-auto object-cover block"
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
              unoptimized
            />

            {photo.alt && (
              <div
                className="absolute inset-0 flex items-end p-4 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                }}
              >
                <p className="text-white/90 text-sm line-clamp-3 leading-snug">
                  {photo.alt}
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
