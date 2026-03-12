/**
 * fal.ai Image Generation — extracted from al-pipeline.ts
 */

export async function generateImage(opts: {
  prompt: string;
  referenceUrls?: string[];
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
}): Promise<string[]> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY is not set');

  const {
    prompt,
    referenceUrls,
    width = 1080,
    height = 1350,
    numImages = 1,
    guidanceScale = 3.0,
  } = opts;

  const useEdit = referenceUrls && referenceUrls.length > 0;
  const endpoint = useEdit
    ? 'https://fal.run/fal-ai/nano-banana/edit'
    : 'https://fal.run/fal-ai/nano-banana-pro';

  const body: Record<string, unknown> = {
    prompt,
    image_size: { width, height },
    num_images: numImages,
    num_inference_steps: 8,
    guidance_scale: guidanceScale,
  };

  if (useEdit) {
    body.image_urls = referenceUrls;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`fal.ai error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (data.images || []).map((img: { url: string }) => img.url);
}
