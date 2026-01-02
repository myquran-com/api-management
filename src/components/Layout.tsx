import { PropsWithChildren } from "hono/jsx";
import { IconLogout, IconUserCircle } from "../lib/icons";

const APP_NAME = process.env.APP_NAME || "ApiMgmt";

export const Layout = ({ children, title = "API Manager", user }: PropsWithChildren<{ title?: string, user?: any }>) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - {APP_NAME}</title>
        <link href="/static/index.css" rel="stylesheet" /> 
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased">
        <div class="flex h-screen overflow-hidden">
            {/* Sidebar */}
            {user && (
                 <aside class="w-64 bg-white border-r flex flex-col">
                    <div class="p-6">
                        <h1 class="text-2xl font-bold text-blue-600 flex items-center gap-2">
                            <span>{APP_NAME}</span>
                        </h1>
                    </div>
                    <nav class="mt-6 px-4 space-y-2 flex-grow">
                        <a href="/" class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                            Dashboard
                        </a>
                        {user.role === 'admin' && (
                            <a href="/admin/users" class="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                                Users
                            </a>
                        )}
                        <a href="/keys" class="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                            API Keys
                        </a>
                    </nav>
                    <div class="p-4 border-t">
                         <form action="/logout" method="post">
                            <button type="submit" class="w-full text-left flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md gap-2">
                                <IconLogout class="w-5 h-5" /> Logout
                            </button>
                        </form>
                    </div>
                 </aside>
            )}

            {/* Main Content */}
            <div class="flex-1 flex flex-col overflow-hidden">
                <header class="bg-white shadow px-6 py-4 flex justify-between items-center z-10">
                    <h2 class="text-xl font-semibold text-gray-800">{title}</h2>
                    {user && (
                        <div class="flex items-center gap-4">
                            <a href="/profile" class="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition" title="My Profile">
                                <span class="hidden md:inline text-sm font-medium">{user.email}</span>
                                <IconUserCircle class="w-8 h-8" />
                            </a>
                        </div>
                    )}
                </header>
                <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
      </body>
    </html>
  );
};
