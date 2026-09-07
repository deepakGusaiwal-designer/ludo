import { Analytics } from "@vercel/analytics/react";
import { LudoGame } from "./components/LudoGame.jsx";

export default function App() {
  return (
    <>
      <LudoGame />
      <Analytics />
    </>
  );
}
