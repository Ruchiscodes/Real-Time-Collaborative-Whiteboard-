import { useState } from "react";
import Auth from "./Auth";
import BoardList from "./BoardList";
import Whiteboard from "./Whiteboard";

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("collabboard_user") || "null"));
  const [boardId, setBoardId] = useState(null);

  function logout(){localStorage.removeItem("collabboard_token");localStorage.removeItem("collabboard_user");setUser(null);setBoardId(null);}
  if (!user) return <Auth onAuthenticated={setUser}/>;
  if (boardId) return <Whiteboard boardId={boardId} onBack={()=>setBoardId(null)}/>;
  return <BoardList onOpen={setBoardId} onLogout={logout}/>;
}
