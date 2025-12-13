import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-5 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="text-left font-semibold text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-green-600 flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I make a booking?',
      answer: 'Simply browse our available pitches, select your preferred venue, choose a date and time slot, and complete the booking form. You can book as a guest or create an account for faster checkout and booking management.',
    },
    {
      question: 'How far in advance can I book a pitch?',
      answer: 'You can book a pitch up to 3 months in advance. Bookings must be made at least 24 hours before your desired time slot to allow for proper preparation by the venue.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit and debit cards, including Visa, Mastercard, and American Express. Payment is processed securely through our trusted payment partners.',
    },
    {
      question: 'Can I modify or cancel my booking?',
      answer: 'Yes, you can modify or cancel your booking up to 24 hours before the scheduled time for a full refund. Cancellations made less than 24 hours in advance are subject to our cancellation policy and may incur charges.',
    },
    {
      question: 'What happens if it rains on the day of my booking?',
      answer: 'Weather policies vary by venue. Most of our venues have covered or indoor facilities. For outdoor pitches, if severe weather makes play impossible, you can reschedule or receive a full refund. Contact the venue directly for their specific weather policy.',
    },
    {
      question: 'Is there a minimum or maximum number of players?',
      answer: 'Each pitch has its own capacity listed on the booking page. You can book for any number of players up to the maximum capacity. There is no minimum requirement, but we recommend checking the pitch size to ensure it suits your group size.',
    },
    {
      question: 'Do I need to bring my own equipment?',
      answer: 'You should bring your own football and appropriate footwear. Some venues offer equipment rental for an additional fee. Check the amenities section on the pitch page for specific details about what each venue provides.',
    },
    {
      question: 'Can I book multiple consecutive time slots?',
      answer: 'Absolutely! When making your booking, you can select a duration of 1, 2, or 3 hours. If you need more time, you can make multiple bookings back-to-back for the same pitch.',
    },
    {
      question: 'What are the age restrictions?',
      answer: 'Our facilities are suitable for all ages. However, children under 16 must be supervised by an adult at all times. Some venues may have specific age-related rules, which will be communicated during the booking process.',
    },
    {
      question: 'Is parking available at the venues?',
      answer: 'Most of our venues offer parking facilities. Check the amenities section on each pitch page for parking availability. Some venues may charge a separate parking fee.',
    },
    {
      question: 'Do you offer discounts for regular bookings?',
      answer: 'Yes! We offer various promotions and loyalty programs for regular users. Create an account to receive exclusive offers and notifications about special deals. Contact us for information about bulk booking discounts.',
    },
    {
      question: 'What if I arrive late to my booking?',
      answer: 'Please try to arrive 15 minutes before your booking time. If you arrive late, your session will still end at the originally scheduled time, and no refund or extension will be provided for the time missed.',
    },
    {
      question: 'Can I get a refund if I am not satisfied?',
      answer: 'We strive for complete customer satisfaction. If you experience any issues with the venue or facilities, please report them immediately to venue staff or contact our support team. Refunds are considered on a case-by-case basis.',
    },
    {
      question: 'How do I contact the venue directly?',
      answer: 'Venue contact information is provided in your booking confirmation email. You can also find contact details on our Contact Us page or reach out to our support team, and we will connect you with the appropriate venue.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-10">
              <div className="flex items-center space-x-3 mb-4">
                <HelpCircle className="w-10 h-10 text-white" />
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Frequently Asked Questions
                </h1>
              </div>
              <p className="text-green-100">
                Find answers to common questions about booking football pitches with Active SL
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))}
            </div>

            <div className="bg-gray-50 px-8 py-6">
              <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-gray-700 text-sm">
                Can't find what you're looking for? Our support team is here to help.
                Contact us at{' '}
                <a href="mailto:support@pitchpro.lk" className="text-green-600 hover:text-green-700">
                  support@activesl.lk
                </a>{' '}
                or call us at{' '}
                <a href="tel:+94112345678" className="text-green-600 hover:text-green-700">
                  +94 11 234 5678
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
