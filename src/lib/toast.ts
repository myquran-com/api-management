import type { Context } from "hono";

type ToastType = "success" | "error" | "info" | "warning";

export function redirectWithToast(
    c: Context,
    path: string,
    type: ToastType,
    message: string
): Response {
    const encodedMessage = encodeURIComponent(message);
    return c.redirect(`${path}?toast=${type}&message=${encodedMessage}`);
}
