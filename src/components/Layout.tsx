import { PropsWithChildren } from "hono/jsx";

export const Layout = ({ children, title = "API Manager", user }: PropsWithChildren<{ title?: string, user?: any }>) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link href="/static/index.css" rel="stylesheet" /> 
        {/* We need to serve static CSS. Hono serveStatic will handle this or we can put it in public */}
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased">
        <div class="flex h-screen overflow-hidden">
            {/* Sidebar */}
            {user && (
                 <aside class="w-64 bg-white border-r">
                    <div class="p-6">
                        <h1 class="text-2xl font-bold text-blue-600 flex items-center gap-2">
                             {/* Icon placeholder */}
                            <span>ApiMgmt</span>
                        </h1>
                    </div>
                    <nav class="mt-6 px-4 space-y-2">
                        <a href="/" class="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md">
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
                         <form action="/logout" method="post" class="mt-8">
                            <button type="submit" class="w-full text-left flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">
                                Logout
                            </button>
                        </form>
                    </nav>
                 </aside>
            )}

            {/* Main Content */}
            <div class="flex-1 flex flex-col overflow-hidden">
                <header class="bg-white shadow px-6 py-4 flex justify-between items-center">
                    <h2 class="text-xl font-semibold">{title}</h2>
                    {user && <span>Welcome, {user.email}</span>}
                </header>
                <main class="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
      </body>
    </html>
  );
};
