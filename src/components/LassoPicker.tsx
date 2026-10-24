"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo, Point } from "@/lib/image";

const MIN_POINTS = 8;
const MIN_STEP = 3;

/**
 * 写真の上を指でなぞって、気になる部分を囲む（Pointer Events + Canvas）。
 * onChange には、写真のピクセル座標の点（囲めていないときは null）を渡す
 */
export function LassoPicker({
  photo,
  points,
  onChange,
}: {
  photo: Photo;
  points: Point[] | null;
  onChange: (points: Point[] | null) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Point[] | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const observer = new ResizeObserver(() => setSize({ w: img.clientWidth, h: img.clientHeight }));
    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  const scale = size.w > 0 ? photo.width / size.w : 1;

  const draw = useCallback(
    (shape: Point[], closed: boolean) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || size.w === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size.w * dpr;
      canvas.height = size.h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);
      if (shape.length < 2) return;

      const path = new Path2D();
      shape.forEach((p, i) => (i === 0 ? path.moveTo(p.x, p.y) : path.lineTo(p.x, p.y)));
      if (closed) {
        path.closePath();
        // 囲んだ外側を暗くして、選んだ場所を目立たせる
        const dim = new Path2D();
        dim.rect(0, 0, size.w, size.h);
        dim.addPath(path);
        ctx.fillStyle = "rgba(31, 42, 68, 0.55)";
        ctx.fill(dim, "evenodd");
      }
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 7;
      ctx.stroke(path);
      ctx.strokeStyle = "#ffb703";
      ctx.lineWidth = 4;
      ctx.stroke(path);
    },
    [size],
  );

  // 囲み終わった形を、画面の大きさに合わせて描く
  useEffect(() => {
    if (drawing.current) return;
    draw(points ? points.map((p) => ({ x: p.x / scale, y: p.y / scale })) : [], points !== null);
  }, [points, scale, draw]);

  function position(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = [position(event)];
    onChange(null);
    draw([], false);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const shape = drawing.current;
    if (!shape) return;
    const p = position(event);
    const last = shape[shape.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < MIN_STEP) return;
    shape.push(p);
    draw(shape, false);
  }

  function finish() {
    const shape = drawing.current;
    drawing.current = null;
    if (!shape || shape.length < MIN_POINTS) {
      draw([], false);
      onChange(null);
      return;
    }
    onChange(shape.map((p) => ({ x: p.x * scale, y: p.y * scale })));
  }

  return (
    <div className="paper-card relative overflow-hidden bg-ink select-none">
      {/* eslint-disable-next-line @next/next/no-img-element -- 撮ったばかりの写真（data URL）を表示する */}
      <img ref={imgRef} src={photo.dataUrl} alt="撮った しゃしん" className="block w-full" draggable={false} />
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h, touchAction: "none" }}
        className="absolute inset-0 cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
    </div>
  );
}
