import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t bg-slate-900/40 border-darkBorder/40">
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} HeroCRM. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-colors text-slate-400 hover:text-accentIndigo border-b border-dashed border-slate-650 hover:border-accentIndigo pb-0.5"
            >
              Built for Digital Heroes Training Task
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
