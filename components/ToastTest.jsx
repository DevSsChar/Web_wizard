"use client";
import toast from 'react-hot-toast';

export default function ToastTest() {
  const testToasts = () => {
    // Test join toast
    toast.success('John joined the chat', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });

    // Test leave toast after 1 second
    setTimeout(() => {
      toast('Mike left the chat', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#6B7280',
          color: '#fff',
        },
      });
    }, 1000);

    // Test message toast after 2 seconds
    setTimeout(() => {
      toast('New message from Sarah', {
        duration: 2000,
        position: 'top-right',
        style: {
          background: '#3B82F6',
          color: '#fff',
        },
      });
    }, 2000);
  };

  return (
    <div className="p-4">
      <button 
        onClick={testToasts}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Test Toast Notifications
      </button>
    </div>
  );
}