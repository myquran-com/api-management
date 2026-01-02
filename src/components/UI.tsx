// @ts-nocheck
import type { PropsWithChildren } from "hono/jsx";

export const Card = ({
    title,
    children,
    className = "",
    action,
}: PropsWithChildren<{ title?: string; className?: string; action?: unknown }>) => (
    <div
        class={`bg-white dark:bg-slate-800 shadow-md transform transition-all duration-300 rounded-xl p-6 border border-gray-100 dark:border-slate-700 ${className}`}
    >
        {(title || action) && (
            <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                {title && (
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                        {title}
                    </h3>
                )}
                {/* biome-ignore lint/suspicious/noExplicitAny: action can be any jsx element */}
                {action && <div>{action as any}</div>}
            </div>
        )}
        <div class="text-gray-600 dark:text-gray-300">{children}</div>
    </div>
);

export const Button = ({
    children,
    variant = "primary",
    className = "",
    ...props
}: PropsWithChildren<
    {
        variant?: "primary" | "danger" | "secondary" | "outline" | "warning";
        className?: string;
        // biome-ignore lint/suspicious/noExplicitAny: forwarding props
    } & any
>) => {
    const base =
        "px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
    const variants = {
        primary:
            "bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-primary-500/30 focus:ring-primary-500",
        secondary:
            "bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-gray-500",
        danger: "bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30 focus:ring-red-500",
        outline:
            "bg-transparent border-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 focus:ring-primary-500",
        warning:
            "bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white shadow-yellow-500/30 focus:ring-yellow-500",
    };

    return (
        <button class={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

// biome-ignore lint/suspicious/noExplicitAny: forwarding props
export const Input = ({ label, error, ...props }: { label?: string; error?: string } & any) => (
    <div class="mb-4">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: Input is next sibling */}
        {label && <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <input
            class={`w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-slate-600"}`}
            {...props}
        />
        {error && <p class="mt-1 text-sm text-red-500">{error}</p>}
    </div>
);

export const Badge = ({
    children,
    color = "gray",
}: PropsWithChildren<{ color?: "green" | "red" | "yellow" | "blue" | "gray" | "purple" }>) => {
    const colors = {
        green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
        yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        gray: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-600",
        purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    };

    return (
        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
            {children}
        </span>
    );
};

// biome-ignore lint/suspicious/noExplicitAny: children
export const Table = ({ headers, children }: { headers: string[]; children: any }) => (
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                    {headers.map((h) => (
                        <th
                            key={h}
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">{children}</tbody>
        </table>
    </div>
);
