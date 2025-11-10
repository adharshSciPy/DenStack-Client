import React, { useState } from 'react';
import { Palette, Lock, User, Bell, Shield, Globe } from 'lucide-react';
import axios from 'axios';
import baseUrl from '../baseUrl';
import { useSelector } from 'react-redux';

export default function SettingsGrid() {
  const userId = useSelector((state: any) => state?.auth?.user?.id) ?? null;
  
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [colorSettings, setColorSettings] = useState({
    startColor: '',
    endColor: '',
    primaryForeground: '',
    sidebarForeground: '',
    secondary: ''
  });

  const handleColorChange = (field: keyof typeof colorSettings, value: string) => {
    setColorSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveColors = async() => {
    console.log("clinic id in settings sidebar", userId);
    try {
      const res = await axios.patch(`${baseUrl}api/v1/auth/clinic/updateTheme/${userId}`, colorSettings);
      console.log(res);
      setShowColorPopup(false);
    } catch (error) {
      console.log(error);
    }
  };

  const settingsCards = [
    {
      id: 'colors',
      icon: Palette,
      title: 'Color Changing',
      description: 'Customize your theme colors',
      onClick: () => setShowColorPopup(true)
    },
    {
      id: 'password',
      icon: Lock,
      title: 'Password Reset',
      description: 'Change your password',
      onClick: () => alert('Password reset clicked')
    },
    {
      id: 'profile',
      icon: User,
      title: 'Profile Settings',
      description: 'Update your profile information',
      onClick: () => alert('Profile settings clicked')
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Manage notification preferences',
      onClick: () => alert('Notifications clicked')
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Security',
      description: 'Security and privacy settings',
      onClick: () => alert('Security clicked')
    },
    {
      id: 'language',
      icon: Globe,
      title: 'Language & Region',
      description: 'Set your language preferences',
      onClick: () => alert('Language clicked')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600 mb-4">Manage your account preferences and settings</p>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={card.onClick}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Picker Popup */}
      {showColorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl rounded-md">
              <div className="flex items-center justify-between ">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Color Customization</h2>
                </div>
                <button
                  onClick={() => setShowColorPopup(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Customize your theme colors to match your preferences
              </p>

              <div className="space-y-6">
                {/* Start Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Start Color
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={colorSettings.startColor}
                      onChange={(e) => handleColorChange('startColor', e.target.value)}
                      className="w-14 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <input
                      type="text"
                      value={colorSettings.startColor}
                      onChange={(e) => handleColorChange('startColor', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                {/* End Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    End Color
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={colorSettings.endColor}
                      onChange={(e) => handleColorChange('endColor', e.target.value)}
                      className="w-14 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <input
                      type="text"
                      value={colorSettings.endColor}
                      onChange={(e) => handleColorChange('endColor', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>

                {/* Primary Foreground */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Primary Foreground
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={colorSettings.primaryForeground}
                      onChange={(e) => handleColorChange('primaryForeground', e.target.value)}
                      className="w-14 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <input
                      type="text"
                      value={colorSettings.primaryForeground}
                      onChange={(e) => handleColorChange('primaryForeground', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Sidebar Foreground */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Sidebar Foreground
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={colorSettings.sidebarForeground}
                      onChange={(e) => handleColorChange('sidebarForeground', e.target.value)}
                      className="w-14 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <input
                      type="text"
                      value={colorSettings.sidebarForeground}
                      onChange={(e) => handleColorChange('sidebarForeground', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#1f2937"
                    />
                  </div>
                </div>

                {/* Secondary */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Secondary
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={colorSettings.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-14 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <input
                      type="text"
                      value={colorSettings.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Preview
                  </label>
                  <div
                    className="h-24 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${colorSettings.startColor || '#3b82f6'}, ${colorSettings.endColor || '#8b5cf6'})`
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowColorPopup(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveColors}
                  className="flex-1 px-6 py-3 bg-primary-gradient from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-semibold transition-all transform hover:scale-105"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}