'use client'

import { motion, useInView } from 'framer-motion'
import { Apple, Download, Play, QrCode, Smartphone, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import QRCode from 'react-qr-code'
import ThreeThreeLogo from './ThreeThreeLogo'

export default function MobileDownloadSection() {
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: true, margin: "-100px" })

    // URL do pobrania aplikacji (zastąp właściwymi linkami)
    const appStoreUrl = "https://apps.apple.com/app/personal-analytics"
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.personalanalytics"
    const appDownloadUrl = "https://personalanalytics.app/download"

    const features = [
        "Advanced Sleep Recording",
        "AI-Powered Analysis",
        "Voice Journaling",
        "Cross-Correlation Insights",
        "Performance Optimization",
        "Enterprise Security"
    ]

    return (
        <section id="download" className="py-32 relative overflow-hidden">
            {/* Premium Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-royal-950/30 via-transparent to-gold-950/20" />
                <div className="luxury-pattern opacity-20" />

                {/* Floating mobile icons */}
                <motion.div
                    className="absolute top-1/4 left-1/6 opacity-5"
                    animate={{
                        y: [0, -30, 0],
                        rotate: [0, 15, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <Smartphone className="w-24 h-24 text-royal-500" />
                </motion.div>

                <motion.div
                    className="absolute bottom-1/4 right-1/6 opacity-5"
                    animate={{
                        y: [0, 20, 0],
                        rotate: [0, -10, 0],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <QrCode className="w-20 h-20 text-gold-500" />
                </motion.div>
            </div>

            <div className="container mx-auto px-6 lg:px-8 relative z-10" ref={containerRef}>
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        className="inline-flex items-center space-x-2 glass-royal px-6 py-3 rounded-full mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Smartphone className="w-4 h-4 text-gold-400" />
                        <span className="text-sm font-medium text-gold-gradient">Mobile Application</span>
                    </motion.div>

                    <h2 className="enterprise-heading text-5xl lg:text-6xl text-premium-gradient mb-6">
                        Pobierz Aplikację
                        <br />
                        <span className="text-royal-gradient">Personal Analytics</span>
                    </h2>

                    <p className="professional-body text-xl text-platinum-300 max-w-3xl mx-auto">
                        Zainstaluj profesjonalną aplikację mobilną i rozpocznij rewolucyjną podróż w świat
                        zaawansowanych analiz osobistych. Dostępna na iOS i Android.
                    </p>
                </motion.div>

                {/* Main Download Section */}
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                    {/* QR Code & App Info */}
                    <motion.div
                        className="text-center lg:text-left"
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {/* QR Code */}
                        <div className="inline-block p-8 glass-royal rounded-2xl mb-8">
                            <motion.div
                                className="bg-white p-6 rounded-xl"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <QRCode
                                    value={appDownloadUrl}
                                    size={200}
                                    level="M"
                                    className="w-full h-auto"
                                />
                            </motion.div>
                            <p className="text-platinum-300 text-sm mt-4">
                                Skanuj kodem QR aby pobrać
                            </p>
                        </div>

                        {/* Download Buttons */}
                        <div className="space-y-4 mb-8">
                            <motion.a
                                href={appStoreUrl}
                                className="flex items-center justify-center lg:justify-start space-x-4 glass-premium p-4 rounded-xl border border-royal-500/30 hover:border-royal-400/50 transition-all duration-300 group"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-royal-600 to-royal-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Apple className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-platinum-400">Download on the</p>
                                    <p className="text-lg font-semibold text-white">App Store</p>
                                </div>
                            </motion.a>

                            <motion.a
                                href={playStoreUrl}
                                className="flex items-center justify-center lg:justify-start space-x-4 glass-premium p-4 rounded-xl border border-royal-500/30 hover:border-royal-400/50 transition-all duration-300 group"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-gold-600 to-gold-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Play className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-platinum-400">Get it on</p>
                                    <p className="text-lg font-semibold text-white">Google Play</p>
                                </div>
                            </motion.a>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-platinum-400 text-sm">
                            <div className="flex items-center space-x-2">
                                <ThreeThreeLogo className="w-4 h-4" size={16} animate={true} />
                                <span>Premium Quality</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-gold-400" />
                                <span>4.9★ Rating</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Download className="w-4 h-4 text-royal-400" />
                                <span>10K+ Downloads</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* App Features Preview */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <div className="glass-royal p-8 rounded-2xl">
                            <h3 className="enterprise-heading text-2xl text-royal-gradient mb-6">
                                Funkcje Aplikacji Mobilnej
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center space-x-3 glass-premium p-3 rounded-lg"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                                        transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
                                    >
                                        <div className="w-2 h-2 bg-royal-gradient rounded-full flex-shrink-0" />
                                        <span className="text-platinum-200 text-sm font-medium">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Device Compatibility */}
                        <motion.div
                            className="glass-premium p-6 rounded-xl border border-gold-500/20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 1.2 }}
                        >
                            <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                                <Smartphone className="w-5 h-5 text-gold-400" />
                                <span>Kompatybilność</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-platinum-300">
                                <div>
                                    <p className="font-medium text-white">iOS</p>
                                    <p>iOS 14.0 lub nowszy</p>
                                    <p>iPhone, iPad, iPod touch</p>
                                </div>
                                <div>
                                    <p className="font-medium text-white">Android</p>
                                    <p>Android 8.0 (API 26)</p>
                                    <p>Wszystkie urządzenia Android</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Call to Action */}
                <motion.div
                    className="text-center glass-royal p-12 rounded-2xl"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.4 }}
                >
                    <ThreeThreeLogo className="w-12 h-12 mx-auto mb-6" size={48} animate={true} />

                    <h3 className="enterprise-heading text-3xl text-gold-gradient mb-4">
                        Rozpocznij Transformację Już Dziś
                    </h3>

                    <p className="professional-body text-platinum-300 max-w-2xl mx-auto mb-8">
                        Dołącz do ekskluzywnej grupy osób wykorzystujących zaawansowaną sztuczną inteligencję
                        do optymalizacji swojego potencjału poprzez analizę danych osobistych.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                        <motion.button
                            className="btn-premium px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Download className="w-4 h-4" />
                            <span>Pobierz Teraz</span>
                        </motion.button>

                        <motion.button
                            className="glass-premium px-6 py-3 rounded-lg font-semibold text-platinum-200 border border-royal-500/30 hover:border-royal-400/50 transition-colors duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Zobacz Demo
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}