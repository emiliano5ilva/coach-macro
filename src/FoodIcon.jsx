import { useState, useEffect } from "react";
import "./iconData.js";
import { Icon } from "@iconify/react";
import { getFoodIcon, resolveIconWithAI } from "./iconMap.js";

const GENERIC_FALLBACK = "fluent-emoji-flat:fork-and-knife-with-plate";

export default function FoodIcon({ name, size = 28, method, userId }) {
  const foodName = typeof name === "string" ? name : (name?.food || "");
  const storedIcon = typeof name === "object" ? name?.icon : null;

  const staticIcon = storedIcon || getFoodIcon(foodName);
  const isFallback = staticIcon === GENERIC_FALLBACK;

  const [iconId, setIconId] = useState(staticIcon);

  useEffect(() => {
    if (!isFallback || !foodName) return;
    resolveIconWithAI(foodName, userId).then(resolved => {
      if (resolved !== staticIcon) setIconId(resolved);
    });
  }, [foodName]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Icon icon={iconId} width={size} height={size} />
      {method && method !== "manual" && (
        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 10, lineHeight: 1 }}>
          {method === "photo"   ? "📸"
         : method === "barcode" ? "🔲"
         : method === "ai"      ? "🧠"
         : method === "quick"   ? "✏️"
         : null}
        </span>
      )}
    </div>
  );
}
