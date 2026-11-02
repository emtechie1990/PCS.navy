import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center" data-testid="not-found">
      <p className="font-heading text-7xl font-bold text-ocp">404</p>
      <h1 className="mt-2 text-3xl font-bold uppercase">Off the map</h1>
      <p className="mt-2 text-muted-foreground">That page doesn't exist. Head back to the board.</p>
      <Link to="/" className={buttonVariants({ className: "mt-6" })} data-testid="not-found-home-link">Back home</Link>
    </div>
  );
}
