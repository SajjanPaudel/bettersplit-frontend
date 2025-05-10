import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { FaUsers, FaMoneyBillWave, FaChartLine, FaQrcode, FaStar, FaCheck, FaTimes } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';

const styles = `
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

@keyframes float-delayed {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

@keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}

@keyframes pulse-delayed {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}

@keyframes pulse-glow {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.08); }
}

.animate-float {
    animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float-delayed 6s ease-in-out infinite;
    animation-delay: -3s;
}

.animate-pulse {
    animation: pulse 4s ease-in-out infinite;
}

.animate-pulse-delayed {
    animation: pulse-delayed 4s ease-in-out infinite;
    animation-delay: -2s;
}

.animate-pulse-glow {
    animation: pulse-glow 3.5s cubic-bezier(0.4,0,0.2,1) infinite;
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

function Landing() {
    const { theme, isDark } = useTheme();
    const [activeSection, setActiveSection] = useState(0);
    const [carouselStep, setCarouselStep] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollYProgress } = useScroll();

    const sections = [
        { id: 'hero', label: 'Home' },
        { id: 'features', label: 'Features' },
        { id: 'how-it-works', label: 'How It Works' },
        { id: 'comparison', label: 'Comparison' },
        { id: 'reviews', label: 'Reviews' },
    ];

    const steps = [
        {
            step: 1,
            title: "Create a Group",
            description: "Start by creating a group with your friends, roommates, or travel companions. Add members and set up your group preferences.",
            media: "/step1.png",
            type: "image",
            features: ["Invite friends via email", "Multiple groups support"]
        },
        {
            step: 2,
            title: "Add Expenses",
            description: "Add expenses to your group and specify who paid and who owes what. Split expenses equally or customize the split.",
            media: "/step2.png",
            type: "image",
            features: ["Equal or custom splits", "Multiple Payees", "Multiple Payers"]
        },
        {
            step: 3,
            title: "Track Balances",
            description: "View real-time balances and see who owes whom. Get detailed insights into your group's spending patterns.",
            media: "/dark.png",
            type: "image",
            features: ["Real-time updates", "Detailed analytics"]
        },
        {
            step: 4,
            title: "Settle Up",
            description: "Use QR code payments to settle debts instantly with friends. Multiple payment methods supported.",
            media: "/step4.png",
            type: "image",
            features: ["QR code payments", "Multiple payment methods", "Partial payments"]
        }
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [isPaused, setIsPaused] = useState(false);

    // Autoplay functionality
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setDirection(1);
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 4000);

        return () => clearInterval(timer);
    }, [isPaused, steps.length]);


    const goToStep = (index) => {
        setDirection(index > currentStep ? 1 : -1);
        setCurrentStep(index);
        setIsPaused(true); // Pause autoplay when manually navigating
    };

    // Reset autoplay when section comes into view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.target.id === 'how-it-works') {
                        setIsPaused(false); // Resume autoplay when section is visible
                    } else if (!entry.isIntersecting && entry.target.id === 'how-it-works') {
                        setIsPaused(true); // Pause autoplay when section is not visible
                    }
                });
            },
            { threshold: 0.5 }
        );

        const element = document.getElementById('how-it-works');
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    // Refs for each section
    const sectionRefs = useRef([]);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // Update active section immediately for better UX
            const idx = sections.findIndex(s => s.id === sectionId);
            if (idx !== -1) {
                setActiveSection(idx);
                // Only reset carousel when explicitly navigating to how-it-works section
                if (sectionId === 'how-it-works') {
                    setCurrentStep(0);
                }
            }
        }
    };

    useEffect(() => {
        // Intersection Observer for scroll snapping
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.6, // 60% of section in view
        };
        const observer = new window.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const idx = sections.findIndex(s => s.id === entry.target.id);
                    if (idx !== -1) {
                        setActiveSection(idx);
                    }
                }
            });
        }, observerOptions);

        // Observe all sections
        sections.forEach((section, index) => {
            const element = document.getElementById(section.id);
            if (element) {
                observer.observe(element);
                sectionRefs.current[index] = element;
            }
        });

        return () => {
            if (observer) {
                sections.forEach((section, index) => {
                    if (sectionRefs.current[index]) {
                        observer.unobserve(sectionRefs.current[index]);
                    }
                });
            }
        };
    }, [sections]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 snap-y snap-mandatory overflow-y-auto h-screen relative">
            {/* Floating Navbar */}
            <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md rounded-full shadow-lg px-12 py-3 flex gap-8 items-center border border-purple-900/20 min-w-[1000px] lg:flex hidden">
                <span className="font-extrabold text-xl tracking-tight">
                    <span className="text-gray-200">BETTER</span><span className="text-purple-500">SPLIT</span>
                </span>
                {sections.map((section, idx) => (
                    <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`text-base font-semibold px-4 py-1 rounded transition-colors duration-200 focus:outline-none ${
                            activeSection === idx
                                ? 'text-purple-400 font-bold'
                                : 'text-gray-200 hover:text-purple-300'
                        }`}
                    >
                        {section.label}
                    </button>
                ))}
            </nav>

            {/* Mobile Menu Button */}
            <div className="fixed top-6 right-6 z-50 lg:hidden">
                <motion.button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-500/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <div className="flex flex-col gap-1.5">
                        <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </div>
                </motion.button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 right-6 z-50 lg:hidden"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-purple-900/20 overflow-hidden">
                            {sections.map((section, idx) => (
                                <motion.button
                                    key={section.id}
                                    onClick={() => {
                                        scrollToSection(section.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full px-6 py-3 text-left text-base font-semibold transition-colors duration-200 ${
                                        activeSection === idx
                                            ? 'text-purple-400 bg-purple-500/10'
                                            : 'text-gray-200 hover:bg-white/5'
                                    }`}
                                    whileHover={{ x: 5 }}
                                >
                                    {section.label}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle SVG Background Pattern */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
                <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 V 40 H 0" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.12" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>


            {/* Hero Section */}
            <section id="hero" ref={el => sectionRefs.current[0] = el} className="min-h-screen flex items-center relative overflow-hidden snap-start">
                {/* Subtle SVG Grid Pattern */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
                    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <defs>
                            <pattern id="grid-hero" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 V 40 H 0" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.12" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-hero)" />
                    </svg>
                </div>
                {/* Animated Gradient Background */}
                <motion.div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/30 via-blue-500/20 to-pink-500/20 rounded-full blur-3xl rotate-12"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5],
                            rotate: [12, 24, 12],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-blue-500/10 rounded-full blur-2xl -rotate-12"
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.4, 0.7, 0.4],
                            rotate: [-12, -24, -12],
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        }}
                    />
                </motion.div>
                <div className="container mx-auto px-4 py-24 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                    {/* Left: Headline and CTA */}
                    <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
                        <motion.div
                            className="inline-block px-6 py-2 bg-purple-500/10 rounded-full mb-2"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <span className="text-purple-500 font-semibold text-lg tracking-wide">SPLIT EXPENSES, STAY FRIENDS</span>
                        </motion.div>
                        {/* <motion.h1
                            className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg mb-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                        >
                            Track. Split. Settle.
                        </motion.h1> */}
                        <motion.p
                            className="text-lg md:text-xl text-gray-300 max-w-2xl mb-4 font-medium"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                        >
                            Group expenses, made easy. No more awkward calculations or missed payments—just simple, transparent, and fair splitting.
                        </motion.p>
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.5 }}
                        >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                                <Link
                                    to="/signup"
                                    className="w-full sm:w-auto px-10 py-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 text-lg font-semibold flex items-center justify-center gap-2 group shadow-lg"
                                >
                                    Get Started
                                    <motion.span
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="group-hover:translate-x-1 transition-transform"
                                    >
                                        →
                                    </motion.span>
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                                <Link
                                    to="/login"
                                    className="w-full sm:w-auto px-10 py-4 border border-gray-700 text-gray-300 rounded-xl hover:bg-purple-500/10 transition-all duration-300 text-lg font-semibold flex items-center justify-center shadow-lg"
                                >
                                    Login
                                </Link>
                            </motion.div>
                        </motion.div>
                        {/* Social Proof or Stats */}
                        {/* <motion.div
                            className="flex flex-wrap justify-center lg:justify-start gap-8 pt-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.6 }}
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-purple-400">XK+</span>
                                <span className="text-gray-400 text-base">Active Users</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-blue-400">XK+</span>
                                <span className="text-gray-400 text-base">Expenses Split</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-pink-400">100%</span>
                                <span className="text-gray-400 text-base">Satisfaction</span>
                            </div>
                        </motion.div> */}
                    </div>
                    {/* Right: Screenshot Placeholder */}
                    <div className="flex-1 flex items-center justify-center w-full h-full">
                        <div className="relative w-full max-w-3xl flex items-center justify-center min-h-[500px]">
                            {/* Pulsing Glow Animation */}
                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                <div className="w-[520px] h-[520px] rounded-full bg-gradient-to-br from-purple-500/40 via-pink-500/30 to-blue-500/30 blur-3xl animate-pulse-glow" />
                            </div>
                            {/* Dashboard Screenshot */}
                            <img
                                src="/dark.png"
                                alt="BetterSplit Dashboard Screenshot"
                                className="w-full h-full relative z-10 rounded-2xl shadow-2xl border border-purple-900/20 object-contain"
                                style={{ maxHeight: 800 }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" ref={el => sectionRefs.current[1] = el} className="min-h-screen flex items-center bg-transparent relative overflow-hidden snap-start">
                {/* Animated Gradient Background for Section */}
                <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.7 }}
                    transition={{ duration: 1 }}
                >
                    <motion.div
                        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-pink-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
                <div className="container mx-auto px-4 relative z-10">
                    <motion.h2
                        className="text-4xl md:text-5xl font-extrabold text-center text-white mb-16 drop-shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Powerful <span className="text-purple-500">Features</span>
                    </motion.h2>
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {[
                            { icon: FaUsers, title: "Group Management", description: "Create and manage multiple groups for different expenses." },
                            { icon: FaMoneyBillWave, title: "Expense Tracking", description: "Track all your expenses with detailed categorization." },
                            { icon: FaChartLine, title: "Smart Analytics", description: "Get insights into your spending patterns and group balances." },
                            { icon: FaQrcode, title: "Quick Payments", description: "Settle debts instantly with QR code payments and reminders." }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                className="p-8 bg-white/5 backdrop-blur-md rounded-2xl shadow-xl flex flex-col items-center text-center border border-purple-900/20 hover:border-purple-500 transition-colors group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 * index }}
                                whileHover={{ scale: 1.07, boxShadow: "0 8px 32px 0 rgba(139,92,246,0.18)" }}
                            >
                                <feature.icon className="text-5xl text-purple-400 mb-4 group-hover:text-purple-500 transition-colors" />
                                <h3 className="text-2xl font-bold text-white mb-2 drop-shadow">{feature.title}</h3>
                                <p className="text-gray-200 text-base">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
                {/* Subtle SVG Grid Pattern */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
                    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <defs>
                            <pattern id="grid-features" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 V 40 H 0" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.12" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-features)" />
                    </svg>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" ref={el => sectionRefs.current[2] = el} className="min-h-screen flex items-center bg-transparent relative overflow-hidden snap-start">
                <div className="container mx-auto px-4 relative z-10">
                    <motion.h2
                        className="text-4xl md:text-5xl font-extrabold text-center text-white mb-16 drop-shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* How It <span className="text-purple-500">Works</span> */}
                    </motion.h2>

                    <div className="relative max-w-7xl mx-auto">
                        {/* Navigation Buttons */}
                        {/* <div className="relative top-0 mt-2  left-10 -translate-x-1/2 flex items-center gap-4 z-20">
                            <button
                                onClick={prevStep}
                                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-500/20 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={nextStep}
                                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-500/20 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div> */}

                        {/* Carousel Content */}
                        <div className="relative h-[70vh] mt-16">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={currentStep}
                                    initial={{ 
                                        opacity: 0,
                                        x: direction > 0 ? 100 : -100
                                    }}
                                    animate={{ 
                                        opacity: 1,
                                        x: 0
                                    }}
                                    exit={{ 
                                        opacity: 0,
                                        x: direction > 0 ? -100 : 100
                                    }}
                                    transition={{ 
                                        duration: 0.5,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0"
                                    onMouseEnter={() => setIsPaused(true)}
                                    onMouseLeave={() => setIsPaused(false)}
                                >
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xs p-8 border border-purple-900/20 hover:shadow-purple-500 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 group h-full flex flex-col lg:flex-row items-center gap-8">
                                        {/* Media Container */}
                                        <motion.div 
                                            className="w-full lg:w-3/5 h-full relative"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                        >
                                            <div className="h-full rounded-xl overflow-hidden shadow-2xl relative group">
                                                <motion.img
                                                    src={steps[currentStep].media}
                                                    alt={steps[currentStep].title}
                                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.3 }}
                                                />
                                            </div>
                                        </motion.div>
                                        
                                        {/* Content */}
                                        <motion.div 
                                            className="w-full lg:w-2/5 flex flex-col justify-center"
                                            initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.5, delay: 0.4 }}
                                        >
                                            <motion.div 
                                                className="inline-block px-4 py-2 bg-purple-500/20 rounded-full mb-4"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.5 }}
                                            >
                                                <span className="text-purple-400 font-semibold">Step {steps[currentStep].step}</span>
                                            </motion.div>
                                            <motion.h3 
                                                className="text-3xl font-bold text-white mb-4"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.6 }}
                                            >
                                                {steps[currentStep].title}
                                            </motion.h3>
                                            <motion.p 
                                                className="text-gray-300 text-lg leading-relaxed mb-6"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.7 }}
                                            >
                                                {steps[currentStep].description}
                                            </motion.p>
                                            
                                            {/* Feature List */}
                                            <div className="space-y-3">
                                                {steps[currentStep].features.map((feature, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="flex items-center gap-3 text-gray-200"
                                                        initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: 0.8 + (idx * 0.1) }}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                            <FaCheck className="text-purple-400 text-sm" />
                                                        </div>
                                                        <span>{feature}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation Dots */}
                        <div className="flex justify-center gap-2 mt-8">
                            {steps.map((_, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => goToStep(index)}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        currentStep === index ? 'bg-purple-500' : 'bg-gray-600 hover:bg-purple-500/50'
                                    }`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section id="comparison" ref={el => sectionRefs.current[2] = el} className="min-h-screen flex items-center relative overflow-hidden snap-start bg-transparent">
                {/* Animated Gradient Background for Section */}
                <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.7 }}
                    transition={{ duration: 1 }}
                >
                    <motion.div
                        className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
                <div className="container mx-auto px-4 relative z-10">
                    <motion.h2
                        className="text-4xl md:text-5xl font-extrabold text-center text-white mb-16 drop-shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Why Choose Us ?
                    </motion.h2>
                    <motion.div
                        className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {/* SplitPro Card */}
                        <motion.div
                            className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-purple-900/20 hover:border-purple-500 transition-colors group"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ scale: 1.04 }}
                        >
                            <h3 className="text-2xl font-bold text-purple-500 mb-6 drop-shadow">BetterSplit</h3>
                            <ul className="space-y-5">
                                {[
                                    "Modern, intuitive interface",
                                    "Real-time expense tracking",
                                    "Advanced analytics",
                                    "QR code payments"
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center text-white text-lg gap-3">
                                        <FaCheck className="text-green-400" /> {feature}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        {/* Splitwise Card */}
                        <motion.div
                            className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-700/40 hover:border-red-400 transition-colors group"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            whileHover={{ scale: 1.04 }}
                        >
                            <h3 className="text-2xl font-bold text-gray-400 mb-6 drop-shadow">Splitwise</h3>
                            <ul className="space-y-5">
                                {[
                                    "Outdated interface",
                                    "Limited analytics",
                                    "No QR payments",
                                    "Basic features only"
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center text-gray-300 text-lg gap-3">
                                        <FaTimes className="text-red-400" /> {feature}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </motion.div>
                </div>
                {/* Subtle SVG Grid Pattern */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
                    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <defs>
                            <pattern id="grid-comparison" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 V 40 H 0" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.12" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-comparison)" />
                    </svg>
                </div>
            </section>

            {/* Reviews Section */}
            <section id="reviews" ref={el => sectionRefs.current[3] = el} className="min-h-screen flex items-center bg-transparent relative overflow-hidden snap-start">
                {/* Animated Gradient Background for Section */}
                <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.7 }}
                    transition={{ duration: 1 }}
                >
                    <motion.div
                        className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
                <div className="container mx-auto px-4 relative z-10">
                    <motion.h2
                        className="text-4xl md:text-5xl font-extrabold text-center text-white mb-16 drop-shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        What Our <span className="text-purple-500">Users</span> Say
                    </motion.h2>
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-10"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {[
                            {
                                name: "Sayun Tamrakar",
                                role: "Power User",
                                review: "BetterSplit has completely transformed how I manage shared expenses. The interface is intuitive and the features are exactly what I needed."
                            },
                            {
                                name: "Sajjan Paudel",
                                role: "Group Admin",
                                review: "Managing multiple groups has never been easier. The analytics features help me keep track of everything efficiently."
                            },
                            {
                                name: "Ishu Shrestha",
                                role: "User",
                                review: "The QR code payment feature is a game-changer. Settling debts with friends is now instant and hassle-free."
                            }
                        ].map((review, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-purple-900/20 hover:border-purple-500 transition-colors group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 * index }}
                                whileHover={{ scale: 1.06, boxShadow: "0 8px 32px 0 rgba(139,92,246,0.18)" }}
                            >
                                <div className="flex items-center mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className="text-yellow-400 text-xl mx-0.5" />
                                    ))}
                                </div>
                                <p className="text-gray-200 mb-4 italic">"{review.review}"</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {review.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-white font-semibold">{review.name}</h4>
                                        <p className="text-purple-300 text-sm">{review.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
                {/* Subtle SVG Grid Pattern */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
                    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <defs>
                            <pattern id="grid-reviews" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 V 40 H 0" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.12" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-reviews)" />
                    </svg>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 relative overflow-hidden snap-start">
                {/* Subtle SVG Grid Pattern */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
                    <svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <defs>
                            <pattern id="grid-footer" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 V 40 H 0" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.12" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-footer)" />
                    </svg>
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    {/* Minimal Footer Content */}
                    <div className="flex flex-col items-center justify-center gap-8 mb-16">
                        {/* Brand Section */}
                        <motion.div
                            className="space-y-6 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center justify-center space-x-3">
                                <motion.div
                                    className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <span className="text-white text-xl font-bold">BS</span>
                                </motion.div>
                                <h3 className="text-2xl font-bold tracking-tight">
                                    <span className="text-gray-200">BETTER</span><span className="text-purple-500">SPLIT</span>
                                </h3>
                            </div>
                            <p className="text-gray-300 leading-relaxed max-w-xl mx-auto">
                                Making expense sharing simple and efficient for everyone. Join BetterSplit for all your group expense management needs.
                            </p>
                            {/* <div className="flex justify-center space-x-4">
                                {['twitter', 'facebook', 'instagram', 'linkedin'].map((social) => (
                                    <motion.a
                                        key={social}
                                        href={`#${social}`}
                                        className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-purple-500 transition-colors"
                                        whileHover={{ scale: 1.1, backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <i className={`fab fa-${social}`}></i>
                                    </motion.a>
                                ))}
                            </div> */}
                        </motion.div>
                    </div>
                    {/* Bottom Bar */}
                    <motion.div
                        className="border-t border-gray-800 pt-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <p className="text-gray-400">
                                &copy; {new Date().getFullYear()} BetterSplit. All rights reserved.
                            </p>
                            <div className="flex space-x-6">
                                    <motion.a
                                        href="#"
                                        className="text-gray-400 hover:text-purple-400 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Kathmandu, Nepal
                                    </motion.a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </footer>
        </div>
    );
}

export default Landing; 