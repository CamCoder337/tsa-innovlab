import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  VehicleTypes,
  VehicleStatuses,
  type VehicleType,
  type CreateVehicleRequest,
  type UpdateVehicleRequest,
  type Vehicle,
} from '@/types/vehicle.types';
import { useFormsTranslation, useVehiclesTranslation } from '@/hooks/useTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface CreateVehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (data: CreateVehicleRequest | UpdateVehicleRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const createVehicleValidationSchema = (
  tForms: (key: string, options?: Record<string, unknown>) => string
) =>
  Yup.object({
    type: Yup.string()
      .oneOf(Object.values(VehicleTypes), tForms('validation.role'))
      .required(tForms('validation.required')),
    registration: Yup.string()
      .min(3, tForms('validation.minLength', { min: 3 }))
      .max(50, tForms('validation.maxLength', { max: 50 }))
      .matches(/^[A-Z0-9-]+$/i, tForms('validation.licensePlateFormat'))
      .required(tForms('validation.required')),
    description: Yup.string()
      .max(500, tForms('validation.maxLength', { max: 500 }))
      .nullable(),
    status: Yup.string()
      .oneOf(Object.values(VehicleStatuses), tForms('validation.role'))
      .required(tForms('validation.required')),
  });

export const CreateVehicleForm: React.FC<CreateVehicleFormProps> = ({
  vehicle,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t: tForms } = useFormsTranslation();
  const { t: tVehicles } = useVehiclesTranslation();
  const isEditing = !!vehicle;

  const initialValues: CreateVehicleRequest = {
    type: vehicle?.type as VehicleType,
    registration: vehicle?.registration || '',
    description: vehicle?.description || '',
    status: vehicle?.status || 'available',
  };

  const handleSubmit = async (values: CreateVehicleRequest | UpdateVehicleRequest) => {
    const submitData = {
      ...values,
      description: values.description || null,
    };
    await onSubmit(submitData);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createVehicleValidationSchema(tForms)}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ errors, touched, values, setFieldValue, handleChange, handleBlur }) => (
        <Form className="space-y-6">
          {/* Vehicle Type */}
          <div>
            <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              {tForms('labels.vehicleType')} *
            </Label>
            <Select value={values.type} onValueChange={(value) => setFieldValue('type', value)}>
              <SelectTrigger
                className={`w-full ${errors.type && touched.type ? 'border-red-300' : ''}`}
              >
                <SelectValue placeholder={tForms('messages.selectVehicleType')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VehicleTypes).map((type) => (
                  <SelectItem key={type} value={type}>
                    {tVehicles('types.' + type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.type && errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
          </div>

          {/* Registration */}
          <div>
            <Label htmlFor="registration" className="block text-sm font-medium text-gray-700 mb-2">
              {tForms('labels.licensePlate')} *
            </Label>
            <Input
              id="registration"
              name="registration"
              value={values.registration}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={tForms('placeholders.licensePlate')}
              className={errors.registration && touched.registration ? 'border-red-300' : ''}
            />
            {touched.registration && errors.registration && (
              <p className="text-sm text-red-500">{errors.registration}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {tForms('labels.description')}
            </Label>
            <Textarea
              id="description"
              name="description"
              value={values.description || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              placeholder={tForms('placeholders.enterDescription')}
              className={errors.description && touched.description ? 'border-red-300' : ''}
            />
            {touched.description && errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              {tForms('labels.status')} *
            </Label>
            <Select value={values.status} onValueChange={(value) => setFieldValue('status', value)}>
              <SelectTrigger
                className={`w-full ${errors.status && touched.status ? 'border-red-300' : ''}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VehicleStatuses).map((status) => (
                  <SelectItem key={status} value={status}>
                    {tVehicles('status.' + status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {touched.status && errors.status && (
              <p className="text-sm text-red-500">{errors.status}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {tForms('buttons.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="bg-tsa-blue hover:bg-tsa-blue">
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditing ? tForms('messages.updating') : tForms('messages.creating')}
                </div>
              ) : isEditing ? (
                tForms('buttons.update')
              ) : (
                tForms('buttons.create')
              )}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};
