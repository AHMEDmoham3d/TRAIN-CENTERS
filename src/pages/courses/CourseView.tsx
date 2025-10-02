import React from 'react';
import { useParams } from 'react-router-dom';

function CourseView() {
  const { courseId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Course View</h1>
        <p className="text-gray-600">Course ID: {courseId}</p>
        {/* Course content will be implemented later */}
      </div>
    </div>
  );
}

export default CourseView;