import type { PropsWithChildren } from "hono/jsx";
import { IconDashboard, IconKey, IconLogout, IconMoon, IconShieldLock, IconSun, IconUserCircle, IconUsers } from "../lib/icons";

export const Layout = ({
    title = "API Manager",
    user,
    hideSidebar = false,
    children,
}: PropsWithChildren<{ title?: string; user?: unknown; hideSidebar?: boolean }>) => {
    return (
        <html lang="en" class="h-full">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{title}</title>
                <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
                <link href="/static/index.css" rel="stylesheet" />
                
                {/* Theme Initialization Script to preventing FOUC */}
                <script dangerouslySetInnerHTML={{ __html: `
                    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                        document.documentElement.classList.add('dark')
                    } else {
                        document.documentElement.classList.remove('dark')
                    }
                `}} />
                
                {/* Toast notifications */}
                <script src="/static/toast.js" defer></script>
            </head>
            <body class="h-full bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                {/* Toast container */}
                <div id="toast-root"></div>
                <div x-data="{ sidebarOpen: false, darkMode: localStorage.theme === 'dark' }" class="flex h-screen overflow-hidden">
                    
                    {/* Mobile sidebar backdrop */}
                    {!hideSidebar && (
                    <div
                        x-show="sidebarOpen"
                        x-transition:enter="transition-opacity ease-linear duration-300"
                        x-transition:enter-start="opacity-0"
                        x-transition:enter-end="opacity-100"
                        x-transition:leave="transition-opacity ease-linear duration-300"
                        x-transition:leave-start="opacity-100"
                        x-transition:leave-end="opacity-0"
                        x-on:click="sidebarOpen = false"
                        class="fixed inset-0 bg-gray-900/80 z-40 lg:hidden"
                        style="display: none;"
                    ></div>
                    )}

                    {/* Sidebar */}
                    {!hideSidebar && (
                    <div
                        x-bind:class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
                        class="fixed inset-y-0 left-0 z-50 w-64 bg-linear-to-b from-primary-700 to-primary-900 dark:from-slate-800 dark:to-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto"
                    >
                        <div class="flex items-center justify-center h-16 bg-primary-800/50 dark:bg-slate-900/50 shadow-sm">
                            <h1 class="text-xl font-bold tracking-wider flex items-center gap-2">
                                <IconShieldLock class="w-6 h-6 text-primary-200" />
                                <span>API Manager</span>
                            </h1>
                        </div>

                        <nav class="mt-6 px-4 space-y-2">
                            <a href="/admin" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
                                <IconDashboard class="w-5 h-5 text-primary-200" />
                                Dashboard
                            </a>
                            <a href="/profile" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
                                <IconUserCircle class="w-5 h-5 text-primary-200" />
                                Profile
                            </a>
                            <div class="pt-4 mt-4 border-t border-white/10">
                                <div class="px-4 text-xs font-semibold text-primary-200/70 uppercase tracking-wider mb-2">Settings</div>
                                <a href="/admin/users" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
                                    <IconUsers class="w-5 h-5 text-primary-200" />
                                    Users
                                </a>
                                <a href="/admin/keys" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
                                    <IconKey class="w-5 h-5 text-primary-200" />
                                    API Keys
                                </a>
                            </div>
                        </nav>
                        
                        <div class="absolute bottom-0 w-full p-4 border-t border-white/10 bg-black/20">
                             <div class="flex items-center gap-3 mb-4 px-2">
                                {/* biome-ignore lint/suspicious/noExplicitAny: user data is loosely typed */}
                                <img 
                                    src={(user as any)?.avatar || "/static/avatar.png"}
                                    alt="User Avatar"
                                    class="w-8 h-8 rounded-full border border-white/20"
                                />
                                <div class="overflow-hidden">
                                     {/* biome-ignore lint/suspicious/noExplicitAny: user data is loosely typed */}
                                     <div class="text-sm font-medium truncate">{(user as any)?.name || "User"}</div>
                                     {/* biome-ignore lint/suspicious/noExplicitAny: user data is loosely typed */}
                                     <div class="text-xs text-primary-200/70 truncate">{(user as any)?.email}</div>
                                </div>
                             </div>
                             <form action="/logout" method="post">
                                <button type="submit" class="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg transition-colors border border-red-500/30">
                                    <IconLogout class="w-4 h-4" />
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                    )}

                    {/* Main content */}
                    <div class="flex flex-col grow min-w-0 bg-gray-50 dark:bg-slate-900">
                        {/* Header */}
                        <header class="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-800 shadow-sm border-b border-gray-100 dark:border-slate-700 z-10">
                            <div class="flex items-center gap-4">
                                {user && (
                                    <button
                                        type="button"
                                        x-on:click="sidebarOpen = true"
                                        class="text-gray-500 focus:outline-none lg:hidden"
                                    >
                                        <svg
                                            class="w-6 h-6"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <title>Open sidebar</title>
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
                                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
                            </div>

                             <div class="flex items-center gap-4"
                                x-init="$watch('darkMode', val => {
                                    localStorage.theme = val ? 'dark' : 'light';
                                    if (val) document.documentElement.classList.add('dark');
                                    else document.documentElement.classList.remove('dark');
                                })"
                             >
                                {/* Dark Mode Toggle */}
                                <button
                                    type="button"
                                    x-on:click="toggle()"
                                    class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 focus:outline-none transition-colors"
                                    x-data="{
                                        toggle() {
                                            this.darkMode = !this.darkMode;
                                        }
                                    }"
                                    aria-label="Toggle Dark Mode"
                                >
                                    <span x-show="!darkMode">
                                        <IconMoon class="w-6 h-6" />
                                    </span>
                                    <span x-show="darkMode" style="display: none;">
                                        <IconSun class="w-6 h-6" />
                                    </span>
                                </button>
                            </div>
                        </header>

                        {/* Content */}
                        <main class="grow p-6 overflow-y-auto">
                            <div class="max-w-7xl mx-auto">
                                {children}
                            </div>
                        </main>
                        
                         <footer class="bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 py-6 mt-auto">
                            <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <p>&copy; {new Date().getFullYear()} <a href="/" class="hover:text-primary-600 dark:hover:text-primary-400">API Manager</a>. All rights reserved.</p>
                                <div class="flex gap-6">
                                    <a href="/privacy-policy" class="hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</a>
                                    <a href="/" class="hover:text-primary-600 dark:hover:text-primary-400">Terms of Service</a>
                                    <a 
                                        href="https://myQuran.com" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        class="text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        Powered by myQuran.com
                                    </a>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </body>
        </html>
    );
};
