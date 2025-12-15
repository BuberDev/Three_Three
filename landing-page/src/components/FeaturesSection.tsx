'use client'

import { motion, useInView } from 'framer-motion'
import {
    Activity,
    BarChart3,
    Brain,
    Eye,
    Mic,
    Moon,
    Network,
    Shield,
    Sparkles,
    TrendingUp,
    Zap
} from 'lucide-react'
import { useRef } from 'react'
import ThreeThreeLogo from './ThreeThreeLogo'

export default function FeaturesSection() {
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: true, margin: "-100px" })

    const mainFeatures = [
        {
            icon: Moon,
            title: "Advanced Sleep Recording",
            description: "Comprehensive nocturnal monitoring capturing snoring, sleep talking, movement patterns, and environmental factors with precision audio analysis.",
            gradient: "from-royal-600 to-royal-400",
            highlights: ["Audio Analysis", "Pattern Recognition", "Sleep Quality Metrics", "Environmental Monitoring"]
        },
        {
            icon: Brain,
            title: "AI-Powered Cross-Analysis",
            description: "Revolutionary correlation engine that connects sleep patterns, dietary habits, emotional states, and lifestyle factors to reveal hidden insights.",
            gradient: "from-gold-600 to-gold-400",
            highlights: ["Pattern Detection", "Causal Analysis", "Predictive Insights", "Behavioral Mapping"]
        },
        {
            icon: TrendingUp,
            title: "Enterprise Analytics Dashboard",
            description: "Professional-grade data visualization and reporting tools designed for comprehensive personal performance optimization and long-term trend analysis.",
            gradient: "from-royal-500 to-gold-500",
            highlights: ["Real-time Analytics", "Custom Reports", "Trend Analysis", "Performance Metrics"]
        }
    ]

    const capabilities = [
        { icon: Mic, title: "Voice Journaling", description: "Advanced speech-to-text with emotional analysis" },
        { icon: Activity, title: "Lifestyle Tracking", description: "Comprehensive daily activity and habit monitoring" },
        { icon: Eye, title: "Behavioral Insights", description: "Deep pattern recognition and correlation analysis" },
        { icon: Network, title: "Cross-Reference Engine", description: "Multi-dimensional data relationship mapping" },
        { icon: BarChart3, title: "Performance Metrics", description: "Quantified self analytics and optimization" },
        { icon: Shield, title: "Privacy-First Architecture", description: "Enterprise-grade security and data protection" }
    ]

    return (
        <section id="features" className="py-32 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 luxury-pattern opacity-30" />
            <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-royal-500 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isInView ? 1 : 0 }}
                transition={{ duration: 1.5, delay: 0.2 }}
            />

            <div className="container mx-auto px-6 lg:px-8 relative z-10" ref={containerRef}>
                {/* Section Header */}
                <motion.div
                    className="text-center mb-20"
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
                        <Sparkles className="w-4 h-4 text-gold-400" />
                        <span className="text-sm font-medium text-gold-gradient">Platform Capabilities</span>
                    </motion.div>

                    <h2 className="enterprise-heading text-5xl lg:text-6xl text-premium-gradient mb-6">
                        Unprecedented Personal
                        <br />
                        <span className="text-royal-gradient">Intelligence Platform</span>
                    </h2>

                    <p className="professional-body text-xl text-platinum-300 max-w-3xl mx-auto">
                        Experience the future of personal analytics with enterprise-grade technology that transforms
                        raw life data into actionable insights for optimization and peak performance.
                    </p>
                </motion.div>

                {/* Main Features Grid */}
                <div className="grid lg:grid-cols-3 gap-8 mb-20">
                    {mainFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="premium-card p-8 h-full"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            whileHover={{ y: -5 }}
                        >
                            <motion.div
                                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 glow-royal`}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <feature.icon className="w-8 h-8 text-white" />
                            </motion.div>

                            <h3 className="enterprise-heading text-2xl text-white mb-4">
                                {feature.title}
                            </h3>

                            <p className="professional-body text-platinum-300 mb-6 leading-relaxed">
                                {feature.description}
                            </p>

                            <div className="space-y-3">
                                {feature.highlights.map((highlight, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex items-center space-x-3"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                                        transition={{ duration: 0.5, delay: (index * 0.2) + (idx * 0.1) + 0.5 }}
                                    >
                                        <div className="w-2 h-2 bg-royal-gradient rounded-full" />
                                        <span className="text-platinum-200 text-sm font-medium">{highlight}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Capabilities Grid */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <h3 className="enterprise-heading text-3xl text-center text-royal-gradient mb-12">
                        Core Capabilities
                    </h3>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {capabilities.map((capability, index) => (
                            <motion.div
                                key={index}
                                className="glass-premium p-6 rounded-lg border border-royal-500/20"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.6, delay: 1 + (index * 0.1) }}
                                whileHover={{
                                    scale: 1.05,
                                    borderColor: "rgba(139, 61, 247, 0.4)",
                                    transition: { duration: 0.2 }
                                }}
                            >
                                <capability.icon className="w-8 h-8 text-royal-400 mb-4" />
                                <h4 className="font-semibold text-white mb-2">{capability.title}</h4>
                                <p className="text-platinum-300 text-sm">{capability.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Technology Stack Highlight */}
                <motion.div
                    className="glass-royal p-12 rounded-2xl text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.2 }}
                >
                    <ThreeThreeLogo className="w-12 h-12 mx-auto mb-6" size={48} animate={true} />

                    <h3 className="enterprise-heading text-3xl text-gold-gradient mb-4">
                        Enterprise-Grade Technology Stack
                    </h3>

                    <p className="professional-body text-platinum-300 max-w-2xl mx-auto mb-8">
                        Built on cutting-edge AI frameworks with enterprise security, scalable architecture,
                        and precision analytics engines designed for mission-critical personal optimization.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6 text-platinum-400 text-sm">
                        <span className="flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>Advanced ML Pipeline</span>
                        </span>
                        <span className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>Zero-Trust Security</span>
                        </span>
                        <span className="flex items-center space-x-2">
                            <Brain className="w-4 h-4" />
                            <span>LLM Integration</span>
                        </span>
                        <span className="flex items-center space-x-2">
                            <Activity className="w-4 h-4" />
                            <span>Real-time Processing</span>
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}