"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { containCamera, zoomAt, type ContentBounds, type Point, type TreeCamera } from "@/lib/tree-camera";

type Gesture = { camera: TreeCamera; points: Point[] };

export function useTreeCamera(bounds: ContentBounds, subject: Point) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<TreeCamera>({ x: 0, y: 0, scale: 1 });
  const [camera, setCamera] = useState<TreeCamera>({ x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const moved = useRef(false);
  const [dragging, setDragging] = useState(false);

  const commit = useCallback((next: TreeCamera) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const contained = containCamera(next, { width: canvas.clientWidth, height: canvas.clientHeight }, bounds);
    cameraRef.current = contained;
    setCamera(contained);
  }, [bounds]);

  const center = useCallback((point = subject, resetZoom = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = resetZoom ? 1 : cameraRef.current.scale;
    commit({ x: canvas.clientWidth / 2 - point.x * scale, y: canvas.clientHeight / 2 - point.y * scale, scale });
  }, [commit, subject]);

  const zoom = useCallback((scale: number, anchor?: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    commit(zoomAt(cameraRef.current, scale, anchor ?? { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }));
  }, [commit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Observer also handles orientation changes and the initial canvas size.
    const observer = new ResizeObserver(() => center());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [center]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function wheel(event: WheelEvent) {
      if (!canvas) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
      if (event.ctrlKey || event.metaKey) {
        const rect = canvas.getBoundingClientRect();
        zoom(cameraRef.current.scale * Math.exp(-event.deltaY * unit * 0.01), { x: event.clientX - rect.left, y: event.clientY - rect.top });
      } else {
        commit({ ...cameraRef.current, x: cameraRef.current.x - event.deltaX * unit, y: cameraRef.current.y - event.deltaY * unit });
      }
    }
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  }, [commit, zoom]);

  function localPoint(event: PointerEvent<HTMLDivElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function beginGesture() {
    gesture.current = { camera: cameraRef.current, points: [...pointers.current.values()] };
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointers.current.size === 0) moved.current = false;
    pointers.current.set(event.pointerId, localPoint(event));
    // Keep a simple tap targeted at its button, and still receive pointer-up
    // if the pointer leaves the canvas before it passes the drag threshold.
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    (target ?? event.currentTarget).setPointerCapture(event.pointerId);
    beginGesture();
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, localPoint(event));
    const current = [...pointers.current.values()];
    const start = gesture.current;
    let next: TreeCamera;
    if (current.length >= 2 && start.points.length >= 2) {
      const midpoint = (points: Point[]) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
      const distance = (points: Point[]) => Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const before = midpoint(start.points);
      const after = midpoint(current);
      next = zoomAt(start.camera, start.camera.scale * distance(current) / Math.max(1, distance(start.points)), before);
      next.x += after.x - before.x;
      next.y += after.y - before.y;
    } else {
      const dx = current[0].x - start.points[0].x;
      const dy = current[0].y - start.points[0].y;
      if (!moved.current && Math.hypot(dx, dy) < 5) return;
      next = { ...start.camera, x: start.camera.x + dx, y: start.camera.y + dy };
    }
    moved.current = true;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    commit(next);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (pointers.current.size) beginGesture();
    else { gesture.current = null; setDragging(false); }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const directions: Record<string, Point> = { ArrowLeft: { x: 80, y: 0 }, ArrowRight: { x: -80, y: 0 }, ArrowUp: { x: 0, y: 80 }, ArrowDown: { x: 0, y: -80 } };
    const direction = directions[event.key];
    if (direction) commit({ ...cameraRef.current, x: cameraRef.current.x + direction.x, y: cameraRef.current.y + direction.y });
    else if (event.key === "+" || event.key === "=") zoom(cameraRef.current.scale + 0.15);
    else if (event.key === "-") zoom(cameraRef.current.scale - 0.15);
    else if (event.key === "Home") center(subject, true);
    else return;
    event.preventDefault();
  }

  return {
    canvasRef, camera, dragging, center, zoom,
    handlers: {
      onPointerDown, onPointerMove, onPointerUp,
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => { moved.current = true; onPointerUp(event); },
      onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
        // A touch starts with implicit capture on a card. Its bubbled loss of
        // capture during handoff to the canvas must not end the active gesture.
        if (event.target === event.currentTarget && pointers.current.has(event.pointerId)) onPointerUp(event);
      },
      onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
        if (moved.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
      },
      onKeyDown,
    },
  };
}
