'use client';

import { useState } from 'react';
import Header from '../../components/Header';

import { 
  PhoneIcon, 
  DevicePhoneMobileIcon,
  EnvelopeIcon, 
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: PhoneIcon,
      title: 'Phone',
      details: '+1 (555) 019-8372',
      description: 'Call or WhatsApp us anytime'
    },
    {
      icon: PhoneIcon,
      title: 'Showroom',
      details: '+1 (555) 019-8373',
      description: 'Available during business hours'
    },
    {
      icon: EnvelopeIcon,
      title: 'Email',
      details: 'contact@Vellorajewels.com',
      description: 'We respond within 24 hours'
    },
    {
      icon: MapPinIcon,
      title: 'Address',
      details: '123 Luxury Avenue, Golden Estate, New York, NY 10001',
      description: 'Visit our flagship boutique'
    },
    {
      icon: ClockIcon,
      title: 'Boutique Hours',
      details: 'Mon - Fri: 10 AM - 8 PM',
      description: 'Saturday: 11 AM - 6 PM'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', formData);
    alert('Thank you for your message! Our jewellery experts will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8]">
      <Header />
      
      {/* Hero Section */}
      <section className="relative text-white py-24 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <img 
          src="/contact-bg.jpg"
          alt="Contact Vellora Jewels"
          className="absolute inset-0 z-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(135deg, rgba(26,18,9,0.85) 0%, rgba(107,26,26,0.7) 100%)' }} />
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #C9920A)' }} />
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase" style={{ color: '#C9920A' }}>Reach Out</span>
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #C9920A, transparent)' }} />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic' }}>Contact Us</h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow-md" style={{ color: '#F5E6C8' }}>
              We're here to assist you in finding or crafting your perfect piece of jewellery.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Get in Touch</h2>
            <p className="text-lg text-gray-600">
              Choose your preferred way to reach our concierge team
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center p-4 md:p-6 rounded-lg border border-gray-100 hover:shadow-xl transition-all duration-300 bg-white w-full overflow-hidden flex flex-col items-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(201,146,10,0.1)' }}>
                  <info.icon className="h-6 w-6" style={{ color: '#C9920A' }} />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
                <p className="font-medium mb-2 break-all text-sm md:text-base w-full px-1" style={{ color: '#8B6508' }}>{info.details}</p>
                <p className="text-xs md:text-sm text-gray-500 px-1">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-[#FFFDF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-yellow-900/5 p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Send an Inquiry</h2>
              <p className="text-lg text-gray-600">
                Whether you're looking for a custom design or need help with an order, we are at your service.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9920A] focus:border-transparent outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm transition-all text-gray-900"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="custom">Custom Design Consultation</option>
                  <option value="order">Order Status</option>
                  <option value="return">Return/Exchange</option>
                  <option value="support">Aftercare & Support</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Tell us how we can assist you..."
                />
              </div>
              
              <div className="text-center pt-4">
                <button
                  type="submit"
                  className="text-white px-10 py-4 rounded-full font-semibold transition-all duration-300 shadow-[0_4px_14px_0_rgba(201,146,10,0.39)] hover:shadow-[0_6px_20px_rgba(201,146,10,0.23)] hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #8B6508 0%, #C9920A 100%)' }}
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Live Chat Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl p-8 md:p-12 text-white relative overflow-hidden" style={{ background: '#6B1A1A' }}>
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 rounded-full bg-white opacity-5"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-10 rounded-full mb-6 backdrop-blur-sm">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-[#E8B84B]" />
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Looking for Expert Advice?</h2>
              <p className="text-xl mb-8 text-[#F5E6C8] max-w-2xl mx-auto">
                Connect with our master jewelers and diamond experts for personalized recommendations.
              </p>
              <button className="bg-white text-[#6B1A1A] px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-lg">
                Start Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-[#FFFDF8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-yellow-900/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Do your diamonds come with certification?</h3>
              <p className="text-gray-600 leading-relaxed">Yes, all our diamonds above 0.30 carats come with a grading report from internationally recognized laboratories such as GIA, IGI, or HRD.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-yellow-900/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">What is your exchange and buyback policy?</h3>
              <p className="text-gray-600 leading-relaxed">We offer a 100% exchange value on diamond jewellery within 30 days. For lifetime buyback, we offer 100% on gold weight at prevailing market rates and 90% on diamond value.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-yellow-900/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Can I request a custom design?</h3>
              <p className="text-gray-600 leading-relaxed">Absolutely. Our bespoke design service allows you to work directly with our master craftsmen to create a unique piece tailored perfectly to your vision.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-yellow-900/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">How do I care for my jewellery?</h3>
              <p className="text-gray-600 leading-relaxed">We recommend professional cleaning every 6 months. For day-to-day care, gently clean with mild soap and warm water using a soft brush, and store in the provided suede pouch when not worn.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 