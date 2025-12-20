import { useState } from 'react';
import { Clock, User, AlertCircle, CheckCircle, Activity, ArrowUp, ArrowDown } from 'lucide-react';

type QueueItem = {
  id: string;
  patientName: string;
  patientId: string;
  doctor: string;
  arrivalTime: string;
  status: 'waiting' | 'consulting' | 'completed';
  priority: 'normal' | 'high' | 'emergency';
  appointmentType: string;
  estimatedWait: number;
};

export default function QueueManagement() {
  const [queue, setQueue] = useState<QueueItem[]>([
    {
      id: 'Q001',
      patientName: 'Rahul Verma',
      patientId: 'PT001',
      doctor: 'Dr. Amit Sharma',
      arrivalTime: '09:00',
      status: 'consulting',
      priority: 'normal',
      appointmentType: 'Follow-up',
      estimatedWait: 0
    },
    {
      id: 'Q002',
      patientName: 'Priya Sharma',
      patientId: 'PT002',
      doctor: 'Dr. Priya Patel',
      arrivalTime: '09:15',
      status: 'waiting',
      priority: 'normal',
      appointmentType: 'New Patient',
      estimatedWait: 5
    },
    {
      id: 'Q003',
      patientName: 'Emergency Case',
      patientId: 'PT099',
      doctor: 'Dr. Rajesh Kumar',
      arrivalTime: '09:20',
      status: 'waiting',
      priority: 'emergency',
      appointmentType: 'Emergency',
      estimatedWait: 2
    },
    {
      id: 'Q004',
      patientName: 'Amit Patel',
      patientId: 'PT003',
      doctor: 'Dr. Amit Sharma',
      arrivalTime: '09:25',
      status: 'waiting',
      priority: 'high',
      appointmentType: 'Follow-up',
      estimatedWait: 15
    },
    {
      id: 'Q005',
      patientName: 'Sneha Reddy',
      patientId: 'PT004',
      doctor: 'Dr. Meera Singh',
      arrivalTime: '09:30',
      status: 'waiting',
      priority: 'normal',
      appointmentType: 'Procedure',
      estimatedWait: 20
    },
    {
      id: 'Q006',
      patientName: 'Vikram Singh',
      patientId: 'PT005',
      doctor: 'Dr. Priya Patel',
      arrivalTime: '09:35',
      status: 'waiting',
      priority: 'normal',
      appointmentType: 'Consultation',
      estimatedWait: 25
    },
    {
      id: 'Q007',
      patientName: 'Anjali Mehta',
      patientId: 'PT006',
      doctor: 'Dr. Rajesh Kumar',
      arrivalTime: '09:40',
      status: 'waiting',
      priority: 'normal',
      appointmentType: 'Checkup',
      estimatedWait: 30
    },
    {
      id: 'Q008',
      patientName: 'Ravi Kumar',
      patientId: 'PT007',
      doctor: 'Dr. Amit Sharma',
      arrivalTime: '09:45',
      status: 'waiting',
      priority: 'normal',
      appointmentType: 'Follow-up',
      estimatedWait: 35
    },
  ]);

  const waiting = queue.filter(q => q.status === 'waiting');
  const consulting = queue.filter(q => q.status === 'consulting');
  const completed = queue.filter(q => q.status === 'completed');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return Clock;
      case 'consulting': return Activity;
      case 'completed': return CheckCircle;
      default: return User;
    }
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const newQueue = [...queue];
      [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
      setQueue(newQueue);
    }
  };

  const moveDown = (index: number) => {
    if (index < queue.length - 1) {
      const newQueue = [...queue];
      [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      setQueue(newQueue);
    }
  };

  const averageWait = waiting.length > 0 
    ? Math.round(waiting.reduce((sum, item) => sum + item.estimatedWait, 0) / waiting.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Queue Management</h2>
        <p className="text-gray-500 mt-1">Live patient queue and status monitoring</p>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs">Live</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Waiting</p>
          <p className="text-gray-900">{waiting.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">Active</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">In Consultation</p>
          <p className="text-gray-900">{consulting.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs">Today</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Completed</p>
          <p className="text-gray-900">{completed.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs">Avg</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Avg. Wait Time</p>
          <p className="text-gray-900">{averageWait} mins</p>
        </div>
      </div>

      {/* Priority Cases Alert */}
      {waiting.some(q => q.priority === 'emergency' || q.priority === 'high') && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="text-white">Priority Cases in Queue</p>
              <p className="text-red-50 text-sm mt-1">
                {waiting.filter(q => q.priority === 'emergency').length} emergency • {waiting.filter(q => q.priority === 'high').length} high priority
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
              <h3 className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Waiting List ({waiting.length})
              </h3>
            </div>
            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {waiting.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No patients waiting</p>
                </div>
              ) : (
                waiting.map((item, index) => {
                  const StatusIcon = getStatusIcon(item.status);
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-xl border-2 ${getPriorityBg(item.priority)} hover:shadow-lg transition-all`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Queue Number */}
                        <div className={`w-12 h-12 ${getPriorityColor(item.priority)} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                          <span className="text-lg">{index + 1}</span>
                        </div>

                        {/* Patient Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-gray-900">{item.patientName}</p>
                              <p className="text-sm text-gray-500">{item.patientId} • {item.doctor}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-gray-500">Arrived</p>
                              <p className="text-gray-900">{item.arrivalTime}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200">
                                {item.appointmentType}
                              </span>
                              {item.priority !== 'normal' && (
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                  item.priority === 'emergency' 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                                }`}>
                                  {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">Wait: ~{item.estimatedWait}m</span>
                          </div>
                        </div>

                        {/* Priority Controls */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveUp(queue.indexOf(item))}
                            disabled={index === 0}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => moveDown(queue.indexOf(item))}
                            disabled={index === waiting.length - 1}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ArrowDown className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-sm min-h-[44px]">
                          Call Next
                        </button>
                        <button className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm min-h-[44px]">
                          Notify Patient
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Currently Consulting & Next in Line */}
        <div className="space-y-6">
          {/* Currently Consulting */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h3 className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Currently Consulting
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {consulting.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No active consultations</p>
                </div>
              ) : (
                consulting.map((item) => (
                  <div key={item.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 text-sm">{item.patientName}</p>
                        <p className="text-xs text-gray-500">{item.doctor}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Started: {item.arrivalTime}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">In Progress</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Next in Line */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <h3 className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Next in Line
              </h3>
            </div>
            <div className="p-6">
              {waiting.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Queue is empty</p>
                </div>
              ) : (
                <div className="p-5 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <span className="text-lg">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{waiting[0].patientName}</p>
                      <p className="text-sm text-gray-500">{waiting[0].patientId}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Doctor:</span>
                      <span className="text-gray-900">{waiting[0].doctor}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900">{waiting[0].appointmentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Wait Time:</span>
                      <span className="text-gray-900">~{waiting[0].estimatedWait}m</span>
                    </div>
                  </div>
                  <button className="w-full px-4 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 min-h-[44px]">
                    Call Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
