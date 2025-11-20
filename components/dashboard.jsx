"use client"

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GridBackground from './ui/grid-background';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Activity, 
  MessageSquare, 
  Edit,
  X,
  Save,
  Camera,
  Phone,
  MapPin,
  Building,
  Globe,
  Info,
  CheckCircle,
  Upload,
  Loader2,
  ChevronRight,
  RefreshCcw,
  Check,
  AlertTriangle,
  Menu
} from 'lucide-react';

export default function Dashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    username: '',
    phone: '',
    location: '',
    company: '',
    website: '',
    image: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const resetForm = () => {
    if (!userProfile && !session?.user) return;
    setProfileData({
      name: userProfile?.name || session?.user?.name || '',
      bio: userProfile?.bio || '',
      username: userProfile?.username || '',
      phone: userProfile?.phone || '',
      location: userProfile?.location || '',
      company: userProfile?.company || '',
      website: userProfile?.website || '',
      image: userProfile?.image || session?.user?.image || ''
    });
    
    // Show reset confirmation message
    setMessage({ type: 'info', text: 'Form has been reset to saved values' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);
  
  // Calculate profile completion percentage
  useEffect(() => {
    if (!userProfile) return;
    
    const requiredFields = ['name', 'username', 'bio'];
    const optionalFields = ['phone', 'location', 'company', 'website', 'image'];
    
    let completed = 0;
    let total = requiredFields.length + optionalFields.length;
    
    // Required fields count more toward completion
    requiredFields.forEach(field => {
      if (userProfile[field]) completed += 1;
    });
    
    // Optional fields
    optionalFields.forEach(field => {
      if (userProfile[field]) completed += 0.5;
    });
    
    // Calculate percentage (required fields are worth double)
    const percentage = Math.min(Math.round((completed / (requiredFields.length + (optionalFields.length * 0.5))) * 100), 100);
    setCompletionPercentage(percentage);
  }, [userProfile]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setProfileData({
          name: data.user.name || '',
          bio: data.user.bio || '',
          username: data.user.username || '',
          phone: data.user.phone || '',
          location: data.user.location || '',
          company: data.user.company || '',
          website: data.user.website || '',
          image: data.user.image || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, image: reader.result }));
        setIsUploading(false);
        setMessage({ type: 'success', text: 'Image uploaded successfully. Remember to save your changes!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload failed:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
      setIsUploading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setUserProfile(result.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        await update({
          ...session,
          user: {
            ...session.user,
            name: result.user.name,
            image: result.user.image,
          }
        });

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0f1014]">
        <GridBackground className="absolute inset-0 opacity-50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <p className="text-gray-400 text-lg font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      {/* Fixed position grid background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <GridBackground className="w-full h-full opacity-40" />
      </div>
      
      {/* Message Display */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`py-3 px-5 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-3 max-w-md border ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : message.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              {message.type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
              {message.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
              {message.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Width Layout */}
      <div className="min-h-screen bg-[#0f1014] pt-20 pb-24 w-full relative z-10">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-24 left-4 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 text-white hover:bg-gray-700/80 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex min-h-[calc(100vh-176px)]">
          {/* Sidebar - Responsive */}
          <div className={`w-72 flex-shrink-0 bg-[#0A0A10] border-r border-gray-800/30 fixed left-0 top-20 bottom-0 overflow-y-auto z-40 transition-transform duration-300 lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}>
            {/* Mobile Close Button */}
            <div className="lg:hidden flex justify-end p-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 lg:pt-6 pt-0">
              {/* Avatar with initial */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative group">
                  <img
                    src={userProfile?.image || session?.user?.image || 'https://via.placeholder.com/80?text=You'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-2 border-teal-500 shadow-lg object-cover"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-white font-bold">
                  {userProfile?.name || session?.user?.name || 'Your Profile'}
                </h2>
                <p className="text-gray-400 text-sm truncate">
                  {userProfile?.email || session?.user?.email}
                </p>
              </div>
              
              {/* Profile Completion */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-gray-400">Profile completion</p>
                  <p className={`text-sm ${
                    completionPercentage > 70 ? 'text-green-400' :
                    completionPercentage > 30 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {completionPercentage}%
                  </p>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      completionPercentage > 70 ? 'bg-green-500' :
                      completionPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Menu - Exactly matching screenshot */}
            <div className="py-2">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-6 py-3 flex items-center ${
                  activeTab === 'profile' 
                    ? 'bg-indigo-900/20 border-l-2 border-indigo-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800/30'
                }`}
              >
                <User className="w-5 h-5 mr-3" />
                <span>My Profile</span>
                {activeTab === 'profile' && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('account');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-6 py-3 flex items-center ${
                  activeTab === 'account' 
                    ? 'bg-indigo-900/20 border-l-2 border-indigo-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800/30'
                }`}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span>Account</span>
                {activeTab === 'account' && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('privacy');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-6 py-3 flex items-center ${
                  activeTab === 'privacy' 
                    ? 'bg-indigo-900/20 border-l-2 border-indigo-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800/30'
                }`}
              >
                <Shield className="w-5 h-5 mr-3" />
                <span>Privacy</span>
                {activeTab === 'privacy' && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('notifications');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-6 py-3 flex items-center ${
                  activeTab === 'notifications' 
                    ? 'bg-indigo-900/20 border-l-2 border-indigo-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800/30'
                }`}
              >
                <Bell className="w-5 h-5 mr-3" />
                <span>Notifications</span>
                {activeTab === 'notifications' && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-30 top-20"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}
          
          {/* Main Content Area - Responsive with proper margins */}
          <div className="flex-1 lg:ml-72 ml-0 overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="p-3 sm:p-4 lg:p-6">
              {/* Profile Content */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  {/* Profile Form Card */}
                  <form onSubmit={handleProfileUpdate}>
                    <div className="bg-[#141419]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800/50 p-4 sm:p-6 gap-4">
                        <h2 className="text-lg sm:text-xl font-bold text-white">Profile Information</h2>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <motion.button
                            type="button"
                            onClick={resetForm}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex-1 sm:flex-none p-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-700/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <RefreshCcw className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">Reset</span>
                          </motion.button>
                          <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span className="text-sm">Save</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                          {/* Profile Details - Left Column */}
                          <div>
                            {/* Basic Info Section */}
                            <div className="mb-6 lg:mb-8">
                              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-400" />
                                Basic Information
                              </h3>
                              
                              <div className="space-y-4 lg:space-y-5">
                                {/* Name Field */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Full Name <span className="text-red-400">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 focus:border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
                                    placeholder="Enter your full name"
                                    required
                                  />
                                </div>
                                
                                {/* Username Field */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Username <span className="text-red-400">*</span>
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                                    <input
                                      type="text"
                                      value={profileData.username}
                                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                                      className="w-full pl-8 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 focus:border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
                                      placeholder="username"
                                      required
                                    />
                                  </div>
                                </div>
                                
                                {/* Bio Field */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Bio <span className="text-red-400">*</span>
                                  </label>
                                  <textarea
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 focus:border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
                                    placeholder="Tell us about yourself..."
                                    required
                                  />
                                  <p className="mt-1.5 text-xs text-gray-500">
                                    {profileData.bio.length}/500 characters
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Contact Info Section */}
                            <div>
                              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-blue-400" />
                                Contact Details
                              </h3>
                              
                              <div className="space-y-5">
                                {/* Phone Field */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Phone Number
                                  </label>
                                  <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 focus:border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
                                    placeholder="+1 (555) 123-4567"
                                  />
                                </div>
                                
                                {/* Location Field */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Location
                                  </label>
                                  <input
                                    type="text"
                                    value={profileData.location}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 focus:border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
                                    placeholder="City, Country"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column */}
                          <div>
                            {/* Profile Picture */}
                            <div className="mb-8">
                              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-green-400" />
                                Profile Picture
                              </h3>
                              
                              <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-6 flex flex-col items-center">
                                <div className="relative group">
                                  <img
                                    src={profileData.image || userProfile?.image || session?.user?.image || 'https://via.placeholder.com/150?text=Upload'}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full border-4 border-gray-700/50 shadow-lg object-cover"
                                  />
                                  <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200"
                                  >
                                    {isUploading ? (
                                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    ) : (
                                      <Camera className="w-8 h-8 text-white" />
                                    )}
                                  </div>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="mt-4 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm flex items-center gap-2 transition-colors"
                                >
                                  <Upload className="w-4 h-4" />
                                  {profileData.image ? 'Change Avatar' : 'Upload Avatar'}
                                </button>
                                
                                <p className="mt-3 text-xs text-gray-500 text-center">
                                  JPEG, PNG or GIF. Max size 5MB.
                                </p>
                              </div>
                            </div>
                            
                            {/* Professional Info */}
                            <div>
                              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Building className="w-4 h-4 text-yellow-400" />
                                Professional Details
                              </h3>
                              
                              <div className="space-y-5">
                                {/* Company Field */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Company
                                  </label>
                                  <input
                                    type="text"
                                    value={profileData.company}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 focus:border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
                                    placeholder="Company name"
                                  />
                                </div>
                                
                                {/* Website Field */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Website
                                  </label>
                                  <input
                                    type="url"
                                    value={profileData.website}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 focus:border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors"
                                    placeholder="https://yourwebsite.com"
                                  />
                                </div>
                                
                                {/* Email Display (readonly) */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Email Address
                                  </label>
                                  <input
                                    type="email"
                                    value={userProfile?.email || session?.user?.email || ''}
                                    className="w-full px-4 py-2.5 bg-gray-800/20 border border-gray-700/30 rounded-lg text-gray-400 cursor-not-allowed"
                                    disabled
                                  />
                                  <p className="mt-1.5 text-xs text-gray-500">
                                    To change email, please contact support
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Form Footer */}
                      <div className="border-t border-gray-800/50 p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3">
                        <motion.button
                          type="submit"
                          disabled={isLoading}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save All Changes</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                  
                  {/* Required Fields Notice */}
                  <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-400 text-sm font-medium">Complete your profile</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Fields marked with <span className="text-red-400">*</span> are required to complete your profile.
                        A complete profile helps others find and connect with you.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'account' && userProfile && (
                <div className="space-y-8">
                  {/* User Overview Card */}
                  <div className="bg-[#141419]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800/50">
                      <h2 className="text-xl font-bold text-white">Account Overview</h2>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <img 
                          src={userProfile.image || 'https://via.placeholder.com/120?text=You'}
                          alt="Profile"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-teal-500/30 shadow-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                            {userProfile.name || 'No name set'}
                          </h3>
                          <p className="text-gray-400 text-base sm:text-lg mb-1">
                            @{userProfile.username || 'username not set'}
                          </p>
                          <p className="text-gray-400 text-sm sm:text-base">{userProfile.email}</p>
                          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              userProfile.isProfileCompleted 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {userProfile.isProfileCompleted ? 'Profile Complete' : 'Profile Incomplete'}
                            </span>
                            <span className="text-gray-500 text-sm">
                              Member since {new Date(userProfile.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Details Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {/* Basic Information Card */}
                    <div className="bg-[#141419]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-800/50">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-teal-400" />
                          <h3 className="text-lg font-bold text-white">Basic Information</h3>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                            <p className="text-xs font-medium text-gray-500 mb-1">FULL NAME</p>
                            <p className="text-gray-300">{userProfile.name || 'Not provided'}</p>
                          </div>
                          
                          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                            <p className="text-xs font-medium text-gray-500 mb-1">USERNAME</p>
                            <p className="text-gray-300">@{userProfile.username || 'Not set'}</p>
                          </div>
                          
                          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                            <p className="text-xs font-medium text-gray-500 mb-1">EMAIL</p>
                            <p className="text-gray-300">{userProfile.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-[#141419]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-800/50">
                        <div className="flex items-center gap-2">
                          <Phone className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-bold text-white">Contact Information</h3>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                            <p className="text-xs font-medium text-gray-500 mb-1">PHONE</p>
                            <p className="text-gray-300">{userProfile.phone || 'Not provided'}</p>
                          </div>
                          
                          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                            <p className="text-xs font-medium text-gray-500 mb-1">LOCATION</p>
                            <p className="text-gray-300">{userProfile.location || 'Not provided'}</p>
                          </div>
                          
                          {(userProfile.company || userProfile.website) && (
                            <>
                              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                                <p className="text-xs font-medium text-gray-500 mb-1">COMPANY</p>
                                <p className="text-gray-300">{userProfile.company || 'Not provided'}</p>
                              </div>
                              
                              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                                <p className="text-xs font-medium text-gray-500 mb-1">WEBSITE</p>
                                {userProfile.website ? (
                                  <a href={userProfile.website} target="_blank" rel="noopener noreferrer" 
                                    className="text-blue-400 hover:text-blue-300 transition-colors truncate block">
                                    {userProfile.website}
                                  </a>
                                ) : (
                                  <p className="text-gray-300">Not provided</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio Card */}
                  {userProfile.bio && (
                    <div className="bg-[#141419]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-800/50">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-bold text-white">About</h3>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{userProfile.bio}</p>
                      </div>
                    </div>
                  )}

                  {/* Activity Stats */}
                  <div className="bg-[#141419]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold text-white">Activity Stats</h3>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xl sm:text-2xl font-bold text-white">1,234</p>
                            <p className="text-xs text-gray-500">Messages</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-xl sm:text-2xl font-bold text-white">8</p>
                            <p className="text-xs text-gray-500">Connections</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xl sm:text-2xl font-bold text-white">98%</p>
                            <p className="text-xs text-gray-500">Security</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-800/30">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-xl sm:text-2xl font-bold text-white">5</p>
                            <p className="text-xs text-gray-500">Login Methods</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Placeholder for other tabs */}
              {(activeTab !== 'profile' && activeTab !== 'account') && (
                <div className="bg-[#141419]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-xl p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <Settings className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">Coming Soon</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    This section is currently under development. Please check back later for updates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}