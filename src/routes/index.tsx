import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/voyage/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voyagr — Plan dream trips together" },
      { name: "description", content: "A cinematic, collaborative workspace for travel. Co-design itineraries with friends, powered by AI that thinks like a local." },
      { property: "og:title", content: "Voyagr — Plan dream trips together" },
      { property: "og:description", content: "A cinematic, collaborative workspace for travel, powered by AI." },
    ],
  }),
  component: Landing,
});
