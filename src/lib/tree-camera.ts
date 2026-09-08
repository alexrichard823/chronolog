export type TreeCamera = { x: number; y: number; scale: number };
export type Point = { x: number; y: number };
export type ViewSize = { width: number; height: number };
export type ContentBounds = ViewSize & Point;

export const MIN_TREE_ZOOM = 0.5;
export const MAX_TREE_ZOOM = 1.75;

export function zoomAt(camera: TreeCamera, scale: number, anchor: Point): TreeCamera {
  const nextScale = Math.min(MAX_TREE_ZOOM, Math.max(MIN_TREE_ZOOM, scale));
  const ratio = nextScale / camera.scale;
  return {
    x: anchor.x - (anchor.x - camera.x) * ratio,
    y: anchor.y - (anchor.y - camera.y) * ratio,
    scale: nextScale,
  };
}

// Leave half a viewport of breathing room, while keeping the tree recoverable.
export function containCamera(camera: TreeCamera, size: ViewSize, bounds: ContentBounds): TreeCamera {
  return {
    ...camera,
    x: Math.min(size.width / 2 - bounds.x * camera.scale,
      Math.max(size.width / 2 - (bounds.x + bounds.width) * camera.scale, camera.x)),
    y: Math.min(size.height / 2 - bounds.y * camera.scale,
      Math.max(size.height / 2 - (bounds.y + bounds.height) * camera.scale, camera.y)),
  };
}
