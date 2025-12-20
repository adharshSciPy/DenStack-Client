import { useState } from 'react';
import { Send, Paperclip, Search, Users, User, Stethoscope, FlaskConical, Pill, Shield } from 'lucide-react';

type Message = {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
  attachment?: string;
};

type Channel = {
  id: string;
  name: string;
  type: 'doctor' | 'lab' | 'pharmacy' | 'admin';
  unread: number;
  lastMessage: string;
  lastTime: string;
  online: boolean;
};

export default function InternalChat() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const channels: Channel[] = [
    {
      id: 'C001',
      name: 'Dr. Amit Sharma',
      type: 'doctor',
      unread: 2,
      lastMessage: 'Patient in Room 101 needs blood work',
      lastTime: '2 mins ago',
      online: true
    },
    {
      id: 'C002',
      name: 'Dr. Priya Patel',
      type: 'doctor',
      unread: 0,
      lastMessage: 'Thanks for the update',
      lastTime: '15 mins ago',
      online: true
    },
    {
      id: 'C003',
      name: 'Laboratory',
      type: 'lab',
      unread: 1,
      lastMessage: 'CBC results ready for PT001',
      lastTime: '30 mins ago',
      online: true
    },
    {
      id: 'C004',
      name: 'Pharmacy',
      type: 'pharmacy',
      unread: 0,
      lastMessage: 'Prescription filled for Rahul Verma',
      lastTime: '1 hour ago',
      online: false
    },
    {
      id: 'C005',
      name: 'Admin Office',
      type: 'admin',
      unread: 3,
      lastMessage: 'Please update patient records',
      lastTime: '2 hours ago',
      online: true
    },
    {
      id: 'C006',
      name: 'Dr. Rajesh Kumar',
      type: 'doctor',
      unread: 0,
      lastMessage: 'Send the next patient',
      lastTime: '3 hours ago',
      online: false
    },
  ];

  const messages: { [key: string]: Message[] } = {
    'C001': [
      {
        id: 'M001',
        sender: 'Dr. Amit Sharma',
        content: 'Can you send the next patient to Room 101?',
        time: '10:30 AM',
        isOwn: false
      },
      {
        id: 'M002',
        sender: 'You',
        content: 'Sure, sending Priya Sharma now',
        time: '10:31 AM',
        isOwn: true
      },
      {
        id: 'M003',
        sender: 'Dr. Amit Sharma',
        content: 'Patient in Room 101 needs blood work. Can you coordinate with lab?',
        time: '10:45 AM',
        isOwn: false
      },
      {
        id: 'M004',
        sender: 'You',
        content: 'Will arrange lab tech immediately',
        time: '10:46 AM',
        isOwn: true
      },
    ],
    'C003': [
      {
        id: 'M005',
        sender: 'Laboratory',
        content: 'CBC results ready for PT001 - Rahul Verma',
        time: '11:00 AM',
        isOwn: false
      },
      {
        id: 'M006',
        sender: 'You',
        content: 'Great! Will inform Dr. Sharma',
        time: '11:01 AM',
        isOwn: true
      },
    ],
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'doctor': return Stethoscope;
      case 'lab': return FlaskConical;
      case 'pharmacy': return Pill;
      case 'admin': return Shield;
      default: return User;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'doctor': return 'blue';
      case 'lab': return 'purple';
      case 'pharmacy': return 'green';
      case 'admin': return 'orange';
      default: return 'gray';
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChannel) {
      // Add message logic here
      setMessageInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Internal Communication</h2>
        <p className="text-gray-500 mt-1">Chat with doctors, lab, pharmacy, and admin</p>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[700px] flex">
        {/* Channels List */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search channels..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {channels.map((channel) => {
              const Icon = getChannelIcon(channel.type);
              const color = getChannelColor(channel.type);
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${
                    selectedChannel?.id === channel.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${color}-600`} />
                      </div>
                      {channel.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm text-gray-900 truncate">{channel.name}</p>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{channel.lastTime}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{channel.lastMessage}</p>
                      {channel.unread > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs">
                            {channel.unread}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 bg-${getChannelColor(selectedChannel.type)}-100 rounded-full flex items-center justify-center`}>
                        {(() => {
                          const Icon = getChannelIcon(selectedChannel.type);
                          return <Icon className={`w-6 h-6 text-${getChannelColor(selectedChannel.type)}-600`} />;
                        })()}
                      </div>
                      {selectedChannel.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900">{selectedChannel.name}</p>
                      <p className="text-xs text-gray-500">
                        {selectedChannel.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <Users className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(messages[selectedChannel.id] || []).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.isOwn
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.attachment && (
                          <div className="mt-2 p-2 bg-white/10 rounded-lg flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            <span className="text-xs">{message.attachment}</span>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${message.isOwn ? 'text-right' : 'text-left'}`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <button className="p-3 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Channel Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-900 mb-2">Select a channel to start messaging</p>
                <p className="text-sm text-gray-500">Choose from doctors, lab, pharmacy, or admin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
          <Stethoscope className="w-8 h-8 mb-3" />
          <p className="text-blue-100 text-sm mb-1">Active Doctors</p>
          <p className="text-white text-2xl">{channels.filter(c => c.type === 'doctor' && c.online).length}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
          <FlaskConical className="w-8 h-8 mb-3" />
          <p className="text-purple-100 text-sm mb-1">Lab Updates</p>
          <p className="text-white text-2xl">{channels.filter(c => c.type === 'lab').reduce((sum, c) => sum + c.unread, 0)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
          <Pill className="w-8 h-8 mb-3" />
          <p className="text-green-100 text-sm mb-1">Pharmacy</p>
          <p className="text-white text-2xl">{channels.filter(c => c.type === 'pharmacy' && c.online).length}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
          <Shield className="w-8 h-8 mb-3" />
          <p className="text-orange-100 text-sm mb-1">Unread Messages</p>
          <p className="text-white text-2xl">{channels.reduce((sum, c) => sum + c.unread, 0)}</p>
        </div>
      </div>
    </div>
  );
}
