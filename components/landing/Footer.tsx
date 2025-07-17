export default function Footer() {
  return (
    <footer className="py-8 px-4 bg-card border-t border-border text-center text-muted-foreground mt-8">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
        <span className="font-bold text-primary">Spt Teams</span>
        <div className="flex gap-4 text-sm">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </div>
        <span className="text-xs">&copy; {new Date().getFullYear()} Spt Teams. All rights reserved.</span>
      </div>
    </footer>
  );
} 