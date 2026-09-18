import { useEffect, useMemo, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import { boardApi } from "./api";
import { createBoardSocket } from "./ws";
import { drawElement, hitTest } from "./rough";

const COLORS = ["#111827","#2563eb","#16a34a","#dc2626","#9333ea","#f97316"];
const uid = () => crypto.randomUUID();

export default function Whiteboard({ boardId, onBack }) {
  const canvasRef = useRef(null), socketRef = useRef(null), sceneRef = useRef([]);
  const historyRef = useRef([]), redoRef = useRef([]);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#111827");
  const [size, setSize] = useState(2);
  const [status, setStatus] = useState("Connecting…");
  const [users, setUsers] = useState([]);
  const [board, setBoard] = useState(null);
  const drawing = useRef(null);
  const viewport = useRef({ x:0, y:0, scale:1 });
  const lastPointer = useRef({x:0,y:0});
  const token = localStorage.getItem("collabboard_token");

  const user = useMemo(() => JSON.parse(localStorage.getItem("collabboard_user") || "{}"), []);

  useEffect(() => {
    boardApi.get(boardId).then(data => {
      setBoard(data);
      sceneRef.current = data.elements || [];
      render();
    }).catch(console.error);

    socketRef.current = createBoardSocket(boardId, token, {
      onOpen: () => { setStatus("Live"); socketRef.current.send({type:"presence", user:{id:user.id,name:user.name}}); },
      onMessage: msg => {
        if (msg.type === "init") { sceneRef.current = msg.elements || []; render(); setUsers(msg.users || []); }
        if (msg.type === "presence") setUsers(msg.users || []);
        if (msg.type === "operation") applyRemote(msg.operation);
      },
      onError: () => setStatus("Connection error"),
      onClose: () => setStatus("Disconnected")
    });
    return () => socketRef.current?.close();
  }, [boardId]);

  function screenToWorld(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return { x:(e.clientX-r.left-viewport.current.x)/viewport.current.scale, y:(e.clientY-r.top-viewport.current.y)/viewport.current.scale };
  }
  function render() {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth*dpr; c.height=c.clientHeight*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,c.clientWidth,c.clientHeight);
    ctx.save();
    ctx.translate(viewport.current.x, viewport.current.y);
    ctx.scale(viewport.current.scale, viewport.current.scale);
    sceneRef.current.forEach(el => drawElement(ctx, el));
    ctx.restore();
  }

  useEffect(() => {
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function broadcast(operation) { socketRef.current?.send({type:"operation", operation}); }

  function commit(operation) {
    historyRef.current.push(JSON.stringify(sceneRef.current));
    if (historyRef.current.length > 50) historyRef.current.shift();
    redoRef.current = [];
    broadcast(operation);
    render();
  }

  function applyRemote(op) {
    if (op.action === "add") sceneRef.current.push(op.element);
    if (op.action === "update") sceneRef.current = sceneRef.current.map(e=>e.id===op.element.id?op.element:e);
    if (op.action === "delete") sceneRef.current = sceneRef.current.filter(e=>e.id!==op.id);
    if (op.action === "replace") sceneRef.current = op.elements || [];
    render();
  }

  function pointerDown(e) {
    const p=screenToWorld(e); lastPointer.current=p;
    if (tool==="eraser") { const target=[...sceneRef.current].reverse().find(el=>hitTest(el,p.x,p.y,12)); if(target){sceneRef.current=sceneRef.current.filter(el=>el.id!==target.id);commit({action:"delete",id:target.id});} return; }
    if (tool==="select") { drawing.current={kind:"select", start:p, target:[...sceneRef.current].reverse().find(el=>hitTest(el,p.x,p.y,8))}; return; }
    if (tool==="pan") { drawing.current={kind:"pan",start:{x:e.clientX,y:e.clientY},origin:{...viewport.current}}; return; }
    const base={id:uid(),type:tool,x:p.x,y:p.y,width:0,height:0,color,strokeWidth:size};
    if(tool==="text"){ const text=window.prompt("Text"); if(text){base.text=text;base.fontSize=20;base.width=Math.max(40,text.length*11);base.height=28;sceneRef.current.push(base);commit({action:"add",element:base});} return; }
    if(tool==="sticky"){base.text="Double-click to edit";base.fill="#fef08a";base.width=180;base.height=120;sceneRef.current.push(base);commit({action:"add",element:base});return;}
    drawing.current={kind:"draw",element:base};
    sceneRef.current.push(base);
  }

  function pointerMove(e) {
    const p=screenToWorld(e);
    if(!drawing.current)return;
    if(drawing.current.kind==="pan"){viewport.current.x=drawing.current.origin.x+(e.clientX-drawing.current.start.x);viewport.current.y=drawing.current.origin.y+(e.clientY-drawing.current.start.y);render();return;}
    if(drawing.current.kind==="select" && drawing.current.target){
      const t=drawing.current.target, dx=p.x-drawing.current.start.x, dy=p.y-drawing.current.start.y;
      t.x+=dx;t.y+=dy;drawing.current.start=p;render();
      broadcast({action:"update",element:t});return;
    }
    const el=drawing.current.element;
    if(tool==="pencil"||tool==="laser"){ if(!el.points)el.points=[[el.x,el.y]];el.points.push([p.x,p.y]); }
    else {el.width=p.x-el.x;el.height=p.y-el.y;}
    lastPointer.current=p; render();
  }

  function pointerUp() {
    if(!drawing.current)return;
    if(drawing.current.kind==="draw"){const el=drawing.current.element; if((el.points?.length||0)>1 || Math.abs(el.width)>2 || Math.abs(el.height)>2) commit({action:"add",element:el}); else sceneRef.current=sceneRef.current.filter(x=>x.id!==el.id);}
    drawing.current=null; render();
  }

  function undo(){
    const prev=historyRef.current.pop(); if(!prev)return;
    redoRef.current.push(JSON.stringify(sceneRef.current)); sceneRef.current=JSON.parse(prev); broadcast({action:"replace",elements:sceneRef.current}); render();
  }
  function redo(){
    const next=redoRef.current.pop(); if(!next)return;
    historyRef.current.push(JSON.stringify(sceneRef.current)); sceneRef.current=JSON.parse(next); broadcast({action:"replace",elements:sceneRef.current}); render();
  }
  function clear(){ if(!window.confirm("Clear this board for everyone?"))return; historyRef.current.push(JSON.stringify(sceneRef.current));sceneRef.current=[];broadcast({action:"replace",elements:[]});render(); }

  return <div className="board-shell">
    <header className="board-topbar">
      <button onClick={onBack}>← Boards</button><div className="board-title">{board?.name || "Whiteboard"}</div>
      <div className="board-meta"><span className={status==="Live"?"live-dot":""}>● {status}</span><span>{users.length} collaborator{users.length===1?"":"s"}</span></div>
    </header>
    <Toolbar tool={tool} setTool={setTool} onUndo={undo} onRedo={redo} onClear={clear}/>
    <div className="stylebar">
      {COLORS.map(c=><button key={c} aria-label={c} className={color===c?"color active-color":"color"} style={{background:c}} onClick={()=>setColor(c)}/>)}
      <label>Stroke <input type="range" min="1" max="8" value={size} onChange={e=>setSize(Number(e.target.value))}/></label>
    </div>
    <canvas ref={canvasRef} className="whiteboard-canvas" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerLeave={pointerUp}/>
    <div className="presence">{users.slice(0,6).map(u=><span key={u.id} title={u.name}>{(u.name||"?")[0].toUpperCase()}</span>)}</div>
  </div>;
}
