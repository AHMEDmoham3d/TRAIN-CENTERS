import React from 'react';
import { useParams } from 'react-router-dom';

function AssignmentView() {
  const { assignmentId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Assignment Details</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Assignment ID: {assignmentId}</p>
        {/* Assignment content will be implemented later */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">This component is under development.</p>
        </div>
      </div>
    </div>
  );
}

export default AssignmentView;