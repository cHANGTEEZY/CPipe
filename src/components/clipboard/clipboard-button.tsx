import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { ClipboardSheet } from "./clipboard-sheet";

function ClipboardButton() {
  const { setClipboardOpen } = useAppStore();
  const items = useQuery(api.clipboard.list);
  const count = items?.length ?? 0;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setClipboardOpen(true)}
        title="Clipboard"
      >
        <Clipboard className="size-4" />
        {count > 0 && (
          <Badge
            variant="secondary"
            className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[9px]"
          >
            {count > 9 ? "9+" : count}
          </Badge>
        )}
      </Button>
      <ClipboardSheet />
    </>
  );
}

export { ClipboardButton };
