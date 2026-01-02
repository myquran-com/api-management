import React from "react";
import { createRoot } from "react-dom/client";
import { Toaster, toast } from "sonner";

// Toast component that listens to URL parameters
function ToastProvider() {
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const toastType = params.get("toast");
        const message = params.get("message");

        if (toastType && message) {
            // Show toast based on type
            switch (toastType) {
                case "success":
                    toast.success(decodeURIComponent(message));
                    break;
                case "error":
                    toast.error(decodeURIComponent(message));
                    break;
                case "info":
                    toast.info(decodeURIComponent(message));
                    break;
                case "warning":
                    toast.warning(decodeURIComponent(message));
                    break;
                default:
                    toast(decodeURIComponent(message));
            }

            // Clean up URL params
            params.delete("toast");
            params.delete("message");
            const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
            window.history.replaceState({}, "", newUrl);
        }
    }, []);

    return <Toaster position="top-right" richColors closeButton />;
}

// Mount the toast provider
const container = document.getElementById("toast-root");
if (container) {
    const root = createRoot(container);
    root.render(<ToastProvider />);
}
