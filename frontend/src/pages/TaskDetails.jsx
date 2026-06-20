import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../hooks/useAuth';
import { FiArrowLeft, FiPaperclip, FiDownload, FiX, FiUpload, FiSend } from 'react-icons/fi';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTask(),
        loadComments(),
        loadAttachments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      console.log('📋 Task loaded:', res.data.task);
      setTask(res.data.task);
    } catch (error) {
      console.error('❌ Error loading task:', error);
    }
  };

  const loadComments = async () => {
    try {
      console.log('📡 Fetching comments for task:', id);
      const res = await api.get(`/tasks/${id}/comments`);
      console.log('💬 Comments response:', res.data);
      const commentsData = res.data.comments || res.data || [];
      setComments(commentsData);
    } catch (error) {
      console.error('❌ Error loading comments:', error);
      setComments([]);
    }
  };

  const loadAttachments = async () => {
    try {
      const res = await api.get(`/tasks/${id}/attachments`);
      setAttachments(res.data.attachments || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
      setAttachments([]);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      setTask({ ...task, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleProgressChange = async (newProgress) => {
    try {
      console.log('📊 Updating progress to:', newProgress);
      const response = await api.patch(`/tasks/${id}/progress`, { progress: newProgress });
      console.log('✅ Progress updated:', response.data);
      setTask(response.data.task || { ...task, progress: newProgress });
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      console.warn('⚠️ Comment is empty');
      return;
    }

    setSubmittingComment(true);
    console.log('📡 Adding comment to task:', id);
    console.log('💬 Comment text:', newComment);

    try {
      const response = await api.post(`/tasks/${id}/comments`, { 
        message: newComment 
      });
      console.log('✅ Comment added:', response.data);
      
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      console.error('❌ Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Error adding comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      await api.post(`/tasks/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFile(null);
      loadAttachments();
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId, filename) => {
    try {
      const response = await api.get(`/tasks/${id}/attachments/${attachmentId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (window.confirm('Delete this attachment?')) {
      try {
        await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
        loadAttachments();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!task) return <div className="text-center py-12">Task not found</div>;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const progress = task.progress || 0;

  const getProgressColor = (p) => {
    if (p >= 80) return 'bg-green-500';
    if (p >= 50) return 'bg-blue-500';
    if (p >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getProgressText = (p) => {
    if (p >= 80) return '🌟 Excellent Progress!';
    if (p >= 50) return '💪 Halfway There!';
    if (p >= 25) return '🚀 Getting Started!';
    return '📋 Not Started Yet';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/tasks')} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <FiArrowLeft /> Back to Tasks
        </button>
      </div>

      {/* Task Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
        <p className="text-gray-600 mb-6">{task.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">Assigned To</p>
            <p className="font-medium text-gray-800">{task.assignedTo?.fullName || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Priority</p>
            <p className={`font-medium capitalize ${task.priority === 'urgent' ? 'text-red-600' : 'text-gray-800'}`}>
              {task.priority || 'medium'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Category</p>
            <p className="font-medium text-gray-800">{task.category || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
              {task.status || 'new'}
            </span>
          </div>
        </div>

        {/* ✅ PROGRESS SECTION - Only Number Buttons, No Slider */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
          </div>
          
          {/* Progress Status Text */}
          <p className="text-xs text-gray-500 mt-1">{getProgressText(progress)}</p>
          
          {/* ✅ NUMBER BUTTONS - Always Visible for Everyone */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1.5">Update progress:</p>
            <div className="flex gap-2 flex-wrap">
              {[0, 25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  onClick={() => handleProgressChange(value)}
                  className={`w-12 h-10 text-sm font-medium rounded-lg border transition-all ${
                    progress === value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status - Only if user can edit */}
        {(isAdmin || task.assignedTo?._id === user?.id || task.assignedTo === user?.id) && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
            <select
              value={task.status || 'new'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        )}
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiPaperclip /> Attachments
        </h2>
        
        <div className="flex gap-2 mb-4">
          <input type="file" onChange={handleFileSelect} className="flex-1 border rounded-lg p-2" />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        
        {attachments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No attachments yet</p>
        ) : (
          <div className="space-y-2">
            {attachments.map(att => (
              <div key={att._id} className="flex justify-between items-center border rounded-lg p-3">
                <span className="text-sm">{att.originalname}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload(att._id, att.originalname)} className="text-blue-600 hover:text-blue-800">
                    <FiDownload />
                  </button>
                  {(isAdmin || task.assignedTo?._id === user?.id || task.assignedTo === user?.id) && (
                    <button onClick={() => handleDeleteAttachment(att._id)} className="text-red-600 hover:text-red-800">
                      <FiX />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Comments ({comments.length})</h2>
        
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows="3"
            disabled={submittingComment}
          />
          <button 
            onClick={handleAddComment}
            disabled={!newComment.trim() || submittingComment}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FiSend /> {submittingComment ? 'Sending...' : 'Add Comment'}
          </button>
        </div>
        
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-gray-800">{comment.user?.fullName || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{formatDate(comment.createdAt)}</p>
                </div>
                <p className="text-gray-700 mt-1">{comment.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;