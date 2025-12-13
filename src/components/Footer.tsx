import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onPageChange: (page: string) => void;
}

export default function Footer({ onPageChange }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Active SL</h3>
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
                  onClick={() => onPageChange('home')}
                  className="text-sm hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('venues')}
                  className="text-sm hover:text-white transition-colors"
                >
                  Our Venues
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('contact')}
                  className="text-sm hover:text-white transition-colors"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('venue-portal')}
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
                  onClick={() => onPageChange('terms')}
                  className="text-sm hover:text-white transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('privacy')}
                  className="text-sm hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('faqs')}
                  className="text-sm hover:text-white transition-colors"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('cancellation')}
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
                <span className="text-sm">123 Sports Avenue, Colombo, Sri Lanka</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">+94 11 234 5678</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">info@activesl.lk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              &copy; 2025 Active SL. All rights reserved. Registered trademark.
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
