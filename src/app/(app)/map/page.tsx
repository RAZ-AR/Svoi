// Svoi — Full-screen map page
import { ListingsMap } from "@/components/map/listings-map";

// Map takes the full viewport — no padding, no header
export default function MapPage() {
  return (
    // tg-viewport fills the Telegram Mini App height exactly
    <div className="tg-viewport w-full">
      <ListingsMap />
    </div>
  );
}
