import { toast } from "sonner";

/** Success toast with an Undo action wired to the store's undo(). */
export function undoToast(message: string, onUndo: () => void) {
  toast.success(message, {
    action: {
      label: "Undo",
      onClick: () => {
        onUndo();
        toast("Change reverted");
      },
    },
  });
}
