import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { topNav, makerLocations } from '../data/categories';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white pt-12">
      <div className="container mx-auto px-4">
        {/* Feature Icons Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-b border-gray-700 pb-8">
            <div><i className="fas fa-hands text-3xl mb-2 text-indigo-400"></i><p>Handmade by local artisans</p></div>
            <div><i className="fas fa-shipping-fast text-3xl mb-2 text-indigo-400"></i><p>Free delivery over Rs 500/-</p></div>
            <div><i className="fas fa-map-marker-alt text-3xl mb-2 text-indigo-400"></i><p>Made in Nepal, sold locally</p></div>
            <div><i className="fas fa-award text-3xl mb-2 text-indigo-400"></i><p>Best price on the market</p></div>
        </div>

        {/* Links and Socials Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8">
            <div>
                <h3 className="font-bold mb-4">ABOUT US</h3>
                <p className="text-gray-400">Juttax connects Nepali footwear makers — across Kathmandu, Lalitpur and Bhaktapur — with shoppers looking for handmade, traditional and everyday footwear.</p>
                <div className="flex space-x-4 mt-4">
                    <a href="#" className="hover:text-indigo-400"><FaFacebook size={20}/></a>
                    <a href="#" className="hover:text-indigo-400"><FaTwitter size={20}/></a>
                    <a href="#" className="hover:text-indigo-400"><FaInstagram size={20}/></a>
                </div>
            </div>
            <div>
                <h3 className="font-bold mb-4">CATEGORIES</h3>
                <ul>
                    {topNav.map((item) => (
                      <li className="mb-2" key={item.label}>
                        <Link to={item.to} className="text-gray-400 hover:text-white">{item.label}</Link>
                      </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="font-bold mb-4">SHOP BY MAKER</h3>
                <ul>
                    {makerLocations.map((loc) => (
                      <li className="mb-2" key={loc.slug}>
                        <Link to={`/makers/${loc.slug}`} className="text-gray-400 hover:text-white">{loc.label}</Link>
                      </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="font-bold mb-4">NEWSLETTER</h3>
                <p className="text-gray-400 mb-2">Subscribe for updates and promotions.</p>
                <form className="flex">
                    <input type="email" placeholder="Your Email" className="p-2 rounded-l-md text-black w-full" />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-r-md">Subscribe</button>
                </form>
            </div>
        </div>

        {/* Copyright Section */}
        <div className="text-center py-4 border-t border-gray-700">
            <p>Copyright {new Date().getFullYear()}. All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;