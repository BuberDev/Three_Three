'use client'

import { motion, useInView } from 'framer-motion'
import { Brain, Lightbulb, Network, Sparkles, Target } from 'lucide-react'
import { useRef } from 'react'
import ThreeThreeLogo from './ThreeThreeLogo'

export default function IntelligenceSection() {
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: true, margin: "-100px" })

    const intelligenceFeatures = [
        {
            icon: Brain,
            title: "Cognitive Pattern Analysis",
            description: "Advanced neural networks analyze your behavioral patterns, identifying subtle correlations between mental performance, sleep quality, and lifestyle factors.",
            example: "\"Your concentration drops 23% on days following late-night meals, based on analysis of 90 days of cross-referenced data.\"",
            color: "royal"
        },
        {
            icon: Network,
            title: "Multi-Dimensional Cross-Correlation",
            description: "Revolutionary correlation engine connects disparate data points across nutrition, sleep, emotions, and productivity to reveal hidden cause-effect relationships.",
            example: "\"Stress conversations after 8 PM correlate with 42% higher snoring intensity and 18% reduced REM sleep quality.\"",
            color: "gold"
        },
        {
            icon: Target,
            title: "Predictive Performance Optimization",
            description: "Machine learning algorithms predict optimal conditions for peak performance based on your unique physiological and behavioral patterns.",
            example: "\"Tomorrow's focus will be 15% higher if you limit sugar intake today and sleep by 10:30 PM.\"",
            color: "royal"
        }
    ]

    const insights = [
        "Sleep quality deteriorates by 31% when consuming high-sugar foods after 7 PM",
        "Productivity peaks occur 3.2 hours after optimal sleep cycle completion",
        "Emotional stress patterns directly correlate with disrupted breathing during sleep",
        "Exercise timing affects sleep architecture and next-day cognitive performance",
        "Voice journaling sentiment analysis predicts sleep disturbances with 89% accuracy"
    ]

    return (
        <section id="intelligence" className="py-32 relative overflow-hidden">
            {/* Premium Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-royal-950/50 via-transparent to-gold-950/30" />
                <motion.div
                    className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 61, 247, 0.1) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

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
                        <Brain className="w-4 h-4 text-gold-400" />
                        <span className="text-sm font-medium text-gold-gradient">Artificial Intelligence</span>
                    </motion.div>

                    <h2 className="enterprise-heading text-5xl lg:text-6xl text-premium-gradient mb-6">
                        Revolutionary AI
                        <br />
                        <span className="text-royal-gradient">Intelligence Engine</span>
                    </h2>

                    <p className="professional-body text-xl text-platinum-300 max-w-3xl mx-auto">
                        Our proprietary AI system processes millions of data points to uncover the hidden
                        connections between your sleep, lifestyle, emotions, and performance—delivering
                        insights that would take human analysts years to discover.
                    </p>
                </motion.div>

                {/* Intelligence Features */}
                <div className="grid lg:grid-cols-3 gap-8 mb-20">
                    {intelligenceFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="premium-card p-8 h-full relative overflow-hidden"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            whileHover={{ y: -5 }}
                        >
                            {/* Gradient accent */}
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color === 'royal'
                                ? 'from-royal-600 to-royal-400'
                                : 'from-gold-600 to-gold-400'
                                }`} />

                            <motion.div
                                className={`w-16 h-16 rounded-xl ${feature.color === 'royal'
                                    ? 'bg-gradient-to-br from-royal-600 to-royal-400'
                                    : 'bg-gradient-to-br from-gold-600 to-gold-400'
                                    } flex items-center justify-center mb-6 glow-royal`}
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

                            <motion.div
                                className="glass-premium p-4 rounded-lg border-l-4 border-royal-400"
                                initial={{ opacity: 0 }}
                                animate={isInView ? { opacity: 1 } : {}}
                                transition={{ duration: 0.6, delay: (index * 0.2) + 0.5 }}
                            >
                                <p className="text-platinum-200 italic text-sm leading-relaxed">
                                    {feature.example}
                                </p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* AI Insights Dashboard Mockup */}
                <motion.div
                    className="glass-royal p-8 rounded-2xl mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <div className="text-center mb-8">
                        <h3 className="enterprise-heading text-3xl text-royal-gradient mb-4">
                            Real AI-Generated Insights
                        </h3>
                        <p className="text-platinum-300">
                            Examples of correlations discovered by our intelligence engine
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                className="flex items-start space-x-3 glass-premium p-4 rounded-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.6, delay: 1 + (index * 0.1) }}
                            >
                                <Lightbulb className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                                <p className="text-platinum-200 text-sm leading-relaxed">{insight}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 1.2 }}
                >
                    <ThreeThreeLogo className="w-12 h-12 mx-auto mb-6" size={48} animate={true} />

                    <h3 className="enterprise-heading text-3xl text-gold-gradient mb-6">
                        Experience True Personal Intelligence
                    </h3>

                    <p className="professional-body text-platinum-300 max-w-2xl mx-auto mb-8">
                        Join the exclusive group of individuals leveraging enterprise-grade AI
                        to unlock their full potential through data-driven self-optimization.
                    </p>

                    <motion.button
                        className="btn-premium px-8 py-4 rounded-xl font-semibold text-white text-lg flex items-center space-x-3 mx-auto enterprise-shadow"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Sparkles className="w-5 h-5" />
                        <span>Request Intelligence Demo</span>
                    </motion.button>
                </motion.div>
            </div>
        </section>
    )
}