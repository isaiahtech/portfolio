export interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

interface InstagramAPIResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

// Shown when Instagram credentials are not configured
export const PLACEHOLDER_MEDIA: InstagramMedia[] = Array.from(
  { length: 12 },
  (_, i) => ({
    id: `placeholder-${i}`,
    media_type: "IMAGE" as const,
    media_url: `/gallery/placeholder-${i + 1}.svg`,
    permalink: "#",
    caption: "",
    timestamp: new Date().toISOString(),
  })
);

export async function getInstagramMedia(): Promise<InstagramMedia[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  const limit = process.env.INSTAGRAM_POST_LIMIT ?? "12";

  if (!token || !userId) {
    console.warn(
      "[Instagram] INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID not set. " +
        "Falling back to placeholder images."
    );
    return PLACEHOLDER_MEDIA;
  }

  const fields =
    "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp";
  const url = `https://graph.instagram.com/v21.0/${userId}/media?fields=${fields}&limit=${limit}&access_token=${token}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Instagram] API error ${response.status}: ${errorBody}`);
      return PLACEHOLDER_MEDIA;
    }

    const json: InstagramAPIResponse = await response.json();

    return json.data.filter(
      (item) =>
        item.media_type === "IMAGE" || item.media_type === "CAROUSEL_ALBUM"
    );
  } catch (error) {
    console.error("[Instagram] Fetch failed:", error);
    return PLACEHOLDER_MEDIA;
  }
}
