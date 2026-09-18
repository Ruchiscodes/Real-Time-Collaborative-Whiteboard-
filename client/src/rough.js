import rough from "roughjs/bin/rough";

export function drawElement(ctx, element) {
  const rc = rough.canvas(ctx.canvas);
  const { type, x, y, width = 0, height = 0, points = [], color = "#111827", strokeWidth = 2 } = element;
  const options = { stroke: color, strokeWidth, roughness: 1.2, fillStyle: "solid", fill: element.fill || undefined };

  if (type === "line") rc.line(x, y, x + width, y + height, options);
  else if (type === "arrow") {
    rc.line(x, y, x + width, y + height, options);
    const angle = Math.atan2(height, width);
    const size = 12;
    const a1 = angle + Math.PI * 0.82;
    const a2 = angle - Math.PI * 0.82;
    rc.line(x + width, y + height, x + width + Math.cos(a1) * size, y + height + Math.sin(a1) * size, options);
    rc.line(x + width, y + height, x + width + Math.cos(a2) * size, y + height + Math.sin(a2) * size, options);
  } else if (type === "rectangle" || type === "frame") rc.rectangle(x, y, width, height, options);
  else if (type === "ellipse") rc.ellipse(x + width / 2, y + height / 2, Math.abs(width), Math.abs(height), options);
  else if (type === "diamond") rc.polygon([[x + width / 2, y], [x + width, y + height / 2], [x + width / 2, y + height], [x, y + height / 2]], options);
  else if (type === "triangle") rc.polygon([[x + width / 2, y], [x + width, y + height], [x, y + height]], options);
  else if (type === "pencil" || type === "laser") {
    if (points.length > 1) rc.linearPath(points, { ...options, stroke: type === "laser" ? "#ef4444" : color });
  } else if (type === "sticky") {
    ctx.save();
    ctx.fillStyle = element.fill || "#fef08a";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = "#111827";
    ctx.font = "16px Inter, sans-serif";
    wrapText(ctx, element.text || "Note", x + 10, y + 24, Math.max(40, width - 20), 20);
    ctx.restore();
  } else if (type === "text") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${element.fontSize || 20}px Inter, sans-serif`;
    ctx.fillText(element.text || "", x, y);
    ctx.restore();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = "";
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = `${word} `;
      y += lineHeight;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}

export function elementBounds(el) {
  if (el.type === "pencil" || el.type === "laser") {
    const xs = el.points.map(p => p[0]), ys = el.points.map(p => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  return { x: Math.min(el.x, el.x + el.width), y: Math.min(el.y, el.y + el.height), width: Math.abs(el.width), height: Math.abs(el.height) };
}

export function hitTest(el, px, py, tolerance = 8) {
  const b = elementBounds(el);
  if (el.type === "text" || el.type === "sticky") return px >= b.x - tolerance && px <= b.x + b.width + tolerance && py >= b.y - tolerance && py <= b.y + b.height + tolerance;
  if (el.type === "pencil" || el.type === "laser") {
    return el.points.some(([x, y]) => Math.hypot(x - px, y - py) <= tolerance);
  }
  const inside = px >= b.x - tolerance && px <= b.x + b.width + tolerance && py >= b.y - tolerance && py <= b.y + b.height + tolerance;
  if (["rectangle", "frame", "ellipse", "diamond", "triangle"].includes(el.type)) return inside;
  return Math.hypot((el.x + el.width) - px, (el.y + el.height) - py) <= tolerance || inside;
}
