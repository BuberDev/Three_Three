'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Activity, ArrowRight, Brain, Shield, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ThreeThreeLogo from './ThreeThreeLogo'

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 1000], [0, -200])
    const opacity = useTransform(scrollY, [0, 400], [1, 0])

    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const features = [
        { icon: Brain, text: "AI-Powered Analysis" },
        { icon: Activity, text: "Sleep Recording" },
        { icon: TrendingUp, text: "Cross-Correlation" },
        { icon: Shield, text: "Enterprise Security" },
    ]

    const floatingElements = [
        { icon: ThreeThreeLogo, x: "10%", y: "20%", delay: 0, isLogo: true },
        { icon: Sparkles, x: "85%", y: "15%", delay: 0.5 },
        { icon: Brain, x: "15%", y: "70%", delay: 1 },
        { icon: Zap, x: "80%", y: "75%", delay: 1.5 },
    ]

    if (!mounted) return null

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden luxury-pattern">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {floatingElements.map((element, index) => (
                    <motion.div
                        key={index}
                        className="absolute opacity-10"
                        style={{ left: element.x, top: element.y }}
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        animate={{
                            opacity: 0.1,
                            scale: 1,
                            rotate: 0,
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 2,
                            delay: element.delay,
                            y: {
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        }}
                    >
                        {element.isLogo ? (
                            <ThreeThreeLogo />
                        ) : (
                            <element.icon className="w-16 h-16 text-royal-500" />
                        )}
                    </motion.div>
                ))}

                {/* Premium Gradient Orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 61, 247, 0.15) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(240, 184, 36, 0.1) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            <motion.div
                className="container mx-auto px-6 lg:px-8 relative z-10"
                style={{ y, opacity }}
                ref={containerRef}
            >
                <div className="text-center">
                    {/* Premium Badge */}
                    <motion.div
                        className="inline-flex items-center space-x-2 glass-royal px-6 py-3 rounded-full mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <ThreeThreeLogo />
                        <span className="text-sm font-medium text-gold-gradient">
                            Enterprise-Grade Personal Analytics
                        </span>
                        <Sparkles className="w-4 h-4 text-gold-400" />
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        className="enterprise-heading text-6xl lg:text-8xl xl:text-9xl mb-6 text-premium-gradient"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                    >
                        Revolucyjna
                        <br />
                        <span className="text-royal-gradient">Aplikacja Mobilna</span>
                        <br />
                        Analytics
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="professional-body text-xl lg:text-2xl text-platinum-300 mb-8 max-w-4xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        Przekształć swoje dane osobiste w inteligentne analizy. Nasza aplikacja mobilna z AI łączy
                        <span className="text-gold-gradient font-semibold"> nagrywanie snu</span>,
                        <span className="text-royal-gradient font-semibold"> analitykę stylu życia</span> i
                        <span className="text-premium-gradient font-semibold"> cross-correlation insights</span>
                        aby zoptymalizować Twoją wydajność i samopoczucie.
                    </motion.p>

                    {/* Feature Pills */}
                    <motion.div
                        className="flex flex-wrap justify-center gap-4 mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="glass-premium px-6 py-3 rounded-full flex items-center space-x-3"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <feature.icon className="w-5 h-5 text-royal-400" />
                                <span className="text-platinum-200 font-medium">{feature.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                    >
                        <motion.a
                            href="#download"
                            className="btn-premium px-8 py-4 rounded-xl font-semibold text-white text-lg flex items-center space-x-3 enterprise-shadow"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>Pobierz Aplikację</span>
                            <ArrowRight className="w-5 h-5" />
                        </motion.a>

                        <motion.a
                            href="#features"
                            className="glass-premium px-8 py-4 rounded-xl font-semibold text-platinum-200 text-lg border border-royal-500/30 hover:border-royal-400/50 transition-colors duration-300"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Zobacz Funkcje
                        </motion.a>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-8 text-platinum-400 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                    >
                        <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-royal-400" />
                            <span>Enterprise Security</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Brain className="w-4 h-4 text-gold-400" />
                            <span>AI-Powered Insights</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <ThreeThreeLogo />
                            <span>Premium Analytics</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.5 }}
            >
                <motion.div
                    className="w-6 h-10 border-2 border-royal-400/50 rounded-full flex justify-center"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <motion.div
                        className="w-1 h-3 bg-royal-gradient rounded-full mt-2"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </motion.div>
        </section>
    )
}