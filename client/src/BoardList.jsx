import { useEffect, useState } from "react";
import { boardApi } from "./api";

export default function BoardList({ onOpen, onLogout }) {
  const [boards, setBoards] = useState([]);
  const [name, setName] = useState("");

  async function load() { setBoards(await boardApi.list()); }
  useEffect(()=>{ load().catch(()=>onLogout()); }, []);

  async function create() {
    if (!name.trim()) return;
    const board = await boardApi.create(name.trim());
    setName(""); setBoards([board, ...boards]);
  }

  return <main className="boards-page">
    <header className="topbar">
      <div className="brand">✦ CollabBoard</div>
      <button onClick={onLogout}>Sign out</button>
    </header>
    <section className="boards-content">
      <div className="boards-heading"><div><h1>Your whiteboards</h1><p>Create a board and invite collaborators by sharing its URL.</p></div></div>
      <div className="create-row"><input placeholder="New board name" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&create()} /><button className="primary" onClick={create}>Create board</button></div>
      <div className="board-grid">{boards.map(b=><button className="board-card" key={b._id} onClick={()=>onOpen(b._id)}><span>▦</span><strong>{b.name}</strong><small>Open whiteboard</small></button>)}</div>
    </section>
  </main>;
}
