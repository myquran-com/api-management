import type { Context } from "hono";
import { Layout } from "../../components/Layout";
import { Card } from "../../components/UI";

export const termsOfService = (c: Context) => {
    const lang = c.req.query("lang") || "id"; // Default to Indonesian
    const isId = lang === "id";

    const content = {
        title: isId ? "Syarat dan Ketentuan" : "Terms of Service",
        lastUpdated: isId ? "Terakhir Diperbarui: 2 Januari 2026" : "Last Updated: January 2, 2026",
        intro: isId
            ? "Selamat datang di API Manager. Dengan mengakses atau menggunakan layanan kami, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini."
            : "Welcome to API Manager. By accessing or using our services, you agree to be bound by these Terms of Service.",
        sections: [
            {
                title: isId ? "1. Penggunaan Layanan" : "1. Use of Services",
                body: isId
                    ? "Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang sah dan sesuai dengan hukum yang berlaku. Anda tidak boleh menyalahgunakan layanan kami untuk aktivitas ilegal atau berbahaya."
                    : "You agree to use our services only for lawful purposes and in accordance with applicable laws. You must not misuse our services for illegal or harmful activities.",
            },
            {
                title: isId ? "2. Akun Pengguna" : "2. User Accounts",
                body: isId
                    ? "Anda bertanggung jawab untuk menjaga keamanan akun dan kunci API Anda. Segala aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya."
                    : "You are responsible for maintaining the security of your account and API keys. All activities that occur under your account are your sole responsibility.",
            },
            {
                title: isId ? "3. Batasan Tanggung Jawab" : "3. Limitation of Liability",
                body: isId
                    ? "Layanan kami disediakan 'sebagaimana adanya'. Kami tidak bertanggung jawab atas kerugian langsung, tidak langsung, atau konsekuensial yang timbul dari penggunaan layanan kami."
                    : "Our services are provided 'as is'. We are not liable for any direct, indirect, or consequential damages arising from the use of our services.",
            },
            {
                title: isId ? "4. Perubahan Syarat" : "4. Changes to Terms",
                body: isId
                    ? "Kami berhak untuk mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku segera setelah diposting di halaman ini."
                    : "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on this page.",
            },
            {
                title: isId ? "5. Kontak" : "5. Contact",
                body: isId
                    ? "Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di admin@myquran.com."
                    : "If you have questions about these Terms of Service, please contact us at admin@myquran.com.",
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
