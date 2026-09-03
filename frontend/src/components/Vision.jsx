import React from 'react';

export default function Vision() {
  return (
    <div className="min-h-[70vh] bg-slate-50 pt-10 pb-24 px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">Our Vision</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-slate-700 leading-relaxed space-y-6">
          <p className="text-xl font-medium text-blue-600 mb-4">
            "To build a future where financial transparency is absolute, effortless, and instantaneous."
          </p>
          <p className="text-lg">
            At Auditly, we envision a world where chartered accountants are no longer burdened by the tedious mechanics of data verification. By automating the heavy lifting of anomaly detection, we empower auditors to focus on what they do best: strategic financial advisory, risk assessment, and driving business growth.
          </p>
          <p className="text-lg">
            Our goal over the next five years is to become the global standard for AI-assisted auditing, integrating seamlessly with every major ERP and accounting software on the market, providing real-time, continuous auditing capabilities to businesses of all sizes.
          </p>
        </div>
      </div>
    </div>
  );
}
