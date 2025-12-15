'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Brain, Shield, Sparkles, Target } from 'lucide-react'
import ThreeThreeLogo from './ThreeThreeLogo'

export default function Footer() {
    const footerLinks = {
        Platform: [
            'Features',
            'Intelligence',
            'Security',
            'Integrations'
        ],
        Solutions: [
            'Personal Analytics',
            'Sleep Optimization',
            'Performance Tracking',
            'Enterprise'
        ],
        Resources: [
            'Documentation',
            'API Reference',
            'Case Studies',
            'White Papers'
        ],
        Company: [
            'About',
            'Careers',
            'Press',
            'Contact'
        ]
    }

    const socialLinks = [
        { name: 'LinkedIn', href: '#' },
        { name: 'Twitter', href: '#' },
        { name: 'GitHub', href: '#' },
    ]

    return (
        <footer className="relative py-20 mt-32 overflow-hidden">
            {/* Premium Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-royal-950/80 via-royal-950/40 to-transparent" />
                <div className="luxury-pattern opacity-20" />
            </div>

            <div className="container mx-auto px-6 lg:px-8 relative z-10">
                {/* Newsletter Section */}
                <motion.div
                    className="glass-royal p-12 rounded-2xl mb-16 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <ThreeThreeLogo />

                    <h3 className="enterprise-heading text-3xl text-gold-gradient mb-4">
                        Join the Elite Analytics Community
                    </h3>

                    <p className="professional-body text-platinum-300 max-w-2xl mx-auto mb-8">
                        Get exclusive access to advanced insights, research findings, and platform updates
                        from the forefront of personal analytics technology.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="flex-1 px-6 py-4 bg-black/20 border border-royal-500/30 rounded-lg text-white placeholder-platinum-400 focus:outline-none focus:border-royal-400 transition-colors"
                        />
                        <motion.button
                            className="btn-premium px-6 py-4 rounded-lg font-semibold text-white flex items-center justify-center space-x-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>Subscribe</span>
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Main Footer Content */}
                <div className="grid lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <motion.div
                            className="flex items-center space-x-3 mb-6"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <ThreeThreeLogo />
                            <span className="text-xl font-playfair font-bold text-premium-gradient">
                                Three Three
                            </span>
                        </motion.div>

                        <motion.p
                            className="professional-body text-platinum-300 mb-8 leading-relaxed"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            Rewolucyjna aplikacja mobilna Three Three przekształcająca dane osobiste w inteligentne analizy
                            poprzez zaawansowaną sztuczną inteligencję i cross-correlation analysis.
                        </motion.p>

                        <motion.div
                            className="flex space-x-4"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center space-x-2 text-platinum-400 text-sm">
                                <Shield className="w-4 h-4 text-royal-400" />
                                <span>Enterprise Security</span>
                            </div>
                            <div className="flex items-center space-x-2 text-platinum-400 text-sm">
                                <Brain className="w-4 h-4 text-gold-400" />
                                <span>AI-Powered</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Links Columns */}
                    {Object.entries(footerLinks).map(([category, links], index) => (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <h4 className="font-semibold text-white mb-4">{category}</h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-platinum-400 hover:text-royal-400 transition-colors duration-300 text-sm"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <motion.div
                    className="pt-8 border-t border-royal-500/20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-platinum-400 text-sm">
                            <p>&copy; 2025 Three Three. All rights reserved.</p>
                            <div className="flex space-x-6">
                                <a href="#" className="hover:text-royal-400 transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-royal-400 transition-colors">Terms of Service</a>
                                <a href="#" className="hover:text-royal-400 transition-colors">Security</a>
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2 text-platinum-400 text-sm">
                                <Target className="w-4 h-4 text-royal-400" />
                                <span>Precision Analytics</span>
                            </div>

                            <div className="flex space-x-4">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.href}
                                        className="text-platinum-400 hover:text-royal-400 transition-colors duration-300 text-sm"
                                    >
                                        {social.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Sparkles Animation */}
            <motion.div
                className="absolute bottom-10 right-10"
                animate={{
                    y: [0, -10, 0],
                    opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <Sparkles className="w-8 h-8 text-gold-400" />
            </motion.div>
        </footer>
    )
}