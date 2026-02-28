import { Zap } from "lucide-react";
import { KITE_TESTNET } from "@/lib/kite-config";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Categories</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Graphics & Design</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Digital Marketing</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Writing & Translation</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Video & Animation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">For Clients</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-500 transition-colors">How to Hire</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Talent Marketplace</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Project Catalog</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Enterprise</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">For Freelancers</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-500 transition-colors">How to Find Work</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Direct Contracts</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Find Freelance Jobs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-emerald-500 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Trust & Safety</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Help & Support</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <span className="text-xl font-black text-white">Chain</span>
            <span className="text-xl font-black text-emerald-500">Lancer</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">© 2026 ChainLancer. Built on Avalanche.</p>
        </div>
      </div>
    </footer>
  );
}
