import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaHandsHelping, FaShippingFast, FaMapMarkerAlt, FaAward } from 'react-icons/fa';
import { topNav, makerLocations } from '../data/categories';

const features = [
  { icon: FaHandsHelping, label: 'Handmade by local artisans' },
  { icon: FaShippingFast, label: 'Free delivery over Rs 500/-' },
  { icon: FaMapMarkerAlt, label: 'Made in Nepal, sold locally' },
  { icon: FaAward, label: 'Best price on the market' },
];

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14">
      <div className="container mx-auto px-4">
        {/* Feature Icons Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-b border-slate-800 pb-10">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.label} className="flex flex-col items-center gap-2">
                <span className="w-11 h-11 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center text-xl">
                  <Icon />
                </span>
                <p className="text-sm text-slate-400">{feature.label}</p>
              </div>
            );
          })}
        </div>

        {/* Links and Socials Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-10">
          <div>
            <h3 className="text-white font-bold tracking-wide text-sm mb-4">ABOUT US</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Juttax connects Nepali footwear makers — across Kathmandu, Lalitpur and Bhaktapur — with shoppers
              looking for handmade, traditional and everyday footwear.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"><FaFacebook size={16} /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"><FaTwitter size={16} /></a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors"><FaInstagram size={16} /></a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide text-sm mb-4">CATEGORIES</h3>
            <ul className="space-y-2.5 text-sm">
              {topNav.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-slate-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide text-sm mb-4">SHOP BY MAKER</h3>
            <ul className="space-y-2.5 text-sm">
              {makerLocations.map((loc) => (
                <li key={loc.slug}>
                  <Link to={`/makers/${loc.slug}`} className="text-slate-400 hover:text-white transition-colors">{loc.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide text-sm mb-4">NEWSLETTER</h3>
            <p className="text-slate-400 text-sm mb-3">Subscribe for updates and promotions.</p>
            <form className="flex">
              <input type="email" placeholder="Your Email" className="p-2.5 rounded-l-lg text-slate-900 text-sm w-full outline-none focus:ring-2 focus:ring-brand-500" />
              <button type="submit" className="bg-brand-600 hover:bg-brand-700 px-4 rounded-r-lg text-sm font-semibold text-white transition-colors">Subscribe</button>
            </form>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="text-center py-5 border-t border-slate-800 text-sm text-slate-500">
          <p>Copyright {new Date().getFullYear()}. All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
