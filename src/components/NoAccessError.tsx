'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NoAccessError() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Side - Image */}
          <div className="flex justify-center items-center order-2 lg:order-1">
            <div className="relative w-full max-w-xl">
              <img
                src="/oops_error.png"
                alt="No Access"
                className="w-full h-auto object-contain drop-shadow-2xl"
                style={{ minHeight: '400px', maxHeight: '600px' }}
              />
            </div>
          </div>

          {/* Right Side - Text & Links */}
          <div className="flex flex-col justify-center space-y-6 lg:space-y-8 order-1 lg:order-2">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight">
                Oops!
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 font-medium leading-relaxed">
                You don't have permission to access these tools.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-4 bg-blue-50 p-6 rounded-xl border-l-4 border-blue-600">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  Make sure you have an active subscription to unlock powerful testing and verification tools.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <i className="fas fa-headset text-blue-600 text-xl mt-1 flex-shrink-0"></i>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  Need help? We're here to support you!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Visit NitMiner Button */}
              <a
                href="https://www.nitminer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-base sm:text-lg group"
              >
                <i className="fas fa-globe mr-3 text-xl group-hover:rotate-12 transition-transform"></i>
                Visit NitMiner
                <i className="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform"></i>
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pricing Button */}
                <a
                  href="https://www.nitminer.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 text-sm sm:text-base group"
                >
                  <i className="fas fa-tag mr-2 group-hover:rotate-12 transition-transform"></i>
                  View Pricing
                </a>

                {/* Contact Button */}
                <button
                  onClick={() => router.push('/contact')}
                  className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 text-sm sm:text-base group"
                >
                  <i className="fas fa-envelope mr-2 group-hover:scale-110 transition-transform"></i>
                  Contact Us
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-6 mt-4 border-t border-gray-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm sm:text-base text-gray-600">
                  Don't have an account?
                </p>
                <a
                  href="https://www.nitminer.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-white text-blue-600 font-bold border-2 border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 text-sm sm:text-base group"
                >
                  <i className="fas fa-user-plus mr-2 group-hover:scale-110 transition-transform"></i>
                  Sign up on NitMiner
                  <i className="fas fa-external-link-alt ml-2 text-xs"></i>
                </a>
              </div>
            </div>

            {/* Support Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-shield-alt text-blue-600"></i>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Secure</p>
                  <p className="text-xs text-gray-600">100% Safe</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-clock text-green-600"></i>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">24/7 Support</p>
                  <p className="text-xs text-gray-600">Always Here</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-rocket text-purple-600"></i>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Fast Setup</p>
                  <p className="text-xs text-gray-600">Get Started</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}