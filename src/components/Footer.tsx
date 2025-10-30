import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Copyright */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SP</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Nova. All rights reserved.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              href="/privacy-policy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms-of-service"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <a 
              href="mailto:support@nova.app"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Nova helps students stay organized and productive. 
            Built with privacy and academic integrity in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
