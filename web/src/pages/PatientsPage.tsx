import React, { useState, useEffect } from 'react';
import { getPatients, Patient } from '../services/patients';
import AddPatientModal from '../components/AddPatientModal';

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const result = await getPatients();
      console.log('📋 Raw result:', result);
      
      // Handle different response formats
      let patientList: Patient[] = [];
      
      if (Array.isArray(result)) {
        patientList = result;
      } else if (result && result.data && Array.isArray(result.data)) {
        patientList = result.data;
      } else if (result && result.patients && Array.isArray(result.patients)) {
        patientList = result.patients;
      } else {
        // Try to find any array in the response
        for (const key in result) {
          if (result[key] && Array.isArray(result[key])) {
            patientList = result[key];
            break;
          }
        }
      }
      
      console.log('📋 Patients list:', patientList);
      setPatients(patientList);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load patients:', err);
      setError('Failed to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
        </div>
        <div className="text-center py-8">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
        </div>
        <div className="text-center py-8 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Patient
        </button>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No patients found. Click "Add Patient" to register one.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Tier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.age || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.gender || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.district || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${patient.risk_tier === 'high' ? 'bg-red-100 text-red-800' : 
                        patient.risk_tier === 'elevated' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}
                    >
                      {patient.risk_tier || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchPatients();
        }}
      />
    </div>
  );
};

export default PatientsPage;
