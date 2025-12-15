'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ThreeThreeLogo from './ThreeThreeLogo'

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const { scrollY } = useScroll()
    const backgroundOpacity = useTransform(scrollY, [0, 100], [0, 0.95])

    useEffect(() => {
        const unsubscribe = scrollY.onChange((latest) => {
            setIsScrolled(latest > 50)
        })
        return unsubscribe
    }, [scrollY])

    const navigationItems = [
        { name: 'Platform', href: '#platform' },
        { name: 'Features', href: '#features' },
        { name: 'Intelligence', href: '#intelligence' },
        { name: 'Download', href: '#download' },
    ]

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={{
                backgroundColor: isScrolled ? 'rgba(10, 1, 24, 0.95)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(20px)' : 'none',
            }}
        >
            <nav className="container mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <ThreeThreeLogo className="w-10 h-10" size={40} animate={true} />
                        <span className="text-xl font-playfair font-bold text-premium-gradient">
                            Three Three
                        </span>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navigationItems.map((item, index) => (
                            <motion.a
                                key={item.name}
                                href={item.href}
                                className="text-platinum-300 hover:text-royal-400 transition-colors duration-300 font-medium"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                {item.name}
                            </motion.a>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <motion.a
                            href="#download"
                            className="btn-premium px-6 py-3 rounded-lg font-semibold text-white"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Pobierz Aplikację
                        </motion.a>
                    </div>

                    {/* Mobile menu button */}
                    <motion.button
                        className="md:hidden text-platinum-300 hover:text-royal-400 transition-colors duration-300"
                        onClick={() => setIsOpen(!isOpen)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </motion.button>
                </div>

                {/* Mobile Navigation */}
                <motion.div
                    className={`md:hidden overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="py-6 space-y-4 glass-premium rounded-lg mt-4 px-6">
                        {navigationItems.map((item, index) => (
                            <motion.a
                                key={item.name}
                                href={item.href}
                                className="block text-platinum-300 hover:text-royal-400 transition-colors duration-300"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -20 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </motion.a>
                        ))}
                        <motion.div
                            className="pt-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isOpen ? 1 : 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                        >
                            <a
                                href="#download"
                                className="w-full btn-premium px-6 py-3 rounded-lg font-semibold text-white block text-center"
                                onClick={() => setIsOpen(false)}
                            >
                                Pobierz Aplikację
                            </a>
                        </motion.div>
                    </div>
                </motion.div>
            </nav>
        </motion.header>
    )
}