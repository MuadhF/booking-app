import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">RivoBook</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your premier destination for booking quality football pitches. Making sports accessible to everyone.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    navigate('/');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/venues');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  Our Venues
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/venue-login');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  Venue Portal
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    navigate('/terms');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/privacy');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/faqs');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/cancellation-policy');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm hover:text-white transition-colors"
                >
                  Cancellation Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <span className="text-sm">62/1, Dudley Senanayake Mawatha, Dehiwala - Mount Lavinia, 
Colombo </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">+94 11 234 5678</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">info@rivobook.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              &copy; 2026 RivoBook. All rights reserved. Registered trademark.
            </p>
            <p className="text-sm text-gray-400">
              Made with passion for football lovers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
