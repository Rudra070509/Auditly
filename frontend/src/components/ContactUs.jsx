import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="bg-slate-50 pt-8 pb-8 px-8 flex-grow">
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight text-center">Contact Support</h1>
        
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Send us a message</h2>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea rows="3" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" placeholder="How can we help you?"></textarea>
              </div>
              <button className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm">
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Our support team of expert chartered accountants and technical specialists is available 24/7 to assist you with any inquiries.
              </p>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Email Us</div>
                  <div className="text-slate-600 text-sm">info@auditly.local</div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Call Us</div>
                  <div className="text-slate-600 text-sm">+91 98765 43210</div>
                  <div className="text-slate-500 text-xs">Toll Free: 1800 123 4567</div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Office Location</div>
                  <div className="text-slate-600 text-sm">Shri Bhagubhai Mafatlal Polytechnic</div>
                  <div className="text-slate-600 text-sm">SVKM, Vile Parle, Mumbai</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
