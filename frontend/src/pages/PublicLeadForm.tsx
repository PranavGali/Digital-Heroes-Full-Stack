import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../api/client';
import { Shield, Sparkles, Send, CheckCircle2, Building, User, Mail, Phone, AlertCircle } from 'lucide-react';

interface LeadFormInput {
  name: string;
  email: string;
  phone: string;
  company?: string;
  source?: string;
}

export const PublicLeadForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormInput>();

  const onSubmit = async (data: LeadFormInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      // Send submission to public API
      await apiClient.post('/leads', {
        ...data,
        source: 'Public Webform',
      });
      setSubmitted(true);
      reset();
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to submit lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md relative">
        {/* Visual Glowing Accents */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-accentIndigo/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accentBlue/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="glass-panel rounded-2xl border border-darkBorder/60 shadow-2xl overflow-hidden p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-accentIndigo/10 rounded-xl flex items-center justify-center border border-accentIndigo/20 mb-4">
              <Shield className="w-6 h-6 text-accentIndigo" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Connect With Us <Sparkles className="w-5 h-5 text-indigo-400" />
            </h2>
            <p className="mt-2 text-sm text-slate-400 text-center">
              Submit your inquiry and our team will get in touch with you shortly.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-8 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Inquiry Submitted!</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                Thank you for reaching out. We have logged your request and a sales representative will contact you soon.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 border border-darkBorder rounded-lg text-sm font-medium transition-all"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {apiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-start gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all ${
                      errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-darkBorder hover:border-slate-650'
                    }`}
                    {...register('name', { required: 'Name is required' })}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all ${
                      errors.email ? 'border-red-500/50 focus:ring-red-500' : 'border-darkBorder hover:border-slate-650'
                    }`}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all ${
                      errors.phone ? 'border-red-500/50 focus:ring-red-500' : 'border-darkBorder hover:border-slate-650'
                    }`}
                    {...register('phone', { required: 'Phone is required' })}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
              </div>

              <div>
                <label htmlFor="company" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="company"
                    type="text"
                    placeholder="Acme Corp (Optional)"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-darkBorder hover:border-slate-650 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all"
                    {...register('company')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accentIndigo to-indigo-650 hover:opacity-95 focus:outline-none hover:shadow-lg hover:shadow-accentIndigo/10 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 rounded-full border-white border-t-transparent animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Inquiry
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicLeadForm;
