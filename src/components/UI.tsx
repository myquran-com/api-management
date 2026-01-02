import { PropsWithChildren } from "hono/jsx";

export const Card = ({ children, title, className = "", action }: PropsWithChildren<{ title?: string, className?: string, action?: any }>) => (
  <div class={`bg-white dark:bg-slate-800 shadow-md transform transition-all duration-300 rounded-xl p-6 border border-gray-100 dark:border-slate-700 ${className}`}>
    {(title || action) && (
        <div class="flex justify-between items-center mb-5 pb-4 border-b border-gray-100 dark:border-slate-700">
            {title && <h3 class="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">{title}</h3>}
            {action && <div>{action}</div>}
        </div>
    )}
    <div class="dark:text-gray-200">
        {children}
    </div>
  </div>
);

export const Button = ({ children, type = "button", variant = "primary", className = "", ...props }: PropsWithChildren<{ type?: "button" | "submit", variant?: "primary" | "danger" | "secondary" | "outline" | "warning", className?: string } & any>) => {
  const base = "px-4 py-2 rounded-lg font-medium focus:outline-none transition duration-200 shadow-sm transform active:scale-95";
  const variants: Record<string, string> = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 shadow-primary-500/30",
    danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 shadow-red-500/30",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500 shadow-yellow-500/30",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 dark:bg-slate-600 dark:hover:bg-slate-500",
    outline: "border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700",
  };
  return (
    <button type={type} class={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ label, error, ...props }: { label?: string, error?: string } & any) => (
  <div class="mb-4">
    {label && <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
    <input
      class={`w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-slate-600"}`}
      {...props}
    />
    {error && <p class="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export const Badge = ({ children, color = "gray" }: PropsWithChildren<{ color?: "green" | "red" | "blue" | "gray" }>) => {
    const colors: Record<string, string> = {
        green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800",
        red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800",
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        gray: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600",
    };
    return (
        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
            {children}
        </span>
    );
}

export const Table = ({ headers, children }: { headers: string[], children: any }) => (
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-800">
                <tr>
                    {headers.map(h => (
                        <th key={h} scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                {children}
            </tbody>
        </table>
    </div>
);
