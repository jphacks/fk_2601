import { CROP_MAX_EDGE, CROP_QUALITY_STEPS, IMAGE_MAX_BASE64_BYTES } from "./constants";
import { UserFacingError } from "./errors";

export type Point = { x: number; y: number };
export type Photo = { dataUrl: string; width: number; height: number };
export type Crop = { dataUrl: string; base64: string };

// 画面で扱う写真の長辺。大きい写真はメモリを使うので縮める
const PHOTO_MAX_EDGE = 1600;

function canvasOf(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new UserFacingError("しゃしんを あつかえなかったよ");
  return [canvas, ctx];
}

function photoFromSource(source: CanvasImageSource, srcWidth: number, srcHeight: number): Photo {
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(srcWidth, srcHeight));
  const width = Math.round(srcWidth * scale);
  const height = Math.round(srcHeight * scale);
  const [canvas, ctx] = canvasOf(width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), width, height };
}

/** createImageBitmap で読み込む。向きの指定に対応していない古いブラウザでは、指定なしで読み込む（その場合も、新しいブラウザは向きを自動で直す） */
async function bitmapOf(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

/** img 要素で読み込む（createImageBitmap が使えない・失敗するブラウザ向け。向きの情報はブラウザが反映する） */
async function photoViaImageElement(file: Blob): Promise<Photo> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return photoFromSource(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const HEIC_PATTERN = /heic|heif/i;

/** アルバムの写真を読み込む（向きの情報を反映し、縮める。位置情報などは引き継がない） */
export async function photoFromFile(file: Blob & { name?: string }): Promise<Photo> {
  try {
    try {
      const bitmap = await bitmapOf(file);
      const photo = photoFromSource(bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      return photo;
    } catch {
      return await photoViaImageElement(file);
    }
  } catch {
    // iPhone の HEIC 形式は、Windows や一部のブラウザでは開けない
    if (HEIC_PATTERN.test(file.type) || HEIC_PATTERN.test(file.name ?? "")) {
      throw new UserFacingError("この しゃしん（HEIC という かたち）は ひらけないよ。カメラで とるか、ほかの しゃしんを えらんでね");
    }
    throw new UserFacingError("この しゃしんは ひらけなかったよ。ほかの しゃしんを えらんでね");
  }
}

export function photoFromVideo(video: HTMLVideoElement): Photo {
  if (video.videoWidth === 0 || video.videoHeight === 0) throw new UserFacingError("カメラが まだ じゅんびできていないよ");
  return photoFromSource(video, video.videoWidth, video.videoHeight);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new UserFacingError("しゃしんを よみこめなかったよ"));
    img.src = src;
  });
}

function polygonArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * 囲んだ部分だけを切り抜く。外側は白で塗りつぶし（背景に写った人などを LLM に渡さない）、
 * 長辺 1024px の JPEG にして描き直す（EXIF も消える）。Firestore の 1MiB に収まるよう品質を調整する
 */
export async function cropLasso(photo: Photo, points: Point[]): Promise<Crop> {
  const tooSmall = new UserFacingError("ちいさすぎるよ。もういちど おおきく かこんでね");
  if (points.length < 8) throw tooSmall;

  const longEdge = Math.max(photo.width, photo.height);
  if (polygonArea(points) < photo.width * photo.height * 0.01) throw tooSmall;

  const pad = longEdge * 0.02;
  const minX = Math.max(0, Math.min(...points.map((p) => p.x)) - pad);
  const minY = Math.max(0, Math.min(...points.map((p) => p.y)) - pad);
  const maxX = Math.min(photo.width, Math.max(...points.map((p) => p.x)) + pad);
  const maxY = Math.min(photo.height, Math.max(...points.map((p) => p.y)) + pad);
  const boxW = maxX - minX;
  const boxH = maxY - minY;
  if (Math.max(boxW, boxH) < longEdge * 0.08) throw tooSmall;

  const img = await loadImage(photo.dataUrl);
  let edge = CROP_MAX_EDGE;
  for (let attempt = 0; attempt < 4; attempt++) {
    const scale = Math.min(1, edge / Math.max(boxW, boxH));
    const [canvas, ctx] = canvasOf(Math.max(1, Math.round(boxW * scale)), Math.max(1, Math.round(boxH * scale)));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = (p.x - minX) * scale;
      const y = (p.y - minY) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, minX, minY, boxW, boxH, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (const quality of CROP_QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      if (base64.length <= IMAGE_MAX_BASE64_BYTES) return { dataUrl, base64 };
    }
    edge = Math.round(edge * 0.75);
  }
  throw new UserFacingError("しゃしんが おおきすぎたよ。もういちど かこんでね");
}
