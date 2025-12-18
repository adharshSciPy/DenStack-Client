import { useState } from 'react';
import { Send, MessageSquare, Bell, Clock, CheckCircle, FileText, Calendar, DollarSign } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  category: 'appointment' | 'follow-up' | 'invoice' | 'reminder';
  content: string;
  fields: string[];
};

export default function NotificationCenter() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [recipientType, setRecipientType] = useState<'individual' | 'group'>('individual');

  const templates: Template[] = [
    {
      id: 'T001',
      name: 'Appointment Confirmation',
      category: 'appointment',
      content: 'Dear {name}, your appointment with {doctor} is confirmed for {date} at {time}. Please arrive 15 minutes early. - HealthCare Clinic',
      fields: ['name', 'doctor', 'date', 'time']
    },
    {
      id: 'T002',
      name: 'Appointment Reminder',
      category: 'reminder',
      content: 'Reminder: You have an appointment with {doctor} tomorrow at {time}. Reply CONFIRM to confirm or CANCEL to reschedule. - HealthCare Clinic',
      fields: ['doctor', 'time']
    },
    {
      id: 'T003',
      name: 'Doctor Ready Notification',
      category: 'appointment',
      content: 'Dear {name}, {doctor} is ready to see you now. Please proceed to {room}. - HealthCare Clinic',
      fields: ['name', 'doctor', 'room']
    },
    {
      id: 'T004',
      name: 'Follow-up Instructions',
      category: 'follow-up',
      content: 'Dear {name}, please follow these post-consultation instructions: {instructions}. Next visit on {date}. Contact us for any concerns. - HealthCare Clinic',
      fields: ['name', 'instructions', 'date']
    },
    {
      id: 'T005',
      name: 'Invoice Notification',
      category: 'invoice',
      content: 'Dear {name}, your invoice #{invoiceId} for ₹{amount} has been generated. You can view/download it here: {link}. Thank you! - HealthCare Clinic',
      fields: ['name', 'invoiceId', 'amount', 'link']
    },
    {
      id: 'T006',
      name: 'Payment Reminder',
      category: 'reminder',
      content: 'Dear {name}, you have a pending payment of ₹{amount} for invoice #{invoiceId}. Please clear your dues at the earliest. - HealthCare Clinic',
      fields: ['name', 'amount', 'invoiceId']
    },
    {
      id: 'T007',
      name: 'Lab Results Ready',
      category: 'follow-up',
      content: 'Dear {name}, your {testName} results are ready. Please visit the clinic to collect or reply YES to receive via email. - HealthCare Clinic',
      fields: ['name', 'testName']
    },
    {
      id: 'T008',
      name: 'Prescription Sent',
      category: 'follow-up',
      content: 'Dear {name}, your prescription from {doctor} has been sent via WhatsApp. Please follow the dosage instructions carefully. - HealthCare Clinic',
      fields: ['name', 'doctor']
    },
  ];

  const recentMessages = [
    { id: 'M001', recipient: 'Rahul Verma', message: 'Appointment confirmed for tomorrow 10 AM', status: 'delivered', time: '2 mins ago', type: 'WhatsApp' },
    { id: 'M002', recipient: 'Priya Sharma', message: 'Doctor is ready to see you now', status: 'read', time: '5 mins ago', type: 'SMS' },
    { id: 'M003', recipient: 'Amit Patel', message: 'Lab results ready for collection', status: 'delivered', time: '15 mins ago', type: 'WhatsApp' },
    { id: 'M004', recipient: 'Sneha Reddy', message: 'Payment reminder for pending dues', status: 'sent', time: '1 hour ago', type: 'SMS' },
  ];

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setMessageContent(template.content);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'appointment': return Calendar;
      case 'follow-up': return FileText;
      case 'invoice': return DollarSign;
      case 'reminder': return Bell;
      default: return MessageSquare;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'appointment': return 'blue';
      case 'follow-up': return 'green';
      case 'invoice': return 'purple';
      case 'reminder': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'read': return 'text-blue-600 bg-blue-100';
      case 'sent': return 'text-orange-600 bg-orange-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">WhatsApp & SMS Notifications</h2>
        <p className="text-gray-500 mt-1">Send messages to patients using templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
              <h3 className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Message Templates
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-[700px] overflow-y-auto">
              {templates.map((template) => {
                const Icon = getCategoryIcon(template.category);
                const color = getCategoryColor(template.category);
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTemplate?.id === template.id
                        ? `border-${color}-500 bg-${color}-50`
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 mb-1">{template.name}</p>
                        <span className={`inline-block px-2 py-0.5 bg-${color}-100 text-${color}-700 rounded-full text-xs`}>
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compose Message */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compose Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              Compose Message
            </h3>

            <div className="space-y-4">
              {/* Recipient Type */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Send To</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRecipientType('individual')}
                    className={`flex-1 px-5 py-3 rounded-xl border-2 transition-all min-h-[44px] ${
                      recipientType === 'individual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Individual Patient
                  </button>
                  <button
                    onClick={() => setRecipientType('group')}
                    className={`flex-1 px-5 py-3 rounded-xl border-2 transition-all min-h-[44px] ${
                      recipientType === 'group'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Group/Bulk
                  </button>
                </div>
              </div>

              {/* Recipient Selection */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  {recipientType === 'individual' ? 'Patient Name/Phone' : 'Select Group'}
                </label>
                {recipientType === 'individual' ? (
                  <input
                    type="text"
                    placeholder="Search patient..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>All Patients</option>
                    <option>Today's Appointments</option>
                    <option>Pending Follow-ups</option>
                    <option>Overdue Payments</option>
                  </select>
                )}
              </div>

              {/* Channel Selection */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Send Via</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-5 py-3 rounded-xl border-2 border-green-500 bg-green-50 text-green-700 transition-all min-h-[44px] flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button className="px-5 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all min-h-[44px] flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" />
                    SMS
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Message</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                  placeholder="Type your message or select a template..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">{messageContent.length} characters</p>
                  {selectedTemplate && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.fields.map((field) => (
                        <span key={field} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {'{' + field + '}'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Fields */}
              {selectedTemplate && selectedTemplate.fields.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Fill Template Fields</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field}>
                        <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
                        <input
                          type="text"
                          placeholder={field}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors min-h-[44px]">
                  Save Draft
                </button>
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 min-h-[44px] flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </div>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <h3 className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Messages
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                        {msg.recipient.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-gray-900">{msg.recipient}</p>
                        <p className="text-sm text-gray-500 mt-1">{msg.message}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-500 mb-2">{msg.time}</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${getStatusColor(msg.status)}`}>
                        {msg.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {msg.type}
                    </span>
                    <button className="text-xs text-blue-600 hover:text-blue-700">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-gray-600 text-sm mb-1">Sent Today</p>
          <p className="text-gray-900">47</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-gray-600 text-sm mb-1">Delivered</p>
          <p className="text-gray-900">45</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <CheckCircle className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-gray-600 text-sm mb-1">Read</p>
          <p className="text-gray-900">38</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <CheckCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-gray-600 text-sm mb-1">Pending</p>
          <p className="text-gray-900">2</p>
        </div>
      </div>
    </div>
  );
}
