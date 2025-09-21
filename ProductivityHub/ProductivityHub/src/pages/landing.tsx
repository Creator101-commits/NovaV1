import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignIn = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm border-b border-gray-100" : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">StudySync</div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-black transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-black transition-colors">Pricing</a>
              <button 
                onClick={handleSignIn}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            </div>
            {/* Mobile menu button */}
            <button className="md:hidden">
              <div className="w-6 h-0.5 bg-black mb-1"></div>
              <div className="w-6 h-0.5 bg-black mb-1"></div>
              <div className="w-6 h-0.5 bg-black"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="space-y-12 animate-fade-in">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none">
              Study<br />
              <span className="text-blue-600">Smarter</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              AI-powered productivity tools for academic excellence
            </p>
            
            <button 
              onClick={handleSignIn}
              className="group inline-flex items-center bg-black text-white px-8 py-4 text-lg rounded-lg hover:bg-gray-800 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Everything you need</h2>
            <p className="text-xl text-gray-600">Simple tools, powerful results</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
            {[
              { label: "AI Summaries" },
              { label: "Smart Calendar" },
              { label: "Task Manager" },
              { label: "Analytics" },
              { label: "Flashcards" },
              { label: "Pomodoro Timer" },
              { label: "Mood Tracker" },
              { label: "Google Sync" }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="text-center space-y-4 opacity-0 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto"></div>
                <p className="text-lg font-medium">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl md:text-3xl text-gray-600 mb-16">
            "StudySync transformed how I manage my coursework. My productivity increased by 300%."
          </p>
          <div className="space-y-2">
            <p className="font-medium">Sarah Chen</p>
            <p className="text-gray-500">Computer Science, Stanford</p>
          </div>
        </div>
      </section>

      {/* Used By Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-gray-600">Used by 10,000+ students worldwide</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to start?</h2>
          <p className="text-xl text-gray-600 mb-12">Join thousands of students already using StudySync</p>
          <button 
            onClick={handleSignIn}
            className="group inline-flex items-center bg-black text-white px-8 py-4 text-lg rounded-lg hover:bg-gray-800 transition-all duration-300"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
            <div className="text-2xl font-bold">StudySync</div>
            <div className="flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-black transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-500">
            <p>&copy; 2025 StudySync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
