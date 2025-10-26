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
import { useFormsTranslation } from '@/hooks/useTranslation';

interface CreateVehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (data: CreateVehicleRequest | UpdateVehicleRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const createVehicleValidationSchema = (
  t: (key: string, options?: Record<string, unknown>) => string
) =>
  Yup.object({
    type: Yup.string()
      .oneOf(Object.values(VehicleType), t('validation.role'))
      .required(t('validation.required')),
    registration: Yup.string()
      .min(3, t('validation.minLength', { min: 3 }))
      .max(50, t('validation.maxLength', { max: 50 }))
      .matches(/^[A-Z0-9-]+$/i, t('validation.licensePlateFormat'))
      .required(t('validation.required')),
    description: Yup.string()
      .max(500, t('validation.maxLength', { max: 500 }))
      .nullable(),
    status: Yup.string()
      .oneOf(Object.values(VehicleStatus), t('validation.role'))
      .required(t('validation.required')),
  });

export const CreateVehicleForm: React.FC<CreateVehicleFormProps> = ({
  vehicle,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useFormsTranslation();
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
          {isEditing ? t('sections.updateVehicle') : t('sections.addVehicle')}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEditing ? t('messages.updateVehicleDescription') : t('messages.addVehicleDescription')}
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={createVehicleValidationSchema(t)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched }) => (
          <Form className="space-y-6">
            {/* Vehicle Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                {t('labels.vehicleType')} *
              </label>
              <Field
                as="select"
                id="type"
                name="type"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.type && touched.type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">{t('messages.selectVehicleType')}</option>
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
                {t('labels.licensePlate')} *
              </label>
              <Field
                type="text"
                id="registration"
                name="registration"
                placeholder={t('placeholders.licensePlate')}
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
                {t('labels.productDescription')}
              </label>
              <Field
                as="textarea"
                id="description"
                name="description"
                rows={3}
                placeholder={t('placeholders.enterDescription')}
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
                {t('labels.status')} *
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
                  {t('buttons.cancel')}
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
                    {isEditing ? t('messages.updating') : t('messages.creating')}
                  </div>
                ) : isEditing ? (
                  t('buttons.update')
                ) : (
                  t('buttons.create')
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
