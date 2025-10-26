import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { Formik, Form, type FormikHelpers } from 'formik';
import { Label } from '../ui/label';
import { useFormsTranslation } from '@/hooks/useTranslation';

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'missing';

interface Document {
  status: DocumentStatus;
  fileName: string | null;
  uploadDate: string | null;
  label: string;
  placeholder: string;
}

export interface KYCFormProps {
  kycDocuments: Record<string, Document>;
  kycUploading: string | null;
  onDocumentUpload?: (documentType: string, file: File) => Promise<void>;
}

const KYCForm = ({ kycDocuments, kycUploading, onDocumentUpload }: KYCFormProps) => {
  const { t } = useFormsTranslation();
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    documentType: string,
    setFieldValue: FormikHelpers<Record<string, Document>>['setFieldValue']
  ) => {
    const file = e.target.files?.[0];
    if (file && onDocumentUpload) {
      setUploadingDocument(documentType);
      try {
        await onDocumentUpload(documentType, file);
        await setFieldValue(`documents.${documentType}`, {
          status: 'pending',
          fileName: file.name,
          uploadDate: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error uploading document:', error);
      } finally {
        setUploadingDocument(null);
      }
    }
  };

  const handleFormSubmit = async (
    values: Record<string, Document>,
    formikHelpers: FormikHelpers<Record<string, Document>>
  ) => {
    try {
      console.log(values, formikHelpers);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      formikHelpers.setSubmitting(false);
    }
  };

  const getKycStatusInfo = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: t('status.verified'),
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: t('status.pending'),
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: t('status.rejected'),
        };
      default:
        return {
          icon: Upload,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: t('status.missing'),
        };
    }
  };

  return (
    <Formik initialValues={kycDocuments} onSubmit={handleFormSubmit}>
      {({ isSubmitting, setFieldValue }) => (
        <Form id="profile-form" className="space-y-6">
          {kycDocuments && onDocumentUpload && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(kycDocuments).map(([docType, doc]) => (
                <div key={docType} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{doc.label}</Label>
                    <Badge
                      variant="outline"
                      className={`${getKycStatusInfo(doc.status).bgColor} ${getKycStatusInfo(doc.status).color} ${getKycStatusInfo(doc.status).borderColor}`}
                    >
                      {getKycStatusInfo(doc.status).label}
                    </Badge>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-44">
                    {doc.fileName ? (
                      <div className="space-y-2">
                        <FileText className="h-8 w-8 mx-auto text-tsa-blue" />
                        <p className="text-sm font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('kyc.messages.uploadedOn')}{' '}
                          {new Date(doc.uploadDate!).toLocaleDateString('fr-FR')}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                          <label
                            htmlFor={`${docType}-upload`}
                            className="cursor-pointer flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t('kyc.buttons.replace')}
                          </label>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {kycUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                        )}
                        <p className="text-sm text-muted-foreground">{doc.placeholder}</p>
                        <Button variant="outline" size="sm" disabled={kycUploading === docType}>
                          <label
                            htmlFor={`${docType}-upload`}
                            className="cursor-pointer flex items-center"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {kycUploading === docType
                              ? t('kyc.messages.uploading')
                              : t('kyc.buttons.chooseFile')}
                          </label>
                        </Button>
                      </div>
                    )}
                    <input
                      type="file"
                      id={`${docType}-upload`}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, docType, setFieldValue)}
                      disabled={uploadingDocument === docType || isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default KYCForm;
