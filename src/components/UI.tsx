import { PropsWithChildren } from "hono/jsx";

export const Card = ({ children, title, className = "", action }: PropsWithChildren<{ title?: string, className?: string, action?: any }>) => (
  <div class={`bg-white shadow rounded-lg p-6 ${className}`}>
    {(title || action) && (
        <div class="flex justify-between items-center mb-4">
            {title && <h3 class="text-xl font-bold">{title}</h3>}
            {action && <div>{action}</div>}
        </div>
    )}
    {children}
  </div>
);

export const Button = ({ children, type = "button", variant = "primary", className = "", ...props }: PropsWithChildren<{ type?: "button" | "submit", variant?: "primary" | "danger" | "secondary" | "outline" | "warning", className?: string } & any>) => {
  const base = "px-4 py-2 rounded font-medium focus:outline-none transition";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button type={type} class={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ label, error, ...props }: { label?: string, error?: string } & any) => (
  <div class="mb-4">
    {label && <label class="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      class={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500" : "border-gray-300"}`}
      {...props}
    />
    {error && <p class="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export const Badge = ({ children, color = "gray" }: PropsWithChildren<{ color?: "green" | "red" | "blue" | "gray" }>) => {
    const colors = {
        green: "bg-green-100 text-green-800",
        red: "bg-red-100 text-red-800",
        blue: "bg-blue-100 text-blue-800",
        gray: "bg-gray-100 text-gray-800",
    };
    return (
        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
            {children}
        </span>
    );
}

export const Table = ({ headers, children }: { headers: string[], children: any }) => (
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    {headers.map(h => (
                        <th key={h} scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                {children}
            </tbody>
        </table>
    </div>
);
