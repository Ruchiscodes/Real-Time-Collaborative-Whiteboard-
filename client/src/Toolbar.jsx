const TOOLS = [
  ["select","↖","Select"],["pencil","✎","Pencil"],["line","／","Line"],["arrow","➜","Arrow"],
  ["rectangle","□","Rectangle"],["ellipse","○","Ellipse"],["diamond","◇","Diamond"],["triangle","△","Triangle"],
  ["text","T","Text"],["sticky","▤","Sticky note"],["frame","▣","Frame"],["eraser","⌫","Eraser"],
  ["pan","✋","Pan"],["laser","✦","Laser"]
];

export default function Toolbar({ tool, setTool, onUndo, onRedo, onClear }) {
  return <aside className="toolbar">
    {TOOLS.map(([id, icon, label]) => (
      <button key={id} title={label} className={tool === id ? "active" : ""} onClick={() => setTool(id)}>
        <span>{icon}</span><small>{label}</small>
      </button>
    ))}
    <div className="toolbar-divider" />
    <button title="Undo" onClick={onUndo}>↶<small>Undo</small></button>
    <button title="Redo" onClick={onRedo}>↷<small>Redo</small></button>
    <button title="Clear board" onClick={onClear}>⌧<small>Clear</small></button>
  </aside>;
}
