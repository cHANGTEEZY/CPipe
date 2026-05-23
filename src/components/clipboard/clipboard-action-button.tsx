import { Clipboard, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClipboardActionButtonProps = {
  onClipboard: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
};

function ClipboardActionButton({
  onClipboard,
  onClick,
  size = "sm",
  className,
}: ClipboardActionButtonProps) {
  const iconClass = size === "sm" ? "size-3.5" : "size-4";
  const btnClass = size === "sm" ? "size-7" : "size-8";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        btnClass,
        onClipboard &&
          "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
        className,
      )}
      title={
        onClipboard ? "On clipboard — open panel to view" : "Add to clipboard"
      }
      onClick={onClick}
    >
      {onClipboard ? (
        <ClipboardCheck className={iconClass} />
      ) : (
        <Clipboard className={iconClass} />
      )}
    </Button>
  );
}

export { ClipboardActionButton };
