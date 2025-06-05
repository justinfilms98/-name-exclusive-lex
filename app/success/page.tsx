import { Suspense } from "react";
import SuccessClientComponent from "./SuccessClientComponent";

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Loading...</h1>
        <p>Please wait while we prepare your video.</p>
      </div>
    }>
      <SuccessClientComponent />
    </Suspense>
  );
}
