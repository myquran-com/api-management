import { PropsWithChildren } from "hono/jsx";
import { IconLogout, IconUserCircle, IconMoon, IconSun, IconDashboard, IconKey, IconSettings } from "../lib/icons";

const APP_NAME = process.env.APP_NAME || "ApiMgmt";

const ThemeScript = () => (
    <script
        dangerouslySetInnerHTML={{
            __html: `
        (function() {
            try {
                const localTheme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (localTheme === 'dark' || (!localTheme && systemTheme)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (e) {}
        })();
    `,
        }}
    />
);

export const Layout = ({
    children,
    title = "API Manager",
    user,
}: PropsWithChildren<{ title?: string; user?: any }>) => {
    return (
        <html lang="en" class="h-full">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>
                    {title} - {APP_NAME}
                </title>
                <link href="/static/index.css" rel="stylesheet" />
                <ThemeScript />
                <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
            </head>
            <body class="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans antialiased h-full transition-colors duration-300">
                <div class="flex h-screen overflow-hidden" x-data="{ sidebarOpen: false }">
                    {/* Sidebar */}
                    {user && (
                        <>
                            {/* Mobile Sidebar Overlay */}
                            <div
                                x-show="sidebarOpen"
                                x-on:click="sidebarOpen = false"
                                class="fixed inset-0 z-20 transition-opacity bg-black opacity-50 lg:hidden"
                            ></div>

                            <aside
                                x-bind:class="sidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'"
                                class="fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col lg:translate-x-0 lg:static lg:inset-0 shadow-lg lg:shadow-none"
                            >
                                <div class="p-6 bg-linear-to-r from-primary-600 to-primary-700 dark:from-slate-800 dark:to-slate-900">
                                    <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                                        <IconDashboard class="w-8 h-8 text-primary-200" />
                                        <span>{APP_NAME}</span>
                                    </h1>
                                </div>

                                <nav class="mt-6 px-4 space-y-2 grow">
                                    <a
                                        href="/"
                                        class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors group"
                                    >
                                        <IconDashboard class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                        Dashboard
                                    </a>
                                    {user.role === "admin" && (
                                        <a
                                            href="/admin/users"
                                            class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors group"
                                        >
                                            <IconUserCircle class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                            Users
                                        </a>
                                    )}
                                    <a
                                        href="/keys"
                                        class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors group"
                                    >
                                        <IconKey class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                        API Keys
                                    </a>
                                    <a
                                        href="/profile"
                                        class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors group"
                                    >
                                        <IconSettings class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                        Profile
                                    </a>
                                </nav>

                                <div class="p-4 border-t dark:border-slate-700">
                                    <form action="/logout" method="post">
                                        <button
                                            type="submit"
                                            class="w-full text-left flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg gap-2 transition-colors"
                                        >
                                            <IconLogout class="w-5 h-5" /> Logout
                                        </button>
                                    </form>
                                </div>
                            </aside>
                        </>
                    )}

                    {/* Main Content */}
                    <div class="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-900">
                        <header class="bg-white dark:bg-slate-800 shadow-sm px-6 py-4 flex justify-between items-center z-10 transition-colors duration-300">
                            <div class="flex items-center gap-4">
                                {user && (
                                    <button
                                        x-on:click="sidebarOpen = true"
                                        class="text-gray-500 focus:outline-none lg:hidden"
                                    >
                                        <svg
                                            class="w-6 h-6"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M4 6H20M4 12H20M4 18H11"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                    </button>
                                )}
                                <h2 class="text-xl font-semibold text-gray-800 dark:text-white tracking-tight">
                                    {title}
                                </h2>
                            </div>

                            <div class="flex items-center gap-4">
                                {/* Dark/Light Toggle */}
                                <div
                                    x-data="{ 
                            darkMode: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
                            toggle() {
                                this.darkMode = !this.darkMode;
                                if (this.darkMode) {
                                    document.documentElement.classList.add('dark');
                                    localStorage.setItem('theme', 'dark');
                                } else {
                                    document.documentElement.classList.remove('dark');
                                    localStorage.setItem('theme', 'light');
                                }
                            }
                        }"
                                >
                                    <button
                                        x-on:click="toggle()"
                                        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 focus:outline-none transition-colors"
                                    >
                                        <span x-show="!darkMode">
                                            <IconMoon class="w-6 h-6" />
                                        </span>
                                        <span x-show="darkMode" style="display: none;">
                                            <IconSun class="w-6 h-6" />
                                        </span>
                                    </button>
                                </div>

                                {user && (
                                    <div class="flex items-center gap-4 border-l pl-4 dark:border-slate-700">
                                        <a
                                            href="/profile"
                                            class="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition"
                                            title="My Profile"
                                        >
                                            <span class="hidden md:inline text-sm font-medium">
                                                {user.name || user.email}
                                            </span>
                                            <div class="bg-primary-100 dark:bg-primary-900/50 p-1 rounded-full text-primary-600 dark:text-primary-300">
                                                <IconUserCircle class="w-7 h-7" />
                                            </div>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </header>

                        <main class="flex-1 overflow-y-auto p-6 transition-colors duration-300">
                            <div class="w-full max-w-7xl mx-auto">{children}</div>
                        </main>

                        <footer class="bg-white dark:bg-slate-800 border-t dark:border-slate-700 px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                            © {new Date().getFullYear()} -{" "}
                            <a
                                href="https://myQuran.com"
                                target="_blank"
                                class="text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                myQuran.com
                            </a>
                        </footer>
                    </div>
                </div>
            </body>
        </html>
    );
};
