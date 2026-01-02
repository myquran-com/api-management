import type { Context } from "hono";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/UI";

export const privacyPolicy = (c: Context) => {
    const lang = c.req.query("lang") || "id"; // Default to Indonesian
    const isId = lang === "id";

    // Content dictionaries
    const content = {
        title: isId ? "Kebijakan Privasi" : "Privacy Policy",
        lastUpdated: isId ? "Terakhir Diperbarui: 2 Januari 2026" : "Last Updated: January 2, 2026",
        intro: isId
            ? "Kami menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan layanan API Manager kami."
            : "We value your privacy. This Privacy Policy explains how we collect, use, and protect your information when using our API Manager service.",
        sections: [
            {
                title: isId ? "1. Informasi yang Kami Kumpulkan" : "1. Information We Collect",
                body: isId
                    ? "Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti saat Anda membuat akun, membuat kunci API, atau menghubungi dukungan. Ini mungkin termasuk nama, alamat email, dan data penggunaan API Anda."
                    : "We collect information you provide directly, such as when you create an account, generate API keys, or contact support. This may include your name, email address, and API usage data.",
            },
            {
                title: isId ? "2. Cara Kami Menggunakan Informasi Anda" : "2. How We Use Your Information",
                body: isId
                    ? "Kami menggunakan informasi tersebut untuk menyediakan, memelihara, dan meningkatkan layanan kami, serta untuk berkomunikasi dengan Anda tentang pembaruan, keamanan, dan dukungan."
                    : "We use the information to provide, maintain, and improve our services, as well as to communicate with you regarding updates, security, and support.",
            },
            {
                title: isId ? "3. Keamanan Data" : "3. Data Security",
                body: isId
                    ? "Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi Anda dari akses yang tidak sah. Namun, tidak ada metode transmisi melalui internet yang 100% aman."
                    : "We implement reasonable security measures to protect your information from unauthorized access. However, no method of transmission over the internet is 100% secure.",
            },
            {
                title: isId ? "4. Kunci API" : "4. API Keys",
                body: isId
                    ? "Kunci API Anda bersifat rahasia. Jangan membagikannya kepada orang lain. Kami menyimpan hash dari kunci Anda, tetapi Anda bertanggung jawab untuk menjaga kerahasiaan kunci asli."
                    : "Your API keys are confidential. Do not share them with others. We store a hash of your key, but you are responsible for maintaining the confidentiality of the original key.",
            },
            {
                title: isId ? "5. Hubungi Kami" : "5. Contact Us",
                body: isId
                    ? "Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di admin@myquran.com."
                    : "If you have questions about this Privacy Policy, please contact us at admin@myquran.com",
            },
        ],
    };

    return c.html(
        <Layout title={content.title} hideSidebar={true}>
            <div class="max-w-4xl mx-auto py-10">
                <Card className="min-h-screen">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{content.title}</h1>
                        <div class="flex gap-2">
                             <a 
                                href="?lang=id" 
                                class={`px-3 py-1 rounded text-sm font-medium transition-colors ${isId ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                            >
                                Indonesia
                            </a>
                            <a 
                                href="?lang=en" 
                                class={`px-3 py-1 rounded text-sm font-medium transition-colors ${!isId ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                            >
                                English
                            </a>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">{content.lastUpdated}</p>

                    <div class="prose dark:prose-invert max-w-none">
                        <p class="text-lg leading-relaxed mb-6">{content.intro}</p>

                        <div class="space-y-8">
                            {content.sections.map((section) => (
                                <div key={section.title}>
                                    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">{section.title}</h2>
                                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{section.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div class="mt-10 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
                        <a href="/" class="text-primary-600 dark:text-primary-400 hover:underline">
                            {isId ? "Kembali ke Beranda" : "Back to Home"}
                        </a>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};
