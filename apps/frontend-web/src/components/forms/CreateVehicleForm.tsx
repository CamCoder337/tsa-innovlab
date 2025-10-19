import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  VehicleType,
  VehicleStatus,
  VehicleTypeLabels,
  VehicleStatusLabels,
} from '../../types/vehicle.types';
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
} from '../../types/vehicle.types';

interface CreateVehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (data: CreateVehicleRequest | UpdateVehicleRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const vehicleValidationSchema = Yup.object({
  type: Yup.string()
    .oneOf(Object.values(VehicleType), 'Type de véhicule invalide')
    .required('Le type de véhicule est requis'),
  registration: Yup.string()
    .min(3, "L'immatriculation doit contenir au moins 3 caractères")
    .max(50, "L'immatriculation ne peut pas dépasser 50 caractères")
    .matches(
      /^[A-Z0-9-]+$/i,
      "L'immatriculation ne peut contenir que des lettres, chiffres et tirets"
    )
    .required("L'immatriculation est requise"),
  description: Yup.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .nullable(),
  status: Yup.string()
    .oneOf(Object.values(VehicleStatus), 'Statut invalide')
    .required('Le statut est requis'),
});

export const CreateVehicleForm: React.FC<CreateVehicleFormProps> = ({
  vehicle,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = !!vehicle;

  const initialValues: CreateVehicleRequest = {
    type: vehicle?.type as VehicleType,
    registration: vehicle?.registration || '',
    description: vehicle?.description || '',
    status: vehicle?.status || VehicleStatus.AVAILABLE,
  };

  const handleSubmit = async (values: CreateVehicleRequest | UpdateVehicleRequest) => {
    const submitData = {
      ...values,
      description: values.description || null,
    };
    await onSubmit(submitData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Modifier le véhicule' : 'Ajouter un nouveau véhicule'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEditing
            ? 'Modifiez les informations de votre véhicule'
            : 'Ajoutez un nouveau véhicule à votre flotte'}
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={vehicleValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched }) => (
          <Form className="space-y-6">
            {/* Vehicle Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type de véhicule *
              </label>
              <Field
                as="select"
                id="type"
                name="type"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.type && touched.type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez un type</option>
                {Object.values(VehicleType).map((type) => (
                  <option key={type} value={type}>
                    {VehicleTypeLabels[type]}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="type" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            {/* Registration */}
            <div>
              <label
                htmlFor="registration"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Immatriculation *
              </label>
              <Field
                type="text"
                id="registration"
                name="registration"
                placeholder="Ex: AB-123-CD"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.registration && touched.registration ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <ErrorMessage
                name="registration"
                component="div"
                className="mt-1 text-sm text-red-600"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Field
                as="textarea"
                id="description"
                name="description"
                rows={3}
                placeholder="Description optionnelle du véhicule..."
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description && touched.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <ErrorMessage
                name="description"
                component="div"
                className="mt-1 text-sm text-red-600"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut *
              </label>
              <Field
                as="select"
                id="status"
                name="status"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.status && touched.status ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {Object.values(VehicleStatus).map((status) => (
                  <option key={status} value={status}>
                    {VehicleStatusLabels[status]}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="status" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isEditing ? 'Modification...' : 'Création...'}
                  </div>
                ) : isEditing ? (
                  'Modifier'
                ) : (
                  'Créer'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
